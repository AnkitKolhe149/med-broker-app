const express = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));
router.get('/profile-status', authenticate, authController.getProfileStatus.bind(authController));

module.exports = router;
