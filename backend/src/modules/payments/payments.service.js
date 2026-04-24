const crypto = require('crypto');
const axios = require('axios');
const { prisma } = require('../../database/prisma');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const PAYMENT_CONFIG = require('../../config/payment');

const buildGatewayConfiguration = () => ({
  razorpay: PAYMENT_CONFIG.razorpay.enabled && PAYMENT_CONFIG.razorpay.keyId && PAYMENT_CONFIG.razorpay.keySecret,
  stripe: PAYMENT_CONFIG.stripe.enabled && PAYMENT_CONFIG.stripe.publishableKey && PAYMENT_CONFIG.stripe.secretKey,
  paypal: PAYMENT_CONFIG.paypal.enabled && PAYMENT_CONFIG.paypal.clientId && PAYMENT_CONFIG.paypal.clientSecret
});

const createRazorpayOrder = async ({ amountCents, order }) => {
  if (!PAYMENT_CONFIG.razorpay.keyId || !PAYMENT_CONFIG.razorpay.keySecret) {
    throw new ValidationError('Razorpay credentials are not configured');
  }

  const response = await axios.post(
    'https://api.razorpay.com/v1/orders',
    {
      amount: amountCents,
      currency: order.currencyCode || PAYMENT_CONFIG.currency || 'INR',
      receipt: order.orderNumber || `order_${order.id}`,
      payment_capture: 1,
      notes: {
        orderId: order.id,
        userId: order.userId
      }
    },
    {
      auth: {
        username: PAYMENT_CONFIG.razorpay.keyId,
        password: PAYMENT_CONFIG.razorpay.keySecret
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

const verifyRazorpaySignature = ({ gatewayOrderId, gatewayPaymentId, signature }) => {
  const payload = `${gatewayOrderId}|${gatewayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', PAYMENT_CONFIG.razorpay.keySecret)
    .update(payload)
    .digest('hex');

  return expectedSignature === signature;
};

const verifyRazorpayWebhookSignature = ({ rawBody, signature }) => {
  if (!rawBody || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', PAYMENT_CONFIG.razorpay.webhookSecret || PAYMENT_CONFIG.razorpay.keySecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
};

const upsertPaymentRecord = async ({ orderId, provider, amountCents, currencyCode, gatewayOrderId, gatewayPaymentId, gatewaySignature, status, meta }) => {
  return prisma.payment.upsert({
    where: { orderId },
    create: {
      orderId,
      provider,
      currencyCode,
      amountCents,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      transactionRef: gatewayPaymentId || gatewayOrderId,
      status,
      meta
    },
    update: {
      provider,
      currencyCode,
      amountCents,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      transactionRef: gatewayPaymentId || gatewayOrderId,
      status,
      meta
    }
  });
};

const getConfiguredCommissionPercent = () => {
  const commissionPercent = Number(PAYMENT_CONFIG.commission?.percent);
  if (!Number.isFinite(commissionPercent)) {
    return 0;
  }

  return Math.min(100, Math.max(0, commissionPercent));
};

const getVendorLinkedAccountId = (vendor) => {
  if (!vendor?.bankAccountDetails || typeof vendor.bankAccountDetails !== 'object') {
    return null;
  }

  return vendor.bankAccountDetails.razorpayLinkedAccountId
    || vendor.bankAccountDetails.razorpayRouteAccountId
    || vendor.bankAccountDetails.routeAccountId
    || vendor.bankAccountDetails.linkedAccountId
    || vendor.bankAccountDetails.accountId
    || null;
};

const mergeJsonObject = (existing, updates) => ({
  ...(existing && typeof existing === 'object' ? existing : {}),
  ...updates
});

const createRazorpayVendorTransfers = async ({ paymentId, gatewayPaymentId }) => {
  if (!PAYMENT_CONFIG.razorpay.routeEnabled) {
    return { enabled: false, skipped: true, reason: 'Razorpay Route is disabled' };
  }

  if (!gatewayPaymentId) {
    return { enabled: true, skipped: true, reason: 'Gateway payment ID is unavailable' };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          items: {
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  bankAccountDetails: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!payment) {
    throw new NotFoundError('Payment not found for transfer creation');
  }

  const previousTransferMeta = payment.meta?.razorpayTransfers;
  if (previousTransferMeta?.created === true) {
    return {
      enabled: true,
      skipped: true,
      alreadyCreated: true,
      transferCount: Array.isArray(previousTransferMeta.items) ? previousTransferMeta.items.length : 0,
      reason: 'Transfers already created'
    };
  }

  const commissionPercent = getConfiguredCommissionPercent();
  const vendorAggregation = new Map();

  for (const item of payment.order.items || []) {
    const grossCents = Math.max(0, Number(item.unitPriceCents || 0) * Math.max(1, Number(item.quantity || 1)));
    const existing = vendorAggregation.get(item.vendorId) || {
      vendorId: item.vendorId,
      grossCents: 0,
      vendor: item.vendor
    };

    existing.grossCents += grossCents;
    vendorAggregation.set(item.vendorId, existing);
  }

  const transferCandidates = [];
  const missingLinkedAccounts = [];

  for (const aggregate of vendorAggregation.values()) {
    const linkedAccountId = getVendorLinkedAccountId(aggregate.vendor);
    const commissionCents = Math.floor(aggregate.grossCents * (commissionPercent / 100));
    const netAmountCents = Math.max(0, aggregate.grossCents - commissionCents);

    if (!linkedAccountId) {
      missingLinkedAccounts.push({
        vendorId: aggregate.vendorId,
        vendorName: aggregate.vendor?.companyName || 'Unknown Vendor',
        grossCents: aggregate.grossCents,
        netAmountCents
      });
      continue;
    }

    if (netAmountCents <= 0) {
      continue;
    }

    transferCandidates.push({
      vendorId: aggregate.vendorId,
      vendorName: aggregate.vendor?.companyName || 'Unknown Vendor',
      account: linkedAccountId,
      grossCents: aggregate.grossCents,
      commissionCents,
      amountCents: netAmountCents
    });
  }

  if (transferCandidates.length === 0) {
    if (PAYMENT_CONFIG.razorpay.routeStrict) {
      throw new ValidationError('No vendor linked accounts are configured for Razorpay Route transfers');
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        meta: mergeJsonObject(payment.meta, {
          razorpayTransfers: {
            created: false,
            skipped: true,
            reason: 'No eligible vendor transfer candidates',
            missingLinkedAccounts,
            attemptedAt: new Date().toISOString()
          }
        })
      }
    });

    return {
      enabled: true,
      skipped: true,
      reason: 'No eligible vendor transfer candidates',
      missingLinkedAccounts
    };
  }

  const transferPayload = {
    transfers: transferCandidates.map((candidate) => ({
      account: candidate.account,
      amount: candidate.amountCents,
      currency: payment.currencyCode || PAYMENT_CONFIG.currency || 'INR',
      notes: {
        orderId: payment.orderId,
        paymentId: payment.id,
        vendorId: candidate.vendorId,
        vendorName: candidate.vendorName
      },
      on_hold: false
    }))
  };

  const response = await axios.post(
    `https://api.razorpay.com/v1/payments/${gatewayPaymentId}/transfers`,
    transferPayload,
    {
      auth: {
        username: PAYMENT_CONFIG.razorpay.keyId,
        password: PAYMENT_CONFIG.razorpay.keySecret
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const createdTransfers = Array.isArray(response.data?.items) ? response.data.items : [];

  for (const transfer of createdTransfers) {
    const transferVendorId = transfer?.notes?.vendorId;
    const matchingCandidate = transferCandidates.find((candidate) => candidate.vendorId === transferVendorId);
    if (!matchingCandidate) {
      continue;
    }

    try {
      await prisma.payout.create({
        data: {
          vendorId: matchingCandidate.vendorId,
          amountCents: matchingCandidate.amountCents,
          commissionCents: matchingCandidate.commissionCents,
          status: 'COMPLETED',
          transactionId: transfer.id,
          processedAt: new Date(),
          notes: `Auto transfer for order ${payment.orderId}`,
          meta: {
            provider: 'razorpay',
            paymentId: payment.id,
            gatewayPaymentId,
            gatewayTransfer: transfer
          }
        }
      });
    } catch (_error) {
      // Ignore duplicate payout records from retries/webhook replays.
    }
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      meta: mergeJsonObject(payment.meta, {
        razorpayTransfers: {
          created: true,
          createdAt: new Date().toISOString(),
          commissionPercent,
          transferCount: createdTransfers.length,
          items: createdTransfers,
          missingLinkedAccounts
        }
      })
    }
  });

  return {
    enabled: true,
    skipped: false,
    transferCount: createdTransfers.length,
    missingLinkedAccounts,
    items: createdTransfers
  };
};

const createRazorpayPayout = async ({ vendor, amountCents, currency, notes = {}, sourceAccount = null }) => {
  if (!PAYMENT_CONFIG.razorpay.payoutsEnabled) {
    return { enabled: false, skipped: true, reason: 'Razorpay payouts disabled in configuration' };
  }

  const linkedAccountId = getVendorLinkedAccountId(vendor);
  if (!linkedAccountId) {
    return { enabled: true, skipped: true, reason: 'Vendor has no linked account', vendorId: vendor?.id || null };
  }

  const payload = {
    account_number: linkedAccountId,
    amount: amountCents,
    currency: currency || PAYMENT_CONFIG.currency || 'INR',
    mode: 'IMPS',
    purpose: 'payout',
    queue_if_low_balance: true,
    source: sourceAccount || PAYMENT_CONFIG.razorpay.payoutsSourceAccount || undefined,
    narration: notes.narration || `Payout to vendor ${vendor?.id}`,
    notes: notes
  };

  // Use Razorpay Payouts API
  const response = await axios.post(
    'https://api.razorpay.com/v1/payouts',
    payload,
    {
      auth: {
        username: PAYMENT_CONFIG.razorpay.keyId,
        password: PAYMENT_CONFIG.razorpay.keySecret
      },
      headers: { 'Content-Type': 'application/json' }
    }
  );

  return { enabled: true, skipped: false, payout: response.data };
};

/**
 * Initiate payment for an order
 */
const initiatePayment = async (orderId, userId, paymentData) => {
  const { provider, returnUrl } = paymentData;

  // Validate provider
  const selectedProvider = provider || PAYMENT_CONFIG.defaultProvider;
  if (!['razorpay', 'stripe', 'paypal', 'mock'].includes(selectedProvider)) {
    throw new ValidationError('Invalid payment provider');
  }

  const gatewayConfigured = buildGatewayConfiguration();

  const effectiveProvider = (gatewayConfigured[selectedProvider] || selectedProvider === 'mock')
    ? selectedProvider
    : 'mock';

  // Check if order exists and belongs to user
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          mobile: true
        }
      },
      items: {
        include: {
          medicine: true
        }
      },
      payment: true
    }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('You can only pay for your own orders');
  }

  // Check if order is already paid
  if (order.status === 'PAID') {
    throw new ValidationError('Order is already paid');
  }

  if (order.status === 'CANCELLED') {
    throw new ValidationError('Cannot pay for cancelled order');
  }

  // Check if payment already exists and is successful
  if (order.payment && order.payment.status === 'SUCCEEDED') {
    throw new ValidationError('Payment already completed for this order');
  }

  const paymentCurrency = order.currencyCode || PAYMENT_CONFIG.currency || 'INR';

  // For demo/testing purposes, use mock payment only when explicitly requested or when no gateway is configured.
  if (effectiveProvider === 'mock') {
    // Create or update payment record
    const payment = await upsertPaymentRecord({
      orderId,
      provider: effectiveProvider,
      amountCents: order.totalCents,
      currencyCode: paymentCurrency,
      status: 'INITIATED',
      meta: {
        mode: 'mock',
        returnUrl: returnUrl || '/payment/success'
      }
    });

    // Return mock payment details
    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: order.totalCents,
      currency: paymentCurrency,
      provider: effectiveProvider,
      status: 'INITIATED',
      // Mock payment link/form data
      paymentUrl: `${returnUrl || '/payment/success'}?orderId=${orderId}&paymentId=${payment.id}`,
      mockPayment: true,
      message: 'Mock payment initiated. Use /api/payments/verify to simulate payment completion.'
    };
  }

  if (effectiveProvider === 'razorpay') {
    const razorpayOrder = await createRazorpayOrder({
      amountCents: order.totalCents,
      order
    });

    const payment = await upsertPaymentRecord({
      orderId,
      provider: 'razorpay',
      amountCents: order.totalCents,
      currencyCode: razorpayOrder.currency || paymentCurrency,
      gatewayOrderId: razorpayOrder.id,
      status: 'INITIATED',
      meta: {
        gatewayOrder: razorpayOrder,
        returnUrl: returnUrl || null
      }
    });

    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: order.totalCents,
      currency: razorpayOrder.currency || paymentCurrency,
      provider: 'razorpay',
      status: 'INITIATED',
      gatewayOrderId: razorpayOrder.id,
      razorpay: {
        keyId: PAYMENT_CONFIG.razorpay.keyId,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'MedIQ',
        description: `Payment for order ${order.orderNumber || order.id}`,
        prefill: {
          name: order.user?.name || '',
          email: order.user?.email || '',
          contact: order.user?.mobile || ''
        },
        notes: {
          orderId: order.id,
          paymentId: payment.id
        },
        theme: {
          color: '#0f766e'
        }
      },
      message: 'Razorpay checkout initiated successfully'
    };
  }

  // TODO: Implement actual payment gateway integration for Stripe and PayPal.
  throw new ValidationError('Payment gateway integration is not yet implemented for the selected provider. Use provider=mock or provider=razorpay.');
};

