const express = require('express');
const controller = require('./inventoryBatch.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

const router = express.Router();
router.use(authenticate);

// Vendor-only batch operations
router.post('/', restrictTo(['VENDOR','ADMIN']), controller.createBatch);
router.get('/inventory/:inventoryId', restrictTo(['VENDOR','ADMIN']), controller.listForInventory);
router.patch('/:id', restrictTo(['VENDOR','ADMIN']), controller.updateBatch);
router.delete('/:id', restrictTo(['VENDOR','ADMIN']), controller.deleteBatch);

module.exports = router;
