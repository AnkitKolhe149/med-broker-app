const { prisma } = require('../../database/prisma');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { uploadPrescriptionImage } = require('../../services/cloudinary.service');
const { resolveOrderItemUnitPriceCents } = require('./orderPricing.util');
const paymentService = require('../payments/payments.service');

const normalizePackageType = (value) => (String(value || 'standard').toLowerCase() === 'bulk' ? 'bulk' : 'standard');

const normalizeDeliveryType = (value) => (String(value || 'standard').toLowerCase() === 'express' ? 'express' : 'standard');

const getPricingSettingMap = async () => {
  const keys = [
    'STANDARD_DELIVERY_CHARGE_CENTS',
    'EXPRESS_DELIVERY_CHARGE_CENTS',
    'TAX_RATE_PERCENT',
    'FREE_DELIVERY_THRESHOLD_CENTS'
  ];

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true }
  }).catch(() => []);

  return settings.reduce((acc, setting) => {
    acc[setting.key] = Number(setting.value);
    return acc;
  }, {});
};

const buildPricingSummary = async ({ subtotalCents, discountPercent = 0, deliveryType = 'standard' }) => {
  const normalizedDiscountPercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const normalizedDeliveryType = normalizeDeliveryType(deliveryType);
  const pricingSettings = await getPricingSettingMap();
  const standardDeliveryChargeCents = Number.isFinite(pricingSettings.STANDARD_DELIVERY_CHARGE_CENTS)
    ? pricingSettings.STANDARD_DELIVERY_CHARGE_CENTS
    : 0;
  const expressDeliveryChargeCents = Number.isFinite(pricingSettings.EXPRESS_DELIVERY_CHARGE_CENTS)
    ? pricingSettings.EXPRESS_DELIVERY_CHARGE_CENTS
    : 900;
  const taxRatePercent = Number.isFinite(pricingSettings.TAX_RATE_PERCENT)
    ? pricingSettings.TAX_RATE_PERCENT
    : 5;
  const freeDeliveryThresholdCents = Number.isFinite(pricingSettings.FREE_DELIVERY_THRESHOLD_CENTS)
    ? pricingSettings.FREE_DELIVERY_THRESHOLD_CENTS
    : 0;
  const deliveryChargeCents = normalizedDeliveryType === 'express' ? expressDeliveryChargeCents : standardDeliveryChargeCents;
  const discountCents = Math.round(subtotalCents * (normalizedDiscountPercent / 100));
  const taxableCents = Math.max(0, subtotalCents - discountCents + deliveryChargeCents);
  const taxCents = Math.round(taxableCents * (taxRatePercent / 100));
  const totalCents = taxableCents + taxCents;

  return {
    subtotalCents,
    discountPercent: normalizedDiscountPercent,
    discountCents,
    deliveryType: normalizedDeliveryType,
    deliveryChargeCents,
    standardDeliveryChargeCents,
    expressDeliveryChargeCents,
    freeDeliveryThresholdCents,
    taxRatePercent,
    taxCents,
    totalCents
  };
};

const buildOrderSignature = (items = []) => {
  return items
    .map((item) => ({
      medicineId: item.medicineId,
      quantity: Math.max(1, Number(item.quantity) || 1),
      packageType: normalizePackageType(item.selectedSize || item.packageType)
    }))
    .sort((a, b) => a.medicineId.localeCompare(b.medicineId))
    .map((item) => `${item.medicineId}:${item.quantity}:${item.packageType}`)
    .join('|');
};

const getVendorIdForUser = async (userId) => {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: { id: true }
  });

  return vendor?.id || null;
};

const getOrderVendorIds = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      items: {
        select: {
          vendorId: true,
          medicineId: true
        }
      }
    }
  });

  if (!order) {
    return null;
  }

  const vendorIdsFromOrderItems = [...new Set(order.items.map((item) => item.vendorId).filter(Boolean))];
  if (vendorIdsFromOrderItems.length > 0) {
    return vendorIdsFromOrderItems;
  }

  const medicineIds = [...new Set(order.items.map((item) => item.medicineId).filter(Boolean))];
  if (medicineIds.length === 0) {
    return [];
  }

  const inventoryRecords = await prisma.inventory.findMany({
    where: {
      medicineId: { in: medicineIds }
    },
    select: {
      vendorId: true
    }
  });

  return [...new Set(inventoryRecords.map((record) => record.vendorId).filter(Boolean))];
};