/**
 * Verify payment callback from gateway
 */
const verifyPayment = async (paymentId, verificationData) => {
  const { signature, orderId, status, gatewayOrderId, gatewayPaymentId } = verificationData;

  // Find payment
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: true
    }
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (orderId && payment.orderId !== orderId) {
    throw new ValidationError('Payment does not belong to the provided order');
  }

  if (payment.provider === 'razorpay') {
    if (!gatewayPaymentId || !gatewayOrderId || !signature) {
      throw new ValidationError('Razorpay payment verification data is incomplete');
    }

    if (payment.gatewayOrderId && payment.gatewayOrderId !== gatewayOrderId) {
      throw new ValidationError('Razorpay order ID mismatch');
    }

    if (!verifyRazorpaySignature({
      gatewayOrderId,
      gatewayPaymentId,
      signature
    })) {
      throw new ValidationError('Invalid Razorpay signature');
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status || 'SUCCEEDED',
        gatewayOrderId,
        gatewayPaymentId,
        gatewaySignature: signature,
        transactionRef: gatewayPaymentId,
        meta: {
          ...(payment.meta && typeof payment.meta === 'object' ? payment.meta : {}),
          razorpay: {
            orderId: gatewayOrderId,
            paymentId: gatewayPaymentId,
            signature
          }
        }
      }
    });

    if ((status || 'SUCCEEDED') === 'SUCCEEDED') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID', paidAt: new Date() }
      });
    }

    return {
      success: (status || 'SUCCEEDED') === 'SUCCEEDED',
      payment: updatedPayment,
      order: payment.order,
      message: (status || 'SUCCEEDED') === 'SUCCEEDED' ? 'Razorpay payment verified successfully' : 'Payment failed'
    };
  }

  // For mock payment (development/testing)
  if (payment.provider === 'mock' || process.env.NODE_ENV === 'development') {
    const newStatus = status || 'SUCCEEDED';

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus
      }
    });

    // If payment succeeded, update order status
    if (newStatus === 'SUCCEEDED') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' }
      });
    }

    return {
      success: newStatus === 'SUCCEEDED',
      payment: updatedPayment,
      order: payment.order,
      message: newStatus === 'SUCCEEDED' ? 'Payment verified successfully' : 'Payment failed'
    };
  }

  throw new ValidationError('Payment verification not yet implemented for the selected provider.');
};

