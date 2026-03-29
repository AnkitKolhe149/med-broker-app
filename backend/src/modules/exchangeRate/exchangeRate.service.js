const { prisma } = require("../../database/prisma");

const RATE_CACHE_TTL_MS = 60 * 1000;
const rateCache = new Map();

const getLatestRates = async (baseCode) => {
  const normalizedBase = baseCode.toUpperCase();
  const cached = rateCache.get(normalizedBase);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const record = await prisma.exchangeRate.findUnique({
    where: { baseCode: normalizedBase }
  });

  rateCache.set(normalizedBase, {
    value: record,
    expiresAt: Date.now() + RATE_CACHE_TTL_MS
  });

  return record;
};

const convertFromBase = (amount, targetCode, rates) => {
  const normalizedTarget = targetCode.toUpperCase();
  const rate = rates[normalizedTarget];
  if (!rate) {
    return null;
  }

  return amount * rate;
};

module.exports = { getLatestRates, convertFromBase };
