const { prisma } = require('../../database/prisma');

const resolveCartMedicineIds = async (data = {}) => {
  const inventoryId = data.inventoryId || null;
  const medicineId = data.medicineId || null;

  if (inventoryId) {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, medicineId: true }
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    return {
      inventoryId: inventory.id,
      medicineId: medicineId || inventory.medicineId
    };
  }

  if (medicineId) {
    return { inventoryId: null, medicineId };
  }

  throw new Error('medicineId is required');
};

const mapCartItem = (item) => ({
  id: item.id,
  customerId: item.customerId,
  medicineId: item.medicineId,
  inventoryId: item.inventoryId,
  quantity: item.quantity,
  selectedSize: item.selectedSize,
  priceSnapshotCents: item.priceSnapshotCents,
  currencyCode: item.currencyCode,
  addedAt: item.createdAt,
  updatedAt: item.updatedAt,
  medicine: item.medicine,
  inventory: item.inventory,
  name: item.medicine?.name || 'Medicine',
  category: item.medicine?.category || 'General',
  imageUrl: item.inventory?.imageUrl || item.medicine?.inventory?.[0]?.imageUrl || null,
  vendor: item.inventory?.vendor?.companyName || item.medicine?.brand || 'Trusted vendor',
  retailPrice: Number(item.priceSnapshotCents ?? item.medicine?.priceCents ?? 0) / 100,
  wholesalePrice: Number(item.medicine?.wholesalePriceCents ?? item.medicine?.priceCents ?? 0) / 100,
  bulkPrice: Number(item.medicine?.bulkPriceCents ?? item.medicine?.priceCents ?? 0) / 100,
  bulkMinQty: item.medicine?.bulkMinQty || 1,
  basePrice: Number(item.priceSnapshotCents ?? item.medicine?.priceCents ?? 0) / 100
});

module.exports = {
  getUserCart: async (userId) => {
    const items = await prisma.cartItem.findMany({
      where: { customer: { userId } },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            category: true,
            priceCents: true,
            wholesalePriceCents: true,
            bulkMinQty: true,
            bulkPriceCents: true,
            brand: true,
            inventory: {
              where: { isActive: true },
              take: 1,
              orderBy: { updatedAt: 'desc' },
              select: {
                id: true,
                imageUrl: true,
                vendor: { select: { id: true, companyName: true } }
              }
            }
          }
        },
        inventory: {
          select: {
            id: true,
            imageUrl: true,
            vendor: { select: { id: true, companyName: true } }
          }
        }
      }
    });
    return items.map(mapCartItem);
  },

  addItem: async (userId, data) => {
    // Resolve customer id
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new Error('Customer profile not found');

    const resolved = await resolveCartMedicineIds(data);
    const quantity = Math.max(1, Number(data.quantity) || 1);

    const existing = await prisma.cartItem.findFirst({
      where: {
        customerId: customer.id,
        medicineId: resolved.medicineId,
        ...(resolved.inventoryId ? { inventoryId: resolved.inventoryId } : {})
      }
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          selectedSize: data.selectedSize || existing.selectedSize || null,
          priceSnapshotCents: data.priceSnapshotCents || existing.priceSnapshotCents,
          currencyCode: data.currencyCode || existing.currencyCode || 'INR'
        }
      });
    }

    const payload = {
      customerId: customer.id,
      medicineId: resolved.medicineId,
      inventoryId: resolved.inventoryId,
      quantity,
      selectedSize: data.selectedSize || null,
      priceSnapshotCents: data.priceSnapshotCents || null,
      currencyCode: data.currencyCode || 'INR'
    };
    return prisma.cartItem.create({ data: payload });
  },

  updateItem: async (userId, id, data) => {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new Error('Customer profile not found');
    // Ensure ownership
    const existing = await prisma.cartItem.findUnique({ where: { id } });
    if (!existing || existing.customerId !== customer.id) throw new Error('Not found');
    return prisma.cartItem.update({ where: { id }, data });
  },

  removeItem: async (userId, id) => {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new Error('Customer profile not found');
    const existing = await prisma.cartItem.findUnique({ where: { id } });
    if (!existing || existing.customerId !== customer.id) throw new Error('Not found');
    return prisma.cartItem.delete({ where: { id } });
  },

  clearCart: async (userId) => {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new Error('Customer profile not found');
    const result = await prisma.cartItem.deleteMany({ where: { customerId: customer.id } });
    return result;
  }
};
