const adminService = require('./admin.service');

module.exports = {
  getDashboardStats: async (req, res, next) => {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  getPendingVendors: async (req, res, next) => {
    try {
      const vendors = await adminService.getPendingVendors();
      res.json({ success: true, data: vendors });
    } catch (error) {
      next(error);
    }
  },

  updateVendorStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const vendor = await adminService.updateVendorStatus(id, status);
      res.json({ success: true, data: vendor });
    } catch (error) {
      next(error);
    }
  },

  getPayoutOverview: async (req, res, next) => {
    try {
      const overview = await adminService.getPayoutOverview();
      res.json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  },

  processPayout: async (req, res, next) => {
    try {
      const { vendorId } = req.params;
      const { amountCents } = req.body;
      const payout = await adminService.processPayout(vendorId, amountCents);
      res.json({ success: true, data: payout });
    } catch (error) {
      next(error);
    }
  }
};
