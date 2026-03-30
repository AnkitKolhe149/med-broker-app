const vendorInsightsService = require('./vendorInsights.service');

module.exports = {
  getDashboard: async (req, res, next) => {
    try {
      const data = await vendorInsightsService.getDashboard(req.user.id);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found'
        });
      }

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      return next(error);
    }
  },

  getAnalytics: async (req, res, next) => {
    try {
      const range = req.query.range || 'month';
      const data = await vendorInsightsService.getAnalytics(req.user.id, range);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found'
        });
      }

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      return next(error);
    }
  }
};
