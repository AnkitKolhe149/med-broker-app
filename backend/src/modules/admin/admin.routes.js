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
router.get('/settings', adminController.getSettingsOverview);

module.exports = router;