/**
 * Create a new order from cart items
 */
const createOrder = async (userId, orderData) => {
  const {
    items,
    deliveryType,
    deliveryAddress,
    orderNotes,
    prescriptionUrl,
    prescriptionName,
    discountPercent,
    appliedCoupon,
    currencyCode,
    checkoutSnapshot: providedCheckoutSnapshot = {}
  } = orderData;

  // Validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Order must contain at least one item');
  }

  const recentDuplicateCutoff = new Date(Date.now() - 10 * 60 * 1000);

  // Validate each item
  for (const item of items) {
    if (!item.medicineId || !item.quantity || item.quantity < 1) {
      throw new ValidationError('Each item must have medicineId and quantity >= 1');
    }

    const rawPackageType = String(item.selectedSize || item.packageType || 'standard').toLowerCase();
    if (!['standard', 'bulk'].includes(rawPackageType)) {
      throw new ValidationError('Item package type must be either standard or bulk');
    }
  }

  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { buyerType: true, fullName: true, deliveryAddress: true, contactNumber: true, user: { select: { preferredCurrency: true } } }
  });

  const normalizedRequestSignature = buildOrderSignature(items);

  const recentOrders = await prisma.order.findMany({
    where: {
      userId,
      createdAt: { gte: recentDuplicateCutoff }
    },
    include: {
      items: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const matchingRecentOrder = recentOrders.find((order) => {
    const existingSignature = buildOrderSignature(order.items);
    return existingSignature === normalizedRequestSignature;
  });

  if (matchingRecentOrder) {
    return prisma.order.findUnique({
      where: { id: matchingRecentOrder.id },
      include: {
        items: {
          include: {
            medicine: true
          }
        },
        payment: true
      }
    });
  }

  const inventoryIdCandidates = [...new Set(
    items
      .map((item) => item.inventoryId || item.medicineId)
      .filter(Boolean)
  )];

  const [inventoryByIdRecords, inventoryByMedicineRecords] = await Promise.all([
    inventoryIdCandidates.length
      ? prisma.inventory.findMany({
        where: {
          id: { in: inventoryIdCandidates }
        },
        select: {
          id: true,
          medicineId: true,
          vendorId: true,
          quantity: true,
          medicine: {
            select: {
              priceCents: true,
              requiresPrescription: true
            }
          }
        }
      })
      : Promise.resolve([]),
    prisma.inventory.findMany({
      where: {
        OR: [
          ...items.map((item) => ({
            medicineId: item.medicineId,
            ...(item.vendorId ? { vendorId: item.vendorId } : {})
          }))
        ]
      },
      select: {
        id: true,
        medicineId: true,
        vendorId: true,
        quantity: true,
        medicine: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            requiresPrescription: true
          }
        }
      }
    })
  ]);

  const inventoryRecordMap = new Map();
  [...inventoryByIdRecords, ...inventoryByMedicineRecords].forEach((record) => {
    inventoryRecordMap.set(record.id, record);
  });
  const inventoryRecords = [...inventoryRecordMap.values()];

  const inventoryMap = new Map(
    inventoryRecords.map((record) => [`${record.medicineId}:${record.vendorId || ''}`, record])
  );
  const inventoryById = new Map(inventoryRecords.map((record) => [record.id, record]));

  const inventoryByMedicine = new Map();
  for (const record of inventoryRecords) {
    const existing = inventoryByMedicine.get(record.medicineId) || [];
    existing.push(record);
    inventoryByMedicine.set(record.medicineId, existing);
  }

  const resolveInventoryForItem = (item) => {
    const directInventoryId = item.inventoryId || item.medicineId;
    const byInventoryId = directInventoryId ? inventoryById.get(directInventoryId) : null;
    if (byInventoryId && (!item.vendorId || byInventoryId.vendorId === item.vendorId)) {
      return byInventoryId;
    }

    const exactKey = `${item.medicineId}:${item.vendorId || ''}`;
    const exact = inventoryMap.get(exactKey);
    if (exact) {
      return exact;
    }

    const candidates = inventoryByMedicine.get(item.medicineId) || [];
    if (!candidates.length) {
      return null;
    }

    // Choose the best available stock when vendor is unspecified in cart payload.
    return [...candidates].sort((a, b) => b.quantity - a.quantity)[0];
  };

  let totalCents = 0;
  const resolvedInventoryForItems = [];

  const orderItems = items.map((item, index) => {
    const inventory = resolveInventoryForItem(item);
    if (!inventory) {
      throw new NotFoundError(`Medicine not found: ${item.medicineId}`);
    }

    if (inventory.quantity < item.quantity) {
      throw new ValidationError('Insufficient stock for one or more items');
    }

    const itemPrescriptionUrl = item.prescriptionUrl || prescriptionUrl;
    if (inventory.medicine.requiresPrescription && !itemPrescriptionUrl) {
      const medName = inventory.medicine && inventory.medicine.name ? inventory.medicine.name : inventory.medicineId;
      throw new ValidationError(`Prescription is required for ${medName}`);
    }

    const packageType = normalizePackageType(item.selectedSize || item.packageType);
    const unitPriceCents = resolveOrderItemUnitPriceCents({
      medicine: {
        priceCents: inventory.medicine.priceCents
      },
      buyerType: customer?.buyerType,
      quantity: item.quantity,
      packageType
    });
    const itemTotal = unitPriceCents * item.quantity;
    totalCents += itemTotal;
    resolvedInventoryForItems[index] = inventory;

    return {
      medicineId: inventory.medicineId,
      vendorId: inventory.vendorId,
      quantity: item.quantity,
      unitPriceCents,
      lineTotalCents: itemTotal,
      discountCents: 0
    };
  });

  const pricingSummary = await buildPricingSummary({
    subtotalCents: totalCents,
    discountPercent,
    deliveryType
  });
  totalCents = pricingSummary.totalCents;

  const PAYMENT_CONFIG = require('../../config/payment');
  const { normalizeCurrencyCode } = require('../../utils/currencyPipeline');
  const effectiveCurrency = String(normalizeCurrencyCode(currencyCode) || normalizeCurrencyCode(customer?.user?.preferredCurrency) || normalizeCurrencyCode(PAYMENT_CONFIG.currency) || String(process.env.EXCHANGE_RATE_BASE || 'INR').toUpperCase()).toUpperCase();

  const checkoutSnapshot = {
    ...providedCheckoutSnapshot,
    items,
    deliveryType: pricingSummary.deliveryType,
    deliveryAddress,
    orderNotes,
    prescriptionUrl,
    prescriptionName,
    discountPercent: pricingSummary.discountPercent,
    appliedCoupon,
    currencyCode: effectiveCurrency,
    pricingSummary
  };

  // Prefill checkout snapshot fields from customer profile when not provided
  if (!checkoutSnapshot.deliveryAddress) {
    checkoutSnapshot.deliveryAddress = customer?.deliveryAddress || checkoutSnapshot.deliveryAddress || '';
  }
  if (!checkoutSnapshot.customerName) {
    checkoutSnapshot.customerName = customer?.fullName || '';
  }
  if (!checkoutSnapshot.contactNumber) {
    checkoutSnapshot.contactNumber = customer?.contactNumber || '';
  }

  const commissionSetting = await prisma.systemSetting.findUnique({
    where: { key: 'PLATFORM_COMMISSION_PERCENT' },
  }).catch(() => null);
  const persistedFeeRate = commissionSetting ? parseFloat(commissionSetting.value) : 5;
  const persistedFeeAmount = totalCents * (persistedFeeRate / 100);

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId,
        totalCents,
        currencyCode: effectiveCurrency,
        checkoutSnapshot,
        status: 'PENDING',
        persistedFeeRate,
        persistedFeeAmount,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            medicine: true
          }
        }
      }
    });

    await Promise.all(
      items.map((item, index) => tx.inventory.update({
        where: { id: resolvedInventoryForItems[index].id },
        data: { quantity: { decrement: item.quantity } }
      }))
    );

    return createdOrder;
  });

  return order;
};

