const medicinesService = require('./medicines.service');

module.exports = {
  getMedicines: async (req, res, next) => {
    try {
      const result = await medicinesService.listMedicines(req.query, { user: req.user || null });

      return res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        currency: result.currency
      });
    } catch (error) {
      return next(error);
    }
  },

  getMedicineById: async (req, res, next) => {
    try {
      const result = await medicinesService.getMedicineById(req.params.id, req.query, { user: req.user || null });

      return res.json({
        success: true,
        data: result.item,
        currency: result.currency
      });
    } catch (error) {
      return next(error);
    }
  }
};
