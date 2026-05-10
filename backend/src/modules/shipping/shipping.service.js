const { AVG_WEIGHT_GRAMS, getLaneRule } = require('../../config/shippingMatrix');

const DEFAULT_ORIGIN_COUNTRY = 'IN';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Money amounts returned from the quote API — 2 decimal places */
const roundMoney2 = (value) => {
  const n = toNumber(value);
  return Number(n.toFixed(2));
};

const normalizeCountry = (value, fallback = '') => {
  const normalized = String(value || fallback).trim().toUpperCase();
  return normalized;
};

const getItemQuantity = (item = {}) => {
  return Math.max(0, toNumber(item.quantity || item.qty || 0));
};

const getItemSubtotal = (item = {}) => {
  const directSubtotal = toNumber(item.subtotal);
  if (directSubtotal > 0) {
    return directSubtotal;
  }

  const lineTotal = toNumber(item.lineTotal);
  if (lineTotal > 0) {
    return lineTotal;
  }

  const lineTotalCents = toNumber(item.lineTotalCents);
  if (lineTotalCents > 0) {
    return lineTotalCents / 100;
  }

  const quantity = getItemQuantity(item);
  const unitPrice = toNumber(item.unitPrice || item.price || item.rate);
  if (unitPrice > 0) {
    return quantity * unitPrice;
  }

  const unitPriceCents = toNumber(item.unitPriceCents || item.priceCents);
  if (unitPriceCents > 0) {
    return (quantity * unitPriceCents) / 100;
  }

  return 0;
};

const aggregateItems = (items = []) => {
  return items.reduce(
    (acc, item) => {
      acc.totalQty += getItemQuantity(item);
      acc.subtotal += getItemSubtotal(item);
      return acc;
    },
    { totalQty: 0, subtotal: 0 }
  );
};

const calculateWeightKg = (totalQty) => {
  return (toNumber(totalQty) * AVG_WEIGHT_GRAMS) / 1000;
};

const calculateLaneTotals = ({ originCountry, destinationCountry, subtotal, totalQty }) => {
  const laneRule = getLaneRule(originCountry, destinationCountry);
  if (!laneRule) {
    throw new Error(`Shipping lane not found for ${originCountry} -> ${destinationCountry}`);
  }

  // Required formula:
  // totalWeightKg = (totalQty * 75) / 1000
  // shippingCost = baseFee + (ratePerKg * totalWeightKg * distanceMultiplier)
  // totalShipping = max(minCharge, shippingCost)
  // grandTotal = subtotal + totalShipping
  const totalWeightKg = calculateWeightKg(totalQty);
  const shippingCost = laneRule.baseFee + (laneRule.ratePerKg * totalWeightKg * laneRule.distanceMultiplier);
  const totalShippingRaw = Math.max(laneRule.minCharge, shippingCost);
  const subtotalMoney = roundMoney2(subtotal);
  const totalShipping = roundMoney2(totalShippingRaw);
  const grandTotal = roundMoney2(subtotalMoney + totalShipping);

  return {
    originCountry,
    destinationCountry,
    subtotal: subtotalMoney,
    totalQty: toNumber(totalQty),
    totalWeightKg: Number(Number(totalWeightKg).toFixed(4)),
    baseFee: roundMoney2(laneRule.baseFee),
    ratePerKg: roundMoney2(laneRule.ratePerKg),
    distanceMultiplier: laneRule.distanceMultiplier,
    minCharge: roundMoney2(laneRule.minCharge),
    shippingCost: roundMoney2(shippingCost),
    totalShipping,
    grandTotal
  };
};

const calculateForLegacyPayload = ({ items = [], destinationCountry }) => {
  const destination = normalizeCountry(destinationCountry);
  const origin = DEFAULT_ORIGIN_COUNTRY;
  const { totalQty, subtotal } = aggregateItems(items);

  return {
    mode: 'legacy',
    ...calculateLaneTotals({
      originCountry: origin,
      destinationCountry: destination,
      subtotal,
      totalQty
    })
  };
};

const calculateForSingleLanePayload = ({ items = [], originCountry, destinationCountry }) => {
  const origin = normalizeCountry(originCountry, DEFAULT_ORIGIN_COUNTRY);
  const destination = normalizeCountry(destinationCountry);
  const { totalQty, subtotal } = aggregateItems(items);

  return {
    mode: 'single-lane',
    ...calculateLaneTotals({
      originCountry: origin,
      destinationCountry: destination,
      subtotal,
      totalQty
    })
  };
};

const calculateForMultiOriginPayload = ({ destinationCountry, shipments = [] }) => {
  const destination = normalizeCountry(destinationCountry);
  const breakdown = shipments.map((shipment, index) => {
    const origin = normalizeCountry(shipment.originCountry, DEFAULT_ORIGIN_COUNTRY);
    const { totalQty, subtotal } = aggregateItems(shipment.items || []);
    const laneTotals = calculateLaneTotals({
      originCountry: origin,
      destinationCountry: destination,
      subtotal,
      totalQty
    });

    return {
      shipmentIndex: index,
      ...laneTotals
    };
  });

  const subtotal = roundMoney2(breakdown.reduce((sum, lane) => sum + lane.subtotal, 0));
  const totalShipping = roundMoney2(breakdown.reduce((sum, lane) => sum + lane.totalShipping, 0));
  const grandTotal = roundMoney2(breakdown.reduce((sum, lane) => sum + lane.grandTotal, 0));

  return {
    mode: 'multi-origin',
    destinationCountry: destination,
    shipments: breakdown,
    subtotal,
    totalShipping,
    grandTotal
  };
};

const calculateShipping = (payload = {}) => {
  if (Array.isArray(payload.shipments)) {
    return calculateForMultiOriginPayload(payload);
  }

  const hasExplicitOrigin = payload.originCountry != null;
  if (hasExplicitOrigin) {
    return calculateForSingleLanePayload(payload);
  }

  return calculateForLegacyPayload(payload);
};

module.exports = {
  DEFAULT_ORIGIN_COUNTRY,
  calculateWeightKg,
  calculateShipping
};
