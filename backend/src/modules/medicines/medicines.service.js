const { prisma } = require('../../database/prisma');
const { getEnv } = require('../../config/env');
const { getLatestRates } = require('../exchangeRate/exchangeRate.service');
const { NotFoundError } = require('../../utils/errors');
const {
  normalizeCurrencyCode,
  getCurrencyForCountry,
  convertAmount
} = require('../../utils/currencyPipeline');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const COUNT_CACHE_TTL_MS = 30 * 1000;
const BASE_CURRENCY = getEnv('EXCHANGE_RATE_BASE', 'INR').toUpperCase();
const DEFAULT_CURRENCY = getEnv('DEFAULT_CURRENCY', 'USD').toUpperCase();

let inventoryCountCache = {
  value: null,
  expiresAt: 0
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getInventoryCount = async () => {
  const now = Date.now();
  if (inventoryCountCache.value !== null && now < inventoryCountCache.expiresAt) {
    return inventoryCountCache.value;
  }

  const total = await prisma.inventory.count();
  inventoryCountCache = {
    value: total,
    expiresAt: now + COUNT_CACHE_TTL_MS
  };

  return total;
};

const resolveViewerCurrency = ({ query = {}, viewerContext = {} }) => {
  const explicitCurrency = normalizeCurrencyCode(query.currency);
  if (explicitCurrency) {
    return explicitCurrency;
  }

  if (query.country) {
    return getCurrencyForCountry(query.country, DEFAULT_CURRENCY);
  }

  const userCountry = viewerContext.user?.customer?.country || viewerContext.user?.vendor?.country;
  if (userCountry) {
    return getCurrencyForCountry(userCountry, DEFAULT_CURRENCY);
  }

  return DEFAULT_CURRENCY;
};

const mapInventoryToCatalogMedicine = (inventory, viewerCurrencyCode, exchangeRateRecord) => {
  const sourceCurrencyCode = BASE_CURRENCY;
  const sourceRetailPrice = Number((inventory.medicine.priceCents / 100).toFixed(2));
  const sourceWholesalePrice = Number((sourceRetailPrice * 0.9).toFixed(2));

  const convertedRetail = convertAmount({
    amount: sourceRetailPrice,
    fromCurrency: sourceCurrencyCode,
    toCurrency: viewerCurrencyCode,
    baseCurrency: exchangeRateRecord?.baseCode || BASE_CURRENCY,
    rates: exchangeRateRecord?.rates || {}
  });

  const convertedWholesale = convertAmount({
    amount: sourceWholesalePrice,
    fromCurrency: sourceCurrencyCode,
    toCurrency: viewerCurrencyCode,
    baseCurrency: exchangeRateRecord?.baseCode || BASE_CURRENCY,
    rates: exchangeRateRecord?.rates || {}
  });

  const retailPrice = Number((convertedRetail ?? sourceRetailPrice).toFixed(2));
  const wholesalePrice = Number((convertedWholesale ?? sourceWholesalePrice).toFixed(2));

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
    currencyCode: viewerCurrencyCode,
    sourceCurrencyCode,
    sourceRetailPrice,
    sourceWholesalePrice,
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
  listMedicines: async (query = {}, viewerContext = {}) => {
    const page = toPositiveInt(query.page, DEFAULT_PAGE);
    const requestedLimit = toPositiveInt(query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const includeTotal = query.includeTotal !== 'false';
    const viewerCurrency = resolveViewerCurrency({ query, viewerContext });

    const exchangeRateRecord = await getLatestRates(BASE_CURRENCY);

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          quantity: true,
          medicine: {
            select: {
              id: true,
              name: true,
              description: true,
              priceCents: true,
              createdAt: true
            }
          },
          vendor: {
            select: {
              id: true,
              companyName: true
            }
          }
        }
      }),
      includeTotal ? getInventoryCount() : Promise.resolve(null)
    ]);

    const normalizedTotal = total ?? items.length;

    return {
      currency: viewerCurrency,
      items: items.map((inventory) => mapInventoryToCatalogMedicine(inventory, viewerCurrency, exchangeRateRecord)),
      pagination: {
        page,
        limit,
        total: normalizedTotal,
        totalPages: limit > 0 ? Math.ceil(normalizedTotal / limit) : 0
      }
    };
  },

  getMedicineById: async (inventoryId, query = {}, viewerContext = {}) => {
    const viewerCurrency = resolveViewerCurrency({ query, viewerContext });
    const exchangeRateRecord = await getLatestRates(BASE_CURRENCY);

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        id: true,
        quantity: true,
        medicine: {
          select: {
            id: true,
            name: true,
            description: true,
            priceCents: true,
            createdAt: true
          }
        },
        vendor: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    });

    if (!inventory) {
      throw new NotFoundError('Medicine not found');
    }

    return {
      currency: viewerCurrency,
      item: mapInventoryToCatalogMedicine(inventory, viewerCurrency, exchangeRateRecord)
    };
  }
};
