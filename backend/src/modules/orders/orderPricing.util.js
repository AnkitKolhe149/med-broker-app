const { ValidationError } = require('../../utils/errors');

const resolveOrderItemUnitPriceCents = ({ medicine, buyerType, quantity, packageType }) => {
  const retailPriceCents = medicine.priceCents;
  const wholesalePriceCents = medicine.wholesalePriceCents ?? retailPriceCents;
  const bulkPriceCents = medicine.bulkPriceCents ?? wholesalePriceCents;
  const bulkMinQty = medicine.bulkMinQty || 1;
  const isBulkPackage = String(packageType || '').toLowerCase() === 'bulk';
  const normalizedBuyerType = String(buyerType || 'RETAIL').toUpperCase();

  if (isBulkPackage && normalizedBuyerType !== 'WHOLESALE') {
    throw new ValidationError('Bulk package is available only for wholesale buyers');
  }

  if (isBulkPackage && quantity < bulkMinQty) {
    throw new ValidationError(`Bulk package requires minimum quantity of ${bulkMinQty}`);
  }

  if (isBulkPackage) {
    return bulkPriceCents;
  }

  if (normalizedBuyerType === 'WHOLESALE') {
    if (quantity >= bulkMinQty) {
      return bulkPriceCents;
    }

    return wholesalePriceCents;
  }

  return retailPriceCents;
};

module.exports = {
  resolveOrderItemUnitPriceCents
};
