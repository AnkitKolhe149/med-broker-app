const { prisma } = require('../../database/prisma');
const { NotFoundError, ValidationError } = require('../../utils/errors');

module.exports = {
  list: async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return [];
    return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: 'desc', updatedAt: 'desc' } });
  },

  create: async (userId, data) => {
    const payload = {
      userId,
      type: data.type || 'HOME',
      label: data.label || null,
      fullName: data.fullName || null,
      line1: data.line1 || '',
      line2: data.line2 || null,
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      postalCode: data.postalCode || '',
      phone: data.phone || null,
      isDefault: Boolean(data.isDefault)
    };

    const created = await prisma.address.create({ data: payload });
    if (payload.isDefault) {
      // unset other defaults
      await prisma.address.updateMany({ where: { userId, id: { not: created.id } }, data: { isDefault: false } });
    }
    return created;
  },

  get: async (userId, id) => {
    const addr = await prisma.address.findUnique({ where: { id } });
    if (!addr || addr.userId !== userId) throw new NotFoundError('Address not found');
    return addr;
  },

  update: async (userId, id, data) => {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) throw new NotFoundError('Address not found');
    const payload = {};
    ['type','label','fullName','line1','line2','city','state','country','postalCode','phone'].forEach((k) => { if (k in data) payload[k] = data[k]; });
    if ('isDefault' in data) payload.isDefault = Boolean(data.isDefault);
    const updated = await prisma.address.update({ where: { id }, data: payload });
    if (payload.isDefault) {
      await prisma.address.updateMany({ where: { userId, id: { not: id } }, data: { isDefault: false } });
    }
    return updated;
  },

  remove: async (userId, id) => {
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) throw new NotFoundError('Address not found');
    return prisma.address.delete({ where: { id } });
  }
};
