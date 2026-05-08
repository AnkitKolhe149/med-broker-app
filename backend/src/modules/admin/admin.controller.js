const adminService = require('./admin.service');
const paymentService = require('../payments/payments.service');
const trainingDataService = require('./trainingData.service');

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
      res.json({ success: true, data: overview.data, totalPlatformFeeCents: overview.totalPlatformFeeCents, globalRatePercent: overview.globalRatePercent });
    } catch (error) {
      next(error);
    }
  },

  getPayoutRequests: async (req, res, next) => {
    try {
      const result = await adminService.getPayoutRequests(req.query);
      res.json({ success: true, data: result.requests, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  processPayout: async (req, res, next) => {
    try {
      const { vendorId } = req.params;
      const { amountCents, payoutRequestId } = req.body;
      const payout = await adminService.processPayout(vendorId, amountCents, { payoutRequestId });
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
  },

  getUsersOverview: async (req, res, next) => {
    try {
      const result = await adminService.getUsersOverview(req.query);
      res.json({ success: true, data: result.users, summary: result.summary, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  getVendorsOverview: async (req, res, next) => {
    try {
      const result = await adminService.getVendorsOverview(req.query);
      res.json({ success: true, data: result.vendors, summary: result.summary, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  getCatalogOverview: async (req, res, next) => {
    try {
      const result = await adminService.getCatalogOverview(req.query);
      res.json({ success: true, data: result.medicines, summary: result.summary, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  getInventoryOverview: async (req, res, next) => {
    try {
      const result = await adminService.getInventoryOverview(req.query);
      res.json({ success: true, data: result.items, summary: result.summary, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  getSupportTicketsOverview: async (req, res, next) => {
    try {
      const result = await adminService.getSupportTicketsOverview(req.query);
      res.json({ success: true, data: result.tickets, summary: result.summary, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  getComplianceOverview: async (req, res, next) => {
    try {
      const result = await adminService.getComplianceOverview(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getReportsOverview: async (req, res, next) => {
    try {
      const result = await adminService.getReportsOverview(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getNotificationsOverview: async (req, res, next) => {
    try {
      const result = await adminService.getNotificationsOverview(req.query);
      res.json({ success: true, data: result.notifications, summary: result.summary, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  getIntegrationsOverview: async (req, res, next) => {
    try {
      const result = await adminService.getIntegrationsOverview();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getSettingsOverview: async (req, res, next) => {
    try {
      const result = await adminService.getSettingsOverview();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  updateSettings: async (req, res, next) => {
    try {
      const result = await adminService.updateSettings(req.body);
      res.json({ success: true, message: 'Settings updated successfully', count: result.length });
    } catch (error) {
      next(error);
    }
  },

  toggleIntegration: async (req, res, next) => {
    try {
      const { key } = req.params;
      const { isEnabled } = req.body;
      const result = await adminService.toggleIntegration(key, isEnabled);
      res.json({ success: true, message: `Integration ${key} toggled successfully`, data: result });
    } catch (error) {
      next(error);
    }
  },

  exportDemandTrainingData: async (req, res, next) => {
    try {
      const monthsBack = parseInt(req.query.months) || 12;
      const data = await trainingDataService.exportDemandTrainingData(monthsBack);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  // Wave 1
  updatePrescriptionStatus: async (req, res, next) => {
    try {
      const { status, rejectionReason } = req.body;
      const result = await adminService.updatePrescriptionStatus(req.params.id, status, req.user.id, rejectionReason);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  verifyKycDocument: async (req, res, next) => {
    try {
      const { status, rejectedReason } = req.body;
      const result = await adminService.verifyKycDocument(req.params.id, status, req.user.id, rejectedReason);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  updateDisputeCase: async (req, res, next) => {
    try {
      const updateData = { ...req.body };
      if (req.body.resolutionNotes) {
        updateData.resolution = req.body.resolutionNotes;
        delete updateData.resolutionNotes;
      }
      const result = await adminService.updateDisputeCase(req.params.id, updateData, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  replyToSupportTicket: async (req, res, next) => {
    try {
      const { message, isInternal } = req.body;
      const result = await adminService.replyToSupportTicket(req.params.id, message, req.user.id, isInternal);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  updateSupportTicketStatus: async (req, res, next) => {
    try {
      const result = await adminService.updateSupportTicketStatus(req.params.id, req.body.status);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // Wave 2
  updateUserStatus: async (req, res, next) => {
    try {
      const result = await adminService.updateUserStatus(req.params.id, req.body.isActive);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  updateUserModeration: async (req, res, next) => {
    try {
      const { isBanned, moderationNote } = req.body;
      if (req.user.id === req.params.id) {
        return res.status(403).json({ success: false, message: 'Admins cannot ban themselves' });
      }
      const result = await adminService.updateUserModeration(req.params.id, isBanned, moderationNote, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  updateUserRole: async (req, res, next) => {
    try {
      const { role } = req.body;
      const allowedRoles = ['ADMIN', 'VENDOR', 'CUSTOMER'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role provided' });
      }
      const result = await adminService.updateUserRole(req.params.id, role, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  getAdminAccounts: async (req, res, next) => {
    try {
      const result = await adminService.getAdminAccounts();
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  updateMedicineStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const result = await adminService.updateMedicineStatus(req.params.id, status, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  adminOverrideMedicine: async (req, res, next) => {
    try {
      const result = await adminService.adminOverrideMedicine(req.params.id, req.body, req.user.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  forceDeleteMedicine: async (req, res, next) => {
    try {
      const result = await adminService.forceDeleteMedicine(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  createCoupon: async (req, res, next) => {
    try {
      const result = await adminService.createCoupon(req.body);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  getCoupons: async (req, res, next) => {
    try {
      const result = await adminService.getCoupons();
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  deleteCoupon: async (req, res, next) => {
    try {
      const result = await adminService.deleteCoupon(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  updateReturnRequestStatus: async (req, res, next) => {
    try {
      const result = await adminService.updateReturnRequestStatus(req.params.id, req.body.status, req.user.id, req.body.notes);

      if (req.body.status === 'APPROVED' && result.orderId) {
        try {
          await paymentService.processRefund(result.orderId, req.user.id, req.user.role, { reason: 'Return Request Approved' });
        } catch (refundError) {
          console.error("Refund processing failed:", refundError);
        }
      }

      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // Wave 3
  broadcastNotification: async (req, res, next) => {
    try {
      const result = await adminService.broadcastNotification(req.body);
      res.json({ success: true, message: `Broadcast sent to ${result.count} users`, data: result });
    } catch (error) { next(error); }
  },

  adjustInventoryStock: async (req, res, next) => {
    try {
      const result = await adminService.adjustInventoryStock(req.params.id, req.body.delta, req.body.note);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  markNotificationRead: async (req, res, next) => {
    try {
      const result = await adminService.markNotificationRead(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  markAllNotificationsRead: async (req, res, next) => {
    try {
      const result = await adminService.markAllNotificationsRead();
      res.json({ success: true, count: result.count });
    } catch (error) { next(error); }
  },

  clearAllNotifications: async (req, res, next) => {
    try {
      const result = await adminService.clearAllNotifications();
      res.json({ success: true, count: result.count });
    } catch (error) { next(error); }
  },

  // ✅ Create new admin user (admin-only operation)
  createAdminUser: async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      const newAdmin = await adminService.createAdminUser({ email, password, name });
      res.status(201).json({ 
        success: true, 
        message: 'Admin user created successfully',
        data: newAdmin 
      });
    } catch (error) {
      next(error);
    }
  }
};
