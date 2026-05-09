const { prisma } = require("../../database/prisma");
const { getEnv } = require("../../config/env");

const RATE_CACHE_TTL_MS = 60 * 1000;
const RATE_FETCH_RETRIES = 2;
const RATE_FETCH_RETRY_DELAY_MS = 300;
const rateCache = new Map();
const API_KEY = getEnv("EXCHANGE_RATE_API_KEY", "");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchRatesFromApi = async (baseCode) => {
  if (!API_KEY) {
    throw new Error("EXCHANGE_RATE_API_KEY is missing");
  }

  if (typeof fetch !== "function") {
    throw new Error("Global fetch is unavailable. Use Node 18+ or add a fetch polyfill.");
  }

  const { getEnv } = require("../../config/env");
  const normalizedBase = String(baseCode || getEnv("EXCHANGE_RATE_BASE", "INR")).toUpperCase();
  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${normalizedBase}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Exchange rate API error: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.result !== "success") {
    throw new Error(`Exchange rate API error: ${payload["error-type"] || "unknown"}`);
  }

  return {
    baseCode: payload.base_code,
    rates: payload.conversion_rates,
    fetchedAt: new Date(payload.time_last_update_utc),
    source: "exchangerate-api"
  };
};

const isDatabaseConnectivityError = (error) => {
  if (!error) {
    return false;
  }

  const message = String(error.message || "").toLowerCase();
  return (
    error.code === "P1001" ||
    error.code === "P1017" ||
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT" ||
    error.code === "EPIPE" ||
    message.includes("can't reach database server") ||
    message.includes("connection") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("socket hang up")
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

      if (!record) {
        break;
      }

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

  // Fallback to live provider when DB is unavailable or has no record.
  try {
    const liveRates = await fetchRatesFromApi(normalizedBase);
    rateCache.set(normalizedBase, {
      value: liveRates,
      expiresAt: Date.now() + RATE_CACHE_TTL_MS
    });
    return liveRates;
  } catch (apiError) {
    if (cached) {
      return cached.value;
    }

    if (!lastError) {
      throw apiError;
    }
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
