const express = require('express');
const onboardingController = require('./onboarding.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// All onboarding routes require authentication
router.use(authenticate);

router.post('/vendor', onboardingController.completeVendorOnboarding);
router.post('/customer', onboardingController.completeCustomerOnboarding);
router.get('/status', onboardingController.getStatus);

module.exports = router;
