const express = require('express');
const controller = require('./address.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', controller.listAddresses);
router.post('/', controller.createAddress);
router.get('/:id', controller.getAddress);
router.patch('/:id', controller.updateAddress);
router.delete('/:id', controller.deleteAddress);

module.exports = router;
