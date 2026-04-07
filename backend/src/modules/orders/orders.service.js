const { prisma } = require('../../database/prisma');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { uploadPrescriptionImage } = require('../../services/cloudinary.service');
const { resolveOrderItemUnitPriceCents } = require('./orderPricing.util');

const normalizePackageType = (value) => (String(value || 'standard').toLowerCase() === 'bulk' ? 'bulk' : 'standard');

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

/**
 * Create a new order from cart items
 */
const createOrder = async (userId, orderData) => {
  const { items } = orderData;

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
    select: { buyerType: true }
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

  const inventoryIds = [...new Set(items.map((item) => item.medicineId))];
  const inventoryRecords = await prisma.inventory.findMany({
    where: { id: { in: inventoryIds } },
    select: {
      id: true,
      medicineId: true,
      quantity: true,
      bulkMinQty: true,
      medicine: {
        select: {
          priceCents: true,
          wholesalePriceCents: true,
          bulkMinQty: true,
          bulkPriceCents: true
        }
      }
    }
  });

  if (inventoryRecords.length !== inventoryIds.length) {
    throw new NotFoundError('One or more inventory items not found');
  }

  const inventoryMap = new Map(inventoryRecords.map((record) => [record.id, record]));

  let totalCents = 0;
  const orderItems = items.map((item) => {
    const inventory = inventoryMap.get(item.medicineId);
    if (!inventory) {
      throw new NotFoundError(`Inventory item not found: ${item.medicineId}`);
    }

    if (inventory.quantity < item.quantity) {
      throw new ValidationError('Insufficient stock for one or more items');
    }

    const packageType = normalizePackageType(item.selectedSize || item.packageType);
    const unitPriceCents = resolveOrderItemUnitPriceCents({
      medicine: {
        priceCents: inventory.medicine.priceCents,
        wholesalePriceCents: inventory.medicine.wholesalePriceCents,
        bulkPriceCents: inventory.medicine.bulkPriceCents,
        bulkMinQty: inventory.medicine.bulkMinQty ?? inventory.bulkMinQty
      },
      buyerType: customer?.buyerType,
      quantity: item.quantity,
      packageType
    });
    const itemTotal = unitPriceCents * item.quantity;
    totalCents += itemTotal;

    return {
      medicineId: inventory.medicineId,
      quantity: item.quantity,
      unitPriceCents
    };
  });

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId,
        totalCents,
        status: 'PENDING',
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
      items.map((item) => tx.inventory.update({
        where: { id: item.medicineId },
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
  // Vendors can see orders containing their medicines (TODO: implement vendor check)
  // Admins can see all orders
  if (userRole === 'CUSTOMER' && order.userId !== userId) {
    throw new ForbiddenError('You can only access your own orders');
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

  if (order.payment && order.payment.status === 'SUCCEEDED') {
    throw new ValidationError('Cannot cancel paid orders. Please request a refund instead.');
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
};
