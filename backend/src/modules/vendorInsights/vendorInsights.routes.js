const express = require('express');
const vendorInsightsController = require('./vendorInsights.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authenticate);
router.use(restrictTo(['VENDOR', 'ADMIN']));

router.get('/dashboard', vendorInsightsController.getDashboard);
router.get('/analytics', vendorInsightsController.getAnalytics);
router.get('/orders', vendorInsightsController.getOrders);
router.get('/forecast', vendorInsightsController.getDemandForecast);

module.exports = router;
