const express = require('express');
const controller = require('./shipments.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

const router = express.Router();
router.use(authenticate);

// create/update shipments: vendor or admin
router.post('/', restrictTo(['VENDOR','ADMIN']), controller.createShipment);
router.patch('/:id', restrictTo(['VENDOR','ADMIN']), controller.updateShipment);

// customers/admin/vendors can view shipment for an order
router.get('/order/:orderId', controller.getShipmentByOrder);

module.exports = router;
