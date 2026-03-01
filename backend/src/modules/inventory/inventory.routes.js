const express = require('express');
const inventoryController = require('./inventory.controller');
const { authenticate, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, requireRole('VENDOR'));
router.post('/medicines', inventoryController.addMedicineToInventory.bind(inventoryController));

module.exports = router;
