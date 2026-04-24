const express = require("express");
const { getLatestRates, convertFromBase } = require("./exchangeRate.service");
const { getEnv } = require("../../config/env");

const router = express.Router();

router.get("/latest", async (req, res, next) => {
  try {
    const base = (req.query.base || getEnv("EXCHANGE_RATE_BASE", "INR")).toUpperCase();
    const rateRecord = await getLatestRates(base);

    if (!rateRecord) {
      return res.status(404).json({
        error: "Exchange rates not available",
        base
      });
    }

    return res.json({
      base: rateRecord.baseCode,
      fetchedAt: rateRecord.fetchedAt,
      rates: rateRecord.rates,
      source: rateRecord.source || "db"
    });
  } catch (error) {
    console.error("Exchange-rate latest fetch failed:", error.message);
    return res.status(503).json({
      error: "Exchange rates temporarily unavailable",
      base: (req.query.base || getEnv("EXCHANGE_RATE_BASE", "INR")).toUpperCase()
    });
  }
});

router.get("/convert", async (req, res, next) => {
  try {
    const base = (req.query.base || getEnv("EXCHANGE_RATE_BASE", "INR")).toUpperCase();
    const target = (req.query.to || "").toUpperCase();
    const amount = Number(req.query.amount || 0);

    if (!target || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Invalid request",
        details: "Provide amount > 0 and target currency via 'to'"
      });
    }

    const rateRecord = await getLatestRates(base);
    if (!rateRecord) {
      return res.status(404).json({
        error: "Exchange rates not available",
        base
      });
    }

    const convertedAmount = convertFromBase(amount, target, rateRecord.rates);
    if (convertedAmount === null) {
      return res.status(400).json({
        error: "Unsupported currency",
        target
      });
    }

    return res.json({
      base,
      target,
      amount,
      convertedAmount,
      fetchedAt: rateRecord.fetchedAt,
      source: rateRecord.source || "db"
    });
  } catch (error) {
    console.error("Exchange-rate convert failed:", error.message);
    return res.status(503).json({
      error: "Exchange-rate conversion temporarily unavailable"
    });
  }
});

module.exports = router;
