const express = require('express');
const router = express.Router();
const paymentController = require('./payments.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate payment for an order
 * @access  Private (Customer)
 */
router.post('/initiate', paymentController.initiatePayment);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment callback from gateway
 * @access  Private (can be called by payment gateway webhook or frontend)
 */
router.post('/verify', paymentController.verifyPayment);

/**
 * @route   GET /api/payments/:orderId
 * @desc    Get payment status for an order
 * @access  Private
 */
router.get('/:orderId', paymentController.getPaymentStatus);

/**
 * @route   POST /api/payments/refund
 * @desc    Process refund for an order
 * @access  Private (Admin only)
 */
router.post('/refund', restrictTo(['ADMIN']), paymentController.processRefund);

/**
 * @route   GET /api/payments
 * @desc    Get all payments (admin dashboard)
 * @access  Private (Admin only)
 */
router.get('/', restrictTo(['ADMIN']), paymentController.getAllPayments);

module.exports = router;
