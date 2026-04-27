const express = require('express');
const controller = require('./notificationPreference.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', controller.getPreferences);
router.post('/', controller.createOrUpdatePreferences);

module.exports = router;