/**
 * Get all orders for a user
 */
const getUserOrders = async (userId, options = {}) => {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;

  const where = { userId };
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            medicine: true
          }
        },
        payment: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count({ where })
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get order details by ID
 */
const getOrderById = async (orderId, userId, userRole) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          medicine: true
        }
      },
      payment: true,
      invoice: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          customer: true
        }
      }
    }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: customers can only see their own orders
  // Vendors can only see orders containing medicines from their inventory
  // Admins can see all orders
  if (userRole === 'CUSTOMER' && order.userId !== userId) {
    throw new ForbiddenError('You can only access your own orders');
  }

  if (userRole === 'VENDOR') {
    const vendorId = await getVendorIdForUser(userId);
    if (!vendorId) {
      throw new ForbiddenError('Vendor profile not found');
    }

    const orderVendorIds = await getOrderVendorIds(orderId);
    if (!orderVendorIds || orderVendorIds.length !== 1 || orderVendorIds[0] !== vendorId) {
      throw new ForbiddenError('You can only access orders linked to your inventory');
    }
  }

  return order;
};

/**
 * Update order status (for vendors/admins)
 */
const updateOrderStatus = async (orderId, newStatus, userId, userRole) => {
  // Validate status
  const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED'];
  if (!validStatuses.includes(newStatus)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization check
  if (userRole === 'CUSTOMER') {
    throw new ForbiddenError('Only vendors and admins can update order status');
  }

  if (userRole === 'VENDOR') {
    const vendorId = await getVendorIdForUser(userId);
    if (!vendorId) {
      throw new ForbiddenError('Vendor profile not found');
    }

    const orderVendorIds = await getOrderVendorIds(orderId);
    if (!orderVendorIds || orderVendorIds.length !== 1 || orderVendorIds[0] !== vendorId) {
      throw new ForbiddenError('You can only update orders that belong to your inventory');
    }
  }

  // Prevent invalid status transitions
  if (order.status === 'CANCELLED' && newStatus !== 'CANCELLED') {
    throw new ValidationError('Cannot change status of a cancelled order');
  }

  if (order.status === 'SHIPPED' && newStatus === 'PENDING') {
    throw new ValidationError('Cannot revert shipped order to pending');
  }

  // Update status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: {
      items: {
        include: {
          medicine: true
        }
      },
      payment: true
    }
  });

  return updatedOrder;
};

