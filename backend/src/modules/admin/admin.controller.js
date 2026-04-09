const adminService = require('./admin.service');
const paymentService = require('../payments/payments.service');

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
  },

  getOrdersOverview: async (req, res, next) => {
    try {
      const result = await adminService.getOrdersOverview(req.query);
      res.json({ success: true, data: result.orders, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  getPrescriptionQueue: async (req, res, next) => {
    try {
      const result = await adminService.getPrescriptionQueue(req.query);
      res.json({ success: true, data: result.queue, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  getRefundCenter: async (req, res, next) => {
    try {
      const result = await adminService.getRefundCenter(req.query);
      res.json({ success: true, data: result.refunds, summary: result.summary, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  processRefund: async (req, res, next) => {
    try {
      const { orderId, reason, amount } = req.body;
      const result = await paymentService.processRefund(orderId, req.user.id, req.user.role, { reason, amount });
      res.json({ success: true, data: result, message: 'Refund processed successfully' });
    } catch (error) {
      next(error);
    }
  },

  getDisputeCases: async (req, res, next) => {
    try {
      const result = await adminService.getDisputeCases(req.query);
      res.json({ success: true, data: result.disputes, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }
};
