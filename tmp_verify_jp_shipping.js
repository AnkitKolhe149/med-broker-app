const { calculateShipping } = require('./backend/src/modules/shipping/shipping.service');
try {
  const quote = calculateShipping({ items:[{quantity:2,unitPrice:100}], originCountry:'IN', destinationCountry:'JP' });
  console.log(JSON.stringify(quote, null, 2));
} catch (err) {
  console.error(err.message);
}
