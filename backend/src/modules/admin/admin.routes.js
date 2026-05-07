const express = require('express');
const adminController = require('./admin.controller');
const { authenticate, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Apply auth middleware to protect all admin routes
// Only users with role 'ADMIN' can access these routes
router.use(authenticate, requireRole('ADMIN'));

// Dashboard and Stats
router.get('/stats', adminController.getDashboardStats);

// Vendor Management
router.get('/vendors/pending', adminController.getPendingVendors);
router.patch('/vendors/:id/status', adminController.updateVendorStatus);

// Payouts & Finance
router.get('/payouts/overview', adminController.getPayoutOverview);
router.get('/payouts/requests', adminController.getPayoutRequests);
router.post('/payouts/:vendorId/process', adminController.processPayout);

// Operations
router.get('/orders', adminController.getOrdersOverview);
router.get('/prescriptions', adminController.getPrescriptionQueue);

// Refunds
router.get('/refunds', adminController.getRefundCenter);
router.post('/refunds/process', adminController.processRefund);

// Governance
router.get('/disputes', adminController.getDisputeCases);

// Module overviews for connected admin pages
router.get('/users', adminController.getUsersOverview);
router.get('/vendors', adminController.getVendorsOverview);
router.get('/catalog', adminController.getCatalogOverview);
router.get('/inventory', adminController.getInventoryOverview);
router.get('/support-tickets', adminController.getSupportTicketsOverview);
router.get('/compliance', adminController.getComplianceOverview);
router.get('/reports', adminController.getReportsOverview);
router.get('/notifications', adminController.getNotificationsOverview);
router.get('/integrations', adminController.getIntegrationsOverview);
router.patch('/integrations/:key', adminController.toggleIntegration);
router.get('/settings', adminController.getSettingsOverview);
router.patch('/settings', adminController.updateSettings);

// ML Training Data Export
router.get('/training-data/demand', adminController.exportDemandTrainingData);

// Wave 1: Actionable Mutations
router.patch('/prescriptions/:id/status', adminController.updatePrescriptionStatus);
router.patch('/compliance/:id/verify', adminController.verifyKycDocument);
router.patch('/disputes/:id', adminController.updateDisputeCase);
router.post('/support-tickets/:id/reply', adminController.replyToSupportTicket);
router.patch('/support-tickets/:id/status', adminController.updateSupportTicketStatus);

// Wave 2: New Administrative Features
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/moderation', adminController.updateUserModeration);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/admin/accounts', adminController.getAdminAccounts);
router.post('/users', adminController.createAdminUser);  // ✅ Create new admin user

router.patch('/catalog/:id/status', adminController.updateMedicineStatus);
router.patch('/catalog/:id/admin-override', adminController.adminOverrideMedicine);
router.delete('/catalog/:id/force', adminController.forceDeleteMedicine);
router.post('/coupons', adminController.createCoupon);
router.get('/coupons', adminController.getCoupons);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.patch('/return-requests/:id/status', adminController.updateReturnRequestStatus);

// Wave 3: Communication
router.post('/notifications/broadcast', adminController.broadcastNotification);
router.patch('/notifications/read-all', adminController.markAllNotificationsRead);
router.patch('/notifications/:id/read', adminController.markNotificationRead);
router.delete('/notifications/clear-all', adminController.clearAllNotifications);

// Inventory Mutations
router.patch('/inventory/:id/adjust', adminController.adjustInventoryStock);

module.exports = router;
