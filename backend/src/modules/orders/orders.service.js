const { prisma } = require('../../database/prisma');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { uploadPrescriptionImage } = require('../../services/cloudinary.service');

/**
 * Create a new order from cart items
 */
const createOrder = async (userId, orderData) => {
  const { items, prescriptionUrl } = orderData;

  // Validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Order must contain at least one item');
  }

  if (!prescriptionUrl || typeof prescriptionUrl !== 'string') {
    throw new ValidationError('Prescription upload is required');
  }

  // Validate each item
  for (const item of items) {
    if (!item.medicineId || !item.quantity || item.quantity < 1) {
      throw new ValidationError('Each item must have medicineId and quantity >= 1');
    }
  }

  // Fetch medicine prices and validate existence
  const medicineIds = items.map(item => item.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds } }
  });

  if (medicines.length !== medicineIds.length) {
    throw new NotFoundError('One or more medicines not found');
  }

  // Create a map for quick price lookup
  const medicineMap = new Map(medicines.map(m => [m.id, m]));

  // Calculate total and prepare order items
  let totalCents = 0;
  const orderItems = items.map(item => {
    const medicine = medicineMap.get(item.medicineId);
    const itemTotal = medicine.priceCents * item.quantity;
    totalCents += itemTotal;

    return {
      medicineId: item.medicineId,
      quantity: item.quantity,
      unitPriceCents: medicine.priceCents
    };
  });

  // Create order with items in a transaction
  const order = await prisma.order.create({
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

  return order;
};

/**
 * Upload a prescription image for order processing
 */
const uploadPrescription = async (userId, file) => {
  if (!file || !file.buffer || !file.mimetype) {
    throw new ValidationError('Prescription image is required');
  }

  const prescriptionUrl = await uploadPrescriptionImage(file.buffer, file.mimetype, userId);

  return {
    prescriptionUrl
  };
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
      payment: true
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

  // Cancel the order
  const cancelledOrder = await prisma.order.update({
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

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderForReceipt,
  uploadPrescription
};
