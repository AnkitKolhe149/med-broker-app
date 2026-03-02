const { prisma } = require('../../database/prisma');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const mapInventoryToCatalogMedicine = (inventory) => {
  const retailPrice = Number((inventory.medicine.priceCents / 100).toFixed(2));
  const wholesalePrice = Number((retailPrice * 0.9).toFixed(2));

  return {
    id: inventory.id,
    medicineId: inventory.medicine.id,
    name: inventory.medicine.name,
    category: 'General',
    composition: inventory.medicine.description || inventory.medicine.name,
    brand: inventory.vendor.companyName || 'Unknown Brand',
    dosageForm: 'Tablet',
    retailPrice,
    wholesalePrice,
    popularity: Math.min(100, Math.max(50, inventory.quantity)),
    addedAt: inventory.medicine.createdAt,
    requiresPrescription: false,
    vendor: inventory.vendor.companyName,
    vendorId: inventory.vendor.id,
    inStock: inventory.quantity > 0,
    stockLevel: inventory.quantity
  };
};

module.exports = {
  listMedicines: async (query = {}) => {
    const page = toPositiveInt(query.page, DEFAULT_PAGE);
    const requestedLimit = toPositiveInt(query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          medicine: true,
          vendor: {
            select: {
              id: true,
              companyName: true
            }
          }
        }
      }),
      prisma.inventory.count()
    ]);

    return {
      items: items.map(mapInventoryToCatalogMedicine),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};
