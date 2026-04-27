const service = require('./reviews.service');

module.exports = {
  listForMedicine: async (req, res, next) => {
    try {
      const result = await service.listForMedicine(req.params.medicineId, { page: req.query.page, limit: req.query.limit });
      res.json({ success: true, data: result.items, pagination: result.pagination });
    } catch (err) { next(err); }
  },

  createReview: async (req, res, next) => {
    try {
      const item = await service.create(req.user.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  }
};
