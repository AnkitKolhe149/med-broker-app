const { prisma } = require('../../database/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');

module.exports = {
  listForMedicine: async (medicineId, options = {}) => {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.review.findMany({ where: { medicineId, isPublished: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.review.count({ where: { medicineId, isPublished: true } })
    ]);
    return { items, pagination: { page, limit, total } };
  },

  create: async (userId, data) => {
    const { medicineId, orderId, rating, comment } = data;
    if (!medicineId || !rating) throw new ValidationError('medicineId and rating are required');
    
    // Validate rating is between 1 and 5
    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
      throw new ValidationError('Rating must be an integer between 1 and 5');
    }

    // verify user ordered this medicine (if orderId provided)
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order || order.userId !== userId) throw new NotFoundError('Order not found or not owned');
      const found = (order.items || []).find(i => i.medicineId === medicineId);
      if (!found) throw new ValidationError('Medicine not part of the order');
    }

    // ensure customer exists
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new NotFoundError('Customer profile not found');

    // Check for duplicate review (same customer, same medicine) - prevent duplicates
    const existingReview = await prisma.review.findFirst({
      where: {
        customerId: customer.id,
        medicineId
      }
    });
    if (existingReview) {
      throw new ValidationError('You have already reviewed this medicine');
    }

    const created = await prisma.review.create({ data: {
      customerId: customer.id,
      medicineId,
      orderId: orderId || '',
      rating: numRating,
      comment: comment || '',
      isPublished: true
    }});

    return created;
  }
};
