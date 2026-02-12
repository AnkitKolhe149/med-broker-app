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
  return prisma.exchangeRate.upsert({
    where: { baseCode: data.baseCode },
    update: {
      rates: data.rates,
      fetchedAt: data.fetchedAt,
      source: "exchangerate-api"
    },
    create: {
      baseCode: data.baseCode,
      rates: data.rates,
      fetchedAt: data.fetchedAt,
      source: "exchangerate-api"
    }
  });
};

const runExchangeRateSync = async () => {
  const rateData = await fetchRates();
  await upsertRates(rateData);
};

const startExchangeRateScheduler = () => {
  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      try {
        await runExchangeRateSync();
        console.log("✓ Exchange rates updated");
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
