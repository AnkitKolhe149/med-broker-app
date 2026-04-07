const assert = require('node:assert/strict');
const { resolveOrderItemUnitPriceCents } = require('../src/modules/orders/orderPricing.util');
const { ValidationError } = require('../src/utils/errors');

const baseMedicine = {
  priceCents: 1000,
  wholesalePriceCents: 850,
  bulkPriceCents: 700,
  bulkMinQty: 10
};

const run = () => {
  // Retail buyer should always get retail pricing on standard package.
  const retailPrice = resolveOrderItemUnitPriceCents({
    medicine: baseMedicine,
    buyerType: 'RETAIL',
    quantity: 3,
    packageType: 'standard'
  });
  assert.equal(retailPrice, 1000, 'Retail buyer should get retail unit price');

  // Wholesale buyer below bulk threshold should get wholesale pricing.
  const wholesalePrice = resolveOrderItemUnitPriceCents({
    medicine: baseMedicine,
    buyerType: 'WHOLESALE',
    quantity: 5,
    packageType: 'standard'
  });
  assert.equal(wholesalePrice, 850, 'Wholesale buyer below threshold should get wholesale unit price');

  // Wholesale buyer at threshold should get bulk pricing.
  const wholesaleBulkPrice = resolveOrderItemUnitPriceCents({
    medicine: baseMedicine,
    buyerType: 'WHOLESALE',
    quantity: 10,
    packageType: 'standard'
  });
  assert.equal(wholesaleBulkPrice, 700, 'Wholesale buyer at bulk threshold should get bulk unit price');

  // Explicit bulk package below threshold should fail validation.
  assert.throws(
    () =>
      resolveOrderItemUnitPriceCents({
        medicine: baseMedicine,
        buyerType: 'RETAIL',
        quantity: 2,
        packageType: 'bulk'
      }),
    (error) => error instanceof ValidationError,
    'Bulk package below threshold should throw ValidationError'
  );

  console.log('order pricing tests passed');
};

run();