const handleRazorpayWebhook = async (rawBody, signature) => {
  if (!PAYMENT_CONFIG.razorpay.enabled) {
    throw new ValidationError('Razorpay webhook is not enabled');
  }

  if (!verifyRazorpayWebhookSignature({ rawBody, signature })) {
    throw new ValidationError('Invalid Razorpay webhook signature');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (_error) {
    throw new ValidationError('Invalid Razorpay webhook payload');
  }

  const event = payload?.event;
  const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
  const gatewayOrderId = entity?.order_id || payload?.payload?.order?.entity?.id || null;
  const gatewayPaymentId = entity?.id || null;
  const paymentStatus = entity?.status || (event === 'payment.failed' ? 'FAILED' : 'SUCCEEDED');

  if (!gatewayOrderId && !gatewayPaymentId) {
    throw new ValidationError('Razorpay webhook payload missing gateway identifiers');
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        gatewayOrderId ? { gatewayOrderId } : null,
        gatewayPaymentId ? { gatewayPaymentId } : null
      ].filter(Boolean)
    },
    include: {
      order: true
    }
  });

  if (!payment) {
    return {
      message: 'Webhook received but no matching payment was found',
      event,
      ignored: true
    };
  }

  const succeeded = event === 'payment.captured' || event === 'order.paid' || paymentStatus === 'captured' || paymentStatus === 'SUCCEEDED';
  const failed = event === 'payment.failed' || paymentStatus === 'failed' || paymentStatus === 'FAILED';

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: succeeded ? 'SUCCEEDED' : failed ? 'FAILED' : payment.status,
      gatewayOrderId: gatewayOrderId || payment.gatewayOrderId,
      gatewayPaymentId: gatewayPaymentId || payment.gatewayPaymentId,
      gatewaySignature: signature,
      transactionRef: gatewayPaymentId || payment.transactionRef,
      meta: {
        ...(payment.meta && typeof payment.meta === 'object' ? payment.meta : {}),
        razorpayWebhook: payload
      },
      failureReason: failed ? (entity?.error_description || entity?.error_reason || payload?.payload?.payment?.entity?.error_description || 'Razorpay payment failed') : payment.failureReason,
      refundedAt: event === 'refund.processed' ? new Date() : payment.refundedAt,
      refundAmountCents: event === 'refund.processed' ? (entity?.amount || payment.refundAmountCents) : payment.refundAmountCents
    }
  });

  if (succeeded) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'PAID',
        paidAt: payment.order.paidAt || new Date()
      }
    });
  }

  if (failed) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'PENDING'
      }
    });
  }

  return {
    message: 'Razorpay webhook processed successfully',
    event,
    payment: updatedPayment,
    order: payment.order
  };
};

