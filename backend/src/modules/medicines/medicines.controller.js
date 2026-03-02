const medicinesService = require('./medicines.service');

module.exports = {
  getMedicines: async (req, res, next) => {
    try {
      const result = await medicinesService.listMedicines(req.query);

      return res.json({
        success: true,
        data: result.items,
        pagination: result.pagination
      });
    } catch (error) {
      return next(error);
    }
  }
};
