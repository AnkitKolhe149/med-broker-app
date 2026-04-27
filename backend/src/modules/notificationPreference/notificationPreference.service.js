const { prisma } = require('../../database/prisma');
const { NotFoundError } = require('../../utils/errors');

module.exports = {
  get: async (userId) => {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
    return prefs || null;
  },

  createOrUpdate: async (userId, data) => {
    const payload = {
      userId,
      emailEnabled: typeof data.emailEnabled === 'boolean' ? data.emailEnabled : true,
      smsEnabled: typeof data.smsEnabled === 'boolean' ? data.smsEnabled : false,
      pushEnabled: typeof data.pushEnabled === 'boolean' ? data.pushEnabled : true,
      orderUpdates: typeof data.orderUpdates === 'boolean' ? data.orderUpdates : true,
      paymentUpdates: typeof data.paymentUpdates === 'boolean' ? data.paymentUpdates : true,
      supportUpdates: typeof data.supportUpdates === 'boolean' ? data.supportUpdates : true,
      marketingEnabled: typeof data.marketingEnabled === 'boolean' ? data.marketingEnabled : false
    };

    const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (existing) {
      return prisma.notificationPreference.update({ where: { userId }, data: payload });
    }

    return prisma.notificationPreference.create({ data: payload });
  }
};
