const cron = require("node-cron");
const { prisma } = require("../database/prisma");
const { getEnv } = require("../config/env");

const BASE_CURRENCY = getEnv("EXCHANGE_RATE_BASE", "INR").toUpperCase();
const API_KEY = getEnv("EXCHANGE_RATE_API_KEY", "");
const CRON_SCHEDULE = getEnv("EXCHANGE_RATE_CRON", "0 3 * * *");
const CRON_TZ = getEnv("EXCHANGE_RATE_TZ", "Asia/Kolkata");

const fetchRates = async () => {
  if (!API_KEY) {
    throw new Error("EXCHANGE_RATE_API_KEY is missing");
  }

  if (typeof fetch !== "function") {
    throw new Error("Global fetch is unavailable. Use Node 18+ or add a fetch polyfill.");
  }

  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`;
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
    fetchedAt: new Date(payload.time_last_update_utc)
  };
};

const upsertRates = async (data) => {
  const normalizedBaseCode = String(data.baseCode || "").trim().toUpperCase();

  if (!normalizedBaseCode) {
    throw new Error("Invalid base currency code");
  }

  const payload = {
    rates: data.rates,
    fetchedAt: data.fetchedAt,
    source: "exchangerate-api"
  };

  const exactRecord = await prisma.exchangeRate.findUnique({
    where: { baseCode: normalizedBaseCode },
    select: { baseCode: true }
  });

  if (exactRecord) {
    return prisma.exchangeRate.update({
      where: { baseCode: normalizedBaseCode },
      data: payload
    });
  }

  const insensitiveMatch = await prisma.exchangeRate.findFirst({
    where: {
      baseCode: {
        equals: normalizedBaseCode,
        mode: "insensitive"
      }
    },
    select: { baseCode: true }
  });

  if (insensitiveMatch) {
    return prisma.exchangeRate.update({
      where: { baseCode: insensitiveMatch.baseCode },
      data: {
        ...payload,
        baseCode: normalizedBaseCode
      }
    });
  }

  return prisma.exchangeRate.create({
    data: {
      baseCode: normalizedBaseCode,
      ...payload
    }
  });
};

const isDatabaseConnectivityError = (error) => {
  if (!error) {
    return false;
  }

  const message = String(error.message || "");
  return error.code === "P1001" || message.includes("Can't reach database server");
};

const runExchangeRateSync = async () => {
  const rateData = await fetchRates();

  try {
    await upsertRates(rateData);
    return { persisted: true, rateData };
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.warn("⚠ Exchange rates fetched from API but could not be persisted (database unavailable)");
      return { persisted: false, rateData };
    }

    throw error;
  }
};

const startExchangeRateScheduler = () => {
  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      try {
        const result = await runExchangeRateSync();
        if (result.persisted) {
          console.log("✓ Exchange rates updated");
        }
      } catch (error) {
        console.error("✗ Exchange rate update failed:", error.message);
      }
    },
    { timezone: CRON_TZ }
  );

  runExchangeRateSync().catch((error) => {
    console.error("✗ Initial exchange rate sync failed:", error.message);
  });
};

module.exports = { startExchangeRateScheduler, runExchangeRateSync };