/**
 * Cancel order (for customers)
 */
const cancelOrder = async (orderId, userId, userRole) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      items: true
    }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: customers can only cancel their own orders
  if (userRole === 'CUSTOMER' && order.userId !== userId) {
    throw new ForbiddenError('You can only cancel your own orders');
  }

  // Business rules for cancellation
  if (order.status === 'CANCELLED') {
    throw new ValidationError('Order is already cancelled');
  }

  if (order.status === 'SHIPPED') {
    throw new ValidationError('Cannot cancel shipped orders. Please contact support for returns.');
  }

  // Cancellation window (minutes) - customers allowed to cancel within this period
  const cancelWindowSetting = await prisma.systemSetting.findUnique({ where: { key: 'ORDER_CANCELLATION_WINDOW_MINUTES' } }).catch(() => null);
  const cancelWindowMinutes = cancelWindowSetting ? Number(cancelWindowSetting.value) : (parseInt(process.env.ORDER_CANCELLATION_WINDOW_MINUTES, 10) || 30);
  const minutesSinceCreation = (Date.now() - new Date(order.createdAt).getTime()) / 60000;

  // If order is paid, allow cancellation only within the cancellation window (unless admin)
  if (order.payment && order.payment.status === 'SUCCEEDED') {
    if (userRole !== 'ADMIN' && minutesSinceCreation > cancelWindowMinutes) {
      throw new ValidationError('Cancellation window expired; cannot cancel paid orders. Please request a refund instead.');
    }

    // Attempt internal refund processing (will mark payment REFUNDED and order CANCELLED)
    // We still need to restore inventory after refunding.
    const itemsToRestore = order.items || [];
    try {
      const refundResult = await paymentService.processRefundInternal(orderId, { reason: 'Customer cancellation within allowed window' });

      // Restore inventory quantities for items (best-effort, separate transaction)
      await prisma.$transaction(async (tx) => {
        await Promise.all(
          itemsToRestore.map(async (item) => {
            if (item.vendorId) {
              await tx.inventory.update({
                where: {
                  medicineId_vendorId: {
                    medicineId: item.medicineId,
                    vendorId: item.vendorId
                  }
                },
                data: { quantity: { increment: item.quantity } }
              });
              return;
            }

            const candidateInventories = await tx.inventory.findMany({
              where: { medicineId: item.medicineId },
              select: { id: true },
              take: 2
            });

            if (candidateInventories.length === 1) {
              await tx.inventory.update({ where: { id: candidateInventories[0].id }, data: { quantity: { increment: item.quantity } } });
            }
          })
        );
      });

      const updatedOrder = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } });
      return { success: true, refunded: true, refund: refundResult, order: updatedOrder };
    } catch (err) {
      // If refund processing failed (e.g., non-mock provider), mark payment as REFUND_REQUESTED and surface message
      const existingMeta = (order.payment && order.payment.meta && typeof order.payment.meta === 'object') ? order.payment.meta : {};
      const newMeta = { ...(existingMeta || {}), refundRequestedAt: new Date().toISOString(), refundReason: `Auto-refund failed: ${err.message}` };
      await prisma.payment.update({ where: { id: order.payment.id }, data: { status: 'REFUND_REQUESTED', meta: newMeta } });
      return { success: true, refunded: false, message: 'Refund requested; awaiting manual processing', error: err.message };
    }
  }

  // Cancel the order and restore inventory stock for each item.
  const cancelledOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: {
            medicine: true
          }
        }
      }
    });

    await Promise.all(
      order.items.map(async (item) => {
        if (item.vendorId) {
          await tx.inventory.update({
            where: {
              medicineId_vendorId: {
                medicineId: item.medicineId,
                vendorId: item.vendorId
              }
            },
            data: { quantity: { increment: item.quantity } }
          });
          return;
        }

        const candidateInventories = await tx.inventory.findMany({
          where: { medicineId: item.medicineId },
          select: { id: true },
          take: 2
        });

        // Restore stock only when the mapping is unambiguous.
        if (candidateInventories.length === 1) {
          await tx.inventory.update({
            where: { id: candidateInventories[0].id },
            data: { quantity: { increment: item.quantity } }
          });
        }
      })
    );

    return updated;
  });

  return cancelledOrder;
};

