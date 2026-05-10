const { calculateShipping } = require('./backend/src/modules/shipping/shipping.service');
console.log('legacy', calculateShipping({ items:[{quantity:10,unitPrice:120}], destinationCountry:'IN' }));
console.log('single', calculateShipping({ items:[{quantity:4,unitPrice:50}], originCountry:'US', destinationCountry:'KE' }));
console.log('multi', calculateShipping({ destinationCountry:'KE', shipments:[{originCountry:'IN', items:[{quantity:5,unitPrice:80}]},{originCountry:'US', items:[{quantity:3,unitPrice:40}]}] }));
