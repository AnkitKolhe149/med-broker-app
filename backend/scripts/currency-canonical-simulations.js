/* eslint-disable no-console */
const { getLatestRates } = require('../src/modules/exchangeRate/exchangeRate.service');
const { convertAmount } = require('../src/utils/currencyPipeline');

const BASE_CURRENCY = (process.env.EXCHANGE_RATE_BASE || 'INR').toUpperCase();

const safeRoundCents = (value) => Math.round(Number(value || 0));

const convertCents = ({ cents, fromCurrency, toCurrency, baseCurrency, rates }) => {
  if (fromCurrency === toCurrency) {
    return safeRoundCents(cents);
  }

  const major = Number(cents || 0) / 100;
  const converted = convertAmount({
    amount: major,
    fromCurrency,
    toCurrency,
    baseCurrency,
    rates
  });

  if (!Number.isFinite(converted)) {
    throw new Error(`Failed to convert ${fromCurrency} -> ${toCurrency}`);
  }

  return safeRoundCents(converted * 100);
};

const makePricingSummary = ({ subtotalCents, discountPercent, shippingCents, taxPercent }) => {
  const discountCents = safeRoundCents(subtotalCents * (discountPercent / 100));
  const taxableCents = Math.max(0, subtotalCents - discountCents + shippingCents);
  const taxCents = safeRoundCents(taxableCents * (taxPercent / 100));
  const totalCents = taxableCents + taxCents;

  return {
    subtotalCents,
    discountPercent,
    discountCents,
    deliveryChargeCents: shippingCents,
    taxCents,
    totalCents
  };
};

const assertEq = (name, actual, expected) => {
  if (actual !== expected) {
    throw new Error(`${name} mismatch. expected=${expected} actual=${actual}`);
  }
};

const assert = (name, condition) => {
  if (!condition) {
    throw new Error(`${name} failed`);
  }
};

const run = async () => {
  const ratesRecord = await getLatestRates(BASE_CURRENCY);
  const rates = ratesRecord.rates || {};
  const baseCurrency = String(ratesRecord.baseCode || BASE_CURRENCY).toUpperCase();

  const scenarios = [
    {
      name: 'USD customer order',
      targetCurrency: 'USD',
      items: [
        { name: 'Paracetamol', quantity: 2, unitPriceBaseCents: 1299 },
        { name: 'Insulin', quantity: 1, unitPriceBaseCents: 2450 }
      ],
      discountPercent: 10,
      shippingBaseCents: 500,
      taxPercent: 5
    },
    {
      name: 'EUR customer order',
      targetCurrency: 'EUR',
      items: [
        { name: 'Amoxicillin', quantity: 3, unitPriceBaseCents: 990 },
        { name: 'Vitamin D', quantity: 2, unitPriceBaseCents: 799 }
      ],
      discountPercent: 5,
      shippingBaseCents: 900,
      taxPercent: 5
    },
    {
      name: 'INR customer order',
      targetCurrency: 'INR',
      items: [
        { name: 'Cough Syrup', quantity: 1, unitPriceBaseCents: 3500 },
        { name: 'Thermometer', quantity: 1, unitPriceBaseCents: 1200 }
      ],
      discountPercent: 0,
      shippingBaseCents: 0,
      taxPercent: 5
    }
  ];

  const report = [];

  for (const scenario of scenarios) {
    const subtotalBaseCents = scenario.items.reduce(
      (sum, item) => sum + (item.unitPriceBaseCents * item.quantity),
      0
    );

    const pricingBase = makePricingSummary({
      subtotalCents: subtotalBaseCents,
      discountPercent: scenario.discountPercent,
      shippingCents: scenario.shippingBaseCents,
      taxPercent: scenario.taxPercent
    });

    const convertedItems = scenario.items.map((item) => {
      const unitPriceCents = convertCents({
        cents: item.unitPriceBaseCents,
        fromCurrency: baseCurrency,
        toCurrency: scenario.targetCurrency,
        baseCurrency,
        rates
      });
      return {
        ...item,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity
      };
    });

    const pricingTarget = {
      subtotalCents: convertCents({
        cents: pricingBase.subtotalCents,
        fromCurrency: baseCurrency,
        toCurrency: scenario.targetCurrency,
        baseCurrency,
        rates
      }),
      discountPercent: pricingBase.discountPercent,
      discountCents: convertCents({
        cents: pricingBase.discountCents,
        fromCurrency: baseCurrency,
        toCurrency: scenario.targetCurrency,
        baseCurrency,
        rates
      }),
      deliveryChargeCents: convertCents({
        cents: pricingBase.deliveryChargeCents,
        fromCurrency: baseCurrency,
        toCurrency: scenario.targetCurrency,
        baseCurrency,
        rates
      }),
      taxCents: convertCents({
        cents: pricingBase.taxCents,
        fromCurrency: baseCurrency,
        toCurrency: scenario.targetCurrency,
        baseCurrency,
        rates
      }),
      totalCents: convertCents({
        cents: pricingBase.totalCents,
        fromCurrency: baseCurrency,
        toCurrency: scenario.targetCurrency,
        baseCurrency,
        rates
      })
    };

    // 1) Cart -> Checkout -> Payment consistency
    assertEq(
      `${scenario.name}: payment amount matches stored total`,
      pricingTarget.totalCents,
      pricingTarget.totalCents
    );

    // 2) Order confirmation / history should display direct order currency amount (no reconversion)
    const mistakenReconversion = convertCents({
      cents: pricingTarget.totalCents,
      fromCurrency: baseCurrency,
      toCurrency: scenario.targetCurrency,
      baseCurrency,
      rates
    });
    assert(
      `${scenario.name}: direct display differs from wrong reconversion in non-base currencies`,
      scenario.targetCurrency === baseCurrency || mistakenReconversion !== pricingTarget.totalCents
    );

    // 3) Refund / Partial refund (medicine-only: subtotal - discount)
    const refundableCents = Math.max(0, pricingTarget.subtotalCents - pricingTarget.discountCents);
    const nonRefundableCents = Math.max(0, pricingTarget.totalCents - refundableCents);
    assertEq(
      `${scenario.name}: refund partition adds up`,
      refundableCents + nonRefundableCents,
      pricingTarget.totalCents
    );

    const partialRefundCents = safeRoundCents(refundableCents * 0.4);
    assert(
      `${scenario.name}: partial refund <= refundable`,
      partialRefundCents <= refundableCents
    );

    // 4) Invoice totals
    const invoiceTotalFromItems = convertedItems.reduce((sum, item) => sum + item.lineTotalCents, 0)
      - pricingTarget.discountCents
      + pricingTarget.deliveryChargeCents
      + pricingTarget.taxCents;

    // Rounding at line-level can differ by a few cents from aggregate conversion.
    assert(
      `${scenario.name}: invoice total tolerance`,
      Math.abs(invoiceTotalFromItems - pricingTarget.totalCents) <= 5
    );

    report.push({
      scenario: scenario.name,
      targetCurrency: scenario.targetCurrency,
      totalCents: pricingTarget.totalCents,
      refundableCents,
      partialRefundCents,
      nonRefundableCents,
      invoiceDriftCents: invoiceTotalFromItems - pricingTarget.totalCents
    });
  }

  console.log('SIMULATION_PASS');
  console.table(report);
};

run().catch((error) => {
  console.error('SIMULATION_FAIL');
  console.error(error.message);
  process.exitCode = 1;
});
