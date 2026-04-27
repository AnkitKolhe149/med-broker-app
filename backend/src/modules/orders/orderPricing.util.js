const { ValidationError } = require('../../utils/errors');

/**
 * PRICING TIER SYSTEM (2-Tier Architecture)
 * Simple Retail vs Wholesale pricing
 */

const resolveOrderItemUnitPriceCents = ({ medicine, buyerType, quantity, packageType }) => {
  const retailPriceCents = medicine.priceCents;
  const wholesalePriceCents = medicine.wholesalePriceCents ?? retailPriceCents;
  const normalizedBuyerType = String(buyerType || 'RETAIL').toUpperCase();

  if (normalizedBuyerType !== 'WHOLESALE') {
    return retailPriceCents;
  }

  return wholesalePriceCents;
};

const validatePricingLogic = (medicine) => {
  const errors = [];
  const retail = medicine.priceCents || 0;
  const wholesale = medicine.wholesalePriceCents;

  if (wholesale && wholesale > retail) {
    errors.push(
      `Wholesale Price (₹${(wholesale / 100).toFixed(2)}) cannot exceed Retail Price (₹${(retail / 100).toFixed(2)}).`
    );
  }

  if (errors.length > 0) {
    throw new ValidationError('Pricing validation failed: ' + errors.join(' '));
  }
};

module.exports = {
  resolveOrderItemUnitPriceCents,
  validatePricingLogic
};
