const express = require('express');
const vendorProfileController = require('./vendorProfile.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

const router = express.Router();

router.use(authenticate);
router.use(restrictTo(['VENDOR', 'ADMIN']));

router.get('/profile', vendorProfileController.getProfile);
router.patch('/profile', vendorProfileController.updateProfile);

module.exports = router;
