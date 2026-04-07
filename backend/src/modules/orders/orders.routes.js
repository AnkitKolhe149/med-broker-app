const express = require('express');
const router = express.Router();
const orderController = require('./orders.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { medicineImageUpload } = require('../../middlewares/upload.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Customer)
 */
router.post('/', orderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for authenticated user
 * @access  Private
 */
router.get('/', orderController.getUserOrders);

/**
 * @route   POST /api/orders/prescription/upload
 * @desc    Upload a prescription image to Cloudinary
 * @access  Private
 */
router.post('/prescription/upload', medicineImageUpload.single('prescription'), orderController.uploadPrescription);

/**
 * @route   GET /api/orders/:id/receipt
 * @desc    Download order receipt PDF
 * @access  Private
 */
router.get('/:id/receipt', orderController.downloadReceipt);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by ID
 * @access  Private
 */
router.get('/:id', orderController.getOrderById);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Vendor, Admin)
 */
router.patch('/:id/status', restrictTo(['VENDOR', 'ADMIN']), orderController.updateOrderStatus);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private (Customer, Admin)
 */
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;