/**
 * Get payment status for an order
 */
const getPaymentStatus = async (orderId, userId, userRole) => {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: {
      order: {
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!payment) {
    throw new NotFoundError('Payment not found for this order');
  }

  // Authorization check
  if (userRole === 'CUSTOMER' && payment.order.userId !== userId) {
    throw new ForbiddenError('You can only view payment status for your own orders');
  }

  return payment;
};

/**
 * Process refund for an order
 */
const processRefund = async (orderId, userId, userRole, refundData) => {
  const { reason, amount } = refundData;

  // Only admins can process refunds for now
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError('Only admins can process refunds');
  }

  // Find payment
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: {
      order: true
    }
  });

  if (!payment) {
    throw new NotFoundError('Payment not found for this order');
  }

  if (payment.status !== 'SUCCEEDED') {
    throw new ValidationError('Can only refund successful payments');
  }

  // Validate refund amount
  const refundAmountCents = amount || payment.amountCents;
  if (refundAmountCents > payment.amountCents) {
    throw new ValidationError('Refund amount cannot exceed payment amount');
  }

  // For mock payment
  if (payment.provider === 'mock' || process.env.NODE_ENV === 'development') {
    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED'
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    return {
      success: true,
      refundId: `refund_mock_${Date.now()}`,
      amount: refundAmountCents,
      status: 'REFUNDED',
      message: 'Refund processed successfully (mock)'
    };
  }

  // TODO: Implement actual refund processing
  // For Razorpay: Create refund
  // For Stripe: Create refund
  // For PayPal: Refund captured payment

  throw new ValidationError('Refund processing not yet implemented. Use mock provider for testing.');
};

/**
 * Get all payments (admin only)
 */
const getAllPayments = async (filters = {}) => {
  const { page = 1, limit = 20, status, provider } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  }
  if (provider) {
    where.provider = provider;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.payment.count({ where })
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleRazorpayWebhook,
  getPaymentStatus,
  processRefund,
  getAllPayments,
  createRazorpayPayout
};

