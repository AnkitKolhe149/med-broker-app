const { prisma } = require('../../database/prisma');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const PAYMENT_CONFIG = require('../../config/payment');

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

  // Check if order exists and belongs to user
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
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

  // For demo/testing purposes, use mock payment
  if (selectedProvider === 'mock' || process.env.NODE_ENV === 'development') {
    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { orderId: orderId },
      create: {
        orderId,
        provider: selectedProvider,
        status: 'INITIATED',
        amountCents: order.totalCents
      },
      update: {
        provider: selectedProvider,
        status: 'INITIATED',
        amountCents: order.totalCents
      }
    });

    // Return mock payment details
    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: order.totalCents,
      currency: PAYMENT_CONFIG.currency,
      provider: selectedProvider,
      status: 'INITIATED',
      // Mock payment link/form data
      paymentUrl: `${returnUrl || '/payment/success'}?orderId=${orderId}&paymentId=${payment.id}`,
      mockPayment: true,
      message: 'Mock payment initiated. Use /api/payments/verify to simulate payment completion.'
    };
  }

  // TODO: Implement actual payment gateway integration
  // For Razorpay: Create order using Razorpay API
  // For Stripe: Create payment intent
  // For PayPal: Create order

  throw new ValidationError('Payment gateway integration not yet implemented. Use provider=mock for testing.');
};

/**
 * Verify payment callback from gateway
 */
const verifyPayment = async (paymentId, verificationData) => {
  const { signature, orderId, status } = verificationData;

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

  // TODO: Implement actual payment verification
  // For Razorpay: Verify signature using crypto
  // For Stripe: Retrieve payment intent
  // For PayPal: Capture order

  throw new ValidationError('Payment verification not yet implemented. Use mock provider for testing.');
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
  getPaymentStatus,
  processRefund,
  getAllPayments
};
