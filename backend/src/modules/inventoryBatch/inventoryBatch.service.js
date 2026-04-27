const { prisma } = require('../../database/prisma');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../utils/errors');

module.exports = {
  create: async (userId, data) => {
    // vendor must own the inventory
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenError('Vendor profile not found');
    if (!data.inventoryId) throw new Error('inventoryId required');

    const inventory = await prisma.inventory.findUnique({ where: { id: data.inventoryId } });
    if (!inventory || inventory.vendorId !== vendor.id) throw new ForbiddenError('Inventory not found or not owned');

    const batchQuantity = Number(data.quantity) || 0;
    
    // Get sum of all existing batch quantities for this inventory
    const existingBatches = await prisma.inventoryBatch.findMany({ 
      where: { inventoryId: data.inventoryId },
      select: { quantity: true }
    });
    const totalBatchQuantity = existingBatches.reduce((sum, b) => sum + (b.quantity || 0), 0) + batchQuantity;
    
    // Validate that total batch quantities don't exceed inventory quantity
    if (totalBatchQuantity > inventory.quantity) {
      throw new ValidationError(`Batch quantity exceeds available inventory. Available: ${inventory.quantity}, Total batches: ${totalBatchQuantity}`);
    }

    const payload = {
      inventoryId: data.inventoryId,
      batchNumber: data.batchNumber || `batch-${Date.now()}`,
      quantity: batchQuantity,
      manufacturedAt: data.manufacturedAt ? new Date(data.manufacturedAt) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      purchaseCostCents: data.purchaseCostCents || null
    };

    const created = await prisma.inventoryBatch.create({ data: payload });
    return created;
  },

  listForInventory: async (userId, inventoryId) => {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenError('Vendor profile not found');
    const inventory = await prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory || inventory.vendorId !== vendor.id) throw new ForbiddenError('Inventory not found or not owned');
    return prisma.inventoryBatch.findMany({ where: { inventoryId }, orderBy: { expiryDate: 'asc' } });
  },

  update: async (userId, id, data) => {\n    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenError('Vendor profile not found');
    const batch = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundError('Batch not found');
    const inventory = await prisma.inventory.findUnique({ where: { id: batch.inventoryId } });
    if (!inventory || inventory.vendorId !== vendor.id) throw new ForbiddenError('Not allowed');

    // If updating quantity, validate total batch quantities don't exceed inventory
    if ('quantity' in data) {
      const newBatchQuantity = Number(data.quantity) || 0;
      const otherBatches = await prisma.inventoryBatch.findMany({ 
        where: { inventoryId: batch.inventoryId, id: { not: id } },
        select: { quantity: true }
      });
      const totalBatchQuantity = otherBatches.reduce((sum, b) => sum + (b.quantity || 0), 0) + newBatchQuantity;
      
      if (totalBatchQuantity > inventory.quantity) {
        throw new ValidationError(`Batch quantity exceeds available inventory. Available: ${inventory.quantity}, Total batches: ${totalBatchQuantity}`);
      }
    }

    const payload = {};
    ['batchNumber','quantity','purchaseCostCents'].forEach(k => { if (k in data) payload[k]=data[k]; });
    if ('manufacturedAt' in data) payload.manufacturedAt = data.manufacturedAt ? new Date(data.manufacturedAt) : null;
    if ('expiryDate' in data) payload.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    return prisma.inventoryBatch.update({ where: { id }, data: payload });
  },

  remove: async (userId, id) => {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenError('Vendor profile not found');
    const batch = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundError('Batch not found');
    const inventory = await prisma.inventory.findUnique({ where: { id: batch.inventoryId } });
    if (!inventory || inventory.vendorId !== vendor.id) throw new ForbiddenError('Not allowed');
    return prisma.inventoryBatch.delete({ where: { id } });
  }
};
