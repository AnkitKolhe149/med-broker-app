const { prisma } = require("../../database/prisma");

const RATE_CACHE_TTL_MS = 60 * 1000;
const RATE_FETCH_RETRIES = 2;
const RATE_FETCH_RETRY_DELAY_MS = 300;
const rateCache = new Map();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isDatabaseConnectivityError = (error) => {
  if (!error) {
    return false;
  }

  const message = String(error.message || "").toLowerCase();
  return (
    error.code === "P1001" ||
    error.code === "P1017" ||
    message.includes("can't reach database server") ||
    message.includes("connection") ||
    message.includes("timed out")
  );
};

const getLatestRates = async (baseCode) => {
  const normalizedBase = baseCode.toUpperCase();
  const cached = rateCache.get(normalizedBase);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let lastError = null;
  for (let attempt = 1; attempt <= RATE_FETCH_RETRIES; attempt += 1) {
    try {
      const record = await prisma.exchangeRate.findUnique({
        where: { baseCode: normalizedBase }
      });

      rateCache.set(normalizedBase, {
        value: record,
        expiresAt: Date.now() + RATE_CACHE_TTL_MS
      });

      return record;
    } catch (error) {
      lastError = error;

      if (!isDatabaseConnectivityError(error) || attempt === RATE_FETCH_RETRIES) {
        break;
      }

      await wait(RATE_FETCH_RETRY_DELAY_MS * attempt);
    }
  }

  // Serve stale cached rates if DB has a temporary connectivity issue.
  if (cached && isDatabaseConnectivityError(lastError)) {
    return cached.value;
  }

  throw lastError;
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
