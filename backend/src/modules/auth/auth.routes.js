const express = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authLimiter, registerLimiter } = require('../../middlewares/rateLimiter.middleware');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', registerLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/profile-status', authenticate, authController.getProfileStatus);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
