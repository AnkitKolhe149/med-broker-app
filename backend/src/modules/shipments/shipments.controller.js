const service = require('./shipments.service');

module.exports = {
  createShipment: async (req, res, next) => {
    try {
      const item = await service.create(req.user.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  getShipmentByOrder: async (req, res, next) => {
    try {
      const item = await service.getByOrder(req.user.id, req.params.orderId);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  updateShipment: async (req, res, next) => {
    try {
      const item = await service.update(req.user.id, req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }
};
