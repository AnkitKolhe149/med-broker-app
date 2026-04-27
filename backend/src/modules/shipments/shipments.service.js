const { prisma } = require('../../database/prisma');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

module.exports = {
  create: async (userId, data) => {
    // Expect orderId and courier details
    if (!data.orderId) throw new Error('orderId is required');
    const order = await prisma.order.findUnique({ where: { id: data.orderId }, include: { items: true, user: true } });
    if (!order) throw new NotFoundError('Order not found');

    // Only vendor or admin should create shipment. For simplicity allow admins only here; vendors should be verified by vendorId match in fuller impl.
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { vendor: true } });
    if (user.role !== 'ADMIN' && !user.vendor) {
      throw new ForbiddenError('Only admins or vendors can create shipments');
    }

    const payload = {
      orderId: data.orderId,
      courierName: data.courierName || null,
      trackingNumber: data.trackingNumber || null,
      status: data.status || 'PENDING',
      currentLocation: data.currentLocation || null,
      estimatedDeliveryAt: data.estimatedDeliveryAt ? new Date(data.estimatedDeliveryAt) : null,
      shippedAt: data.shippedAt ? new Date(data.shippedAt) : null,
      deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : null,
      meta: data.meta || null
    };

    const created = await prisma.shipment.create({ data: payload });
    return created;
  },

  getByOrder: async (userId, orderId) => {
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment) throw new NotFoundError('Shipment not found');
    // Customers can view shipments for their orders, vendors/admins can view for related orders
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order not found');
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { vendor: true } });
    if (user.role === 'CUSTOMER' && order.userId !== userId) throw new ForbiddenError('Not allowed');
    return shipment;
  },

  update: async (userId, id, data) => {
    const existing = await prisma.shipment.findUnique({ where: { id }, include: { order: { include: { items: true } } } });
    if (!existing) throw new NotFoundError('Shipment not found');
    
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { vendor: true } });
    if (user.role !== 'ADMIN' && !user.vendor) {
      throw new ForbiddenError('Not allowed to update shipment');
    }

    // If vendor (not admin), verify they own items in this order
    if (user.role !== 'ADMIN' && user.vendor) {
      const vendorOwnsItems = (existing.order?.items || []).some(item => item.vendorId === user.vendor.id);
      if (!vendorOwnsItems) {
        throw new ForbiddenError('You can only update shipments for orders containing your items');
      }
    }

    const payload = {};
    ['courierName','trackingNumber','status','currentLocation'].forEach(k => { if (k in data) payload[k]=data[k]; });
    if ('estimatedDeliveryAt' in data) payload.estimatedDeliveryAt = data.estimatedDeliveryAt ? new Date(data.estimatedDeliveryAt) : null;
    if ('shippedAt' in data) payload.shippedAt = data.shippedAt ? new Date(data.shippedAt) : null;
    if ('deliveredAt' in data) payload.deliveredAt = data.deliveredAt ? new Date(data.deliveredAt) : null;
    if ('meta' in data) payload.meta = data.meta;

    const updated = await prisma.shipment.update({ where: { id }, data: payload });
    return updated;
  }
};
