const shippingService = require('./shipping.service');
const { ValidationError } = require('../../utils/errors');

const normalizeBody = (body) => (body && typeof body === 'object' ? body : {});

module.exports = {
  quote: async (req, res, next) => {
    try {
      const body = normalizeBody(req.body);

      if (Array.isArray(body.shipments)) {
        if (!body.destinationCountry) {
          throw new ValidationError('destinationCountry is required');
        }
      } else {
        if (!body.destinationCountry) {
          throw new ValidationError('destinationCountry is required');
        }
        if (!Array.isArray(body.items)) {
          body.items = [];
        }
      }

      let data;
      try {
        data = shippingService.calculateShipping(body);
      } catch (err) {
        const message = err && err.message ? String(err.message) : '';
        if (message.includes('Shipping lane not found')) {
          throw new ValidationError(message);
        }
        throw err;
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};
