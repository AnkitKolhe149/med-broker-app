const { prisma } = require('../../database/prisma');

const resolveMedicineId = async (id) => {
  if (!id) {
    throw new Error('medicineId is required');
  }

  const directMedicine = await prisma.medicine.findUnique({ where: { id } });
  if (directMedicine) {
    return directMedicine.id;
  }

  // Fallback: frontend may accidentally send inventory id
  const inventory = await prisma.inventory.findUnique({ where: { id }, select: { medicineId: true } });
  if (inventory?.medicineId) {
    return inventory.medicineId;
  }

  throw new Error('Medicine not found');
};

const PAYMENT_CONFIG = require('../../config/payment');
const { normalizeCurrencyCode } = require('../../utils/currencyPipeline');

const mapWishlistItem = (item, currencyCode) => {
  const medicine = item?.medicine || {};
  const firstInventory = Array.isArray(medicine.inventory) ? medicine.inventory[0] : null;

  return {
    id: item.id,
    medicineId: item.medicineId,
    inventoryId: firstInventory?.id || null,
    name: medicine.name || 'Medicine',
    category: medicine.category || 'General',
    imageUrl: firstInventory?.imageUrl || null,
    vendor: firstInventory?.vendor?.companyName || medicine.brand || 'Trusted vendor',
    retailPrice: Number(medicine.priceCents || 0) / 100,
    wholesalePrice: Number(medicine.wholesalePriceCents || medicine.priceCents || 0) / 100,
    currencyCode: currencyCode,
    addedAt: item.createdAt
  };
};

module.exports = {
  getFavorites: async (userId) => {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) return [];

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferredCurrency: true } });
    const fallback = normalizeCurrencyCode(user?.preferredCurrency) || normalizeCurrencyCode(PAYMENT_CONFIG.currency) || String(process.env.EXCHANGE_RATE_BASE || 'INR').toUpperCase();

    const items = await prisma.wishlistItem.findMany({
      where: { customerId: customer.id },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            brand: true,
            category: true,
            priceCents: true,
            wholesalePriceCents: true,
            inventory: {
              where: { isActive: true },
              take: 1,
              orderBy: { updatedAt: 'desc' },
              select: {
                id: true,
                imageUrl: true,
                vendor: {
                  select: {
                    companyName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return items.map((it) => mapWishlistItem(it, fallback));
  },

  addFavorite: async (userId, medicineId) => {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new Error('Customer profile not found');
    const resolvedMedicineId = await resolveMedicineId(medicineId);

    // upsert unique key
    const item = await prisma.wishlistItem.upsert({
      where: { customerId_medicineId: { customerId: customer.id, medicineId: resolvedMedicineId } },
      update: { },
      create: { customerId: customer.id, medicineId: resolvedMedicineId }
    });

    return item;
  },

  removeFavorite: async (userId, id) => {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new Error('Customer profile not found');
    const existing = await prisma.wishlistItem.findUnique({ where: { id } });
    if (!existing || existing.customerId !== customer.id) throw new Error('Not found');
    return prisma.wishlistItem.delete({ where: { id } });
  }
};