/**
 * Request refund for a paid order (customer facing)
 */
const requestRefund = async (orderId, userId, userRole, reason = '') => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) throw new NotFoundError('Order not found');

  if (userRole === 'CUSTOMER' && order.userId !== userId) {
    throw new ForbiddenError('You can only request refunds for your own orders');
  }

  if (!order.payment || order.payment.status !== 'SUCCEEDED') {
    throw new ValidationError('Only paid orders can be refunded');
  }

  // Mark payment as refund requested
  // Merge existing meta with refund request info
  const existingMeta = (order.payment && order.payment.meta && typeof order.payment.meta === 'object') ? order.payment.meta : {};
  const newMeta = {
    ...(existingMeta || {}),
    refundRequestedAt: new Date().toISOString(),
    refundReason: reason
  };

  await prisma.payment.update({ where: { id: order.payment.id }, data: { status: 'REFUND_REQUESTED', meta: newMeta } });

  // If system setting for auto refunds is enabled, try to process immediately
  const autoProcessSetting = await prisma.systemSetting.findUnique({ where: { key: 'AUTO_PROCESS_REFUNDS' } }).catch(() => null);
  const autoProcess = autoProcessSetting ? String(autoProcessSetting.value) === 'true' : false;

  if (autoProcess) {
    try {
      const refundResult = await paymentService.processRefundInternal(orderId, { reason });
      return { success: true, refunded: true, result: refundResult };
    } catch (err) {
      // leave payment in REFUND_REQUESTED state for manual processing
      return { success: true, refunded: false, message: 'Refund requested; awaiting manual processing', error: err.message };
    }
  }

  return { success: true, refunded: false, message: 'Refund requested; awaiting manual processing' };
};

/**
 * Get order data for receipt generation
 */
const getOrderForReceipt = async (orderId, userId, userRole) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          medicine: true
        }
      },
      payment: true,
      user: {
        include: {
          customer: true
        }
      }
    }
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (userRole === 'CUSTOMER' && order.userId !== userId) {
    throw new ForbiddenError('You can only access your own orders');
  }

  return order;
};

const uploadPrescription = async (userId, file) => {
  if (!file || !file.buffer || !file.mimetype) {
    throw new ValidationError('Prescription file is required');
  }

  const prescriptionUrl = await uploadPrescriptionImage(file.buffer, file.mimetype, userId);

  return {
    prescriptionUrl
  };
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderForReceipt,
  uploadPrescription
  , requestRefund
};
