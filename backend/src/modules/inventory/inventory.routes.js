const express = require('express');
const inventoryController = require('./inventory.controller');
const { authenticate, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

// All inventory routes require authentication and VENDOR role
router.use(authenticate, requireRole('VENDOR'));

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items for the vendor
 * @access  Private (Vendor)
 */
router.get('/', inventoryController.getVendorInventory);

/**
 * @route   POST /api/inventory/medicines
 * @desc    Add medicine to vendor's inventory
 * @access  Private (Vendor)
 */
router.post('/medicines', inventoryController.addMedicineToInventory);

/**
 * @route   PATCH /api/inventory/:id
 * @desc    Update inventory item quantity
 * @access  Private (Vendor)
 */
router.patch('/:id', inventoryController.updateInventoryItem);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Remove medicine from vendor's inventory
 * @access  Private (Vendor)
 */
router.delete('/:id', inventoryController.deleteInventoryItem);

module.exports = router;
