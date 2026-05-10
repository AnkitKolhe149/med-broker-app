const express = require('express');
const shippingController = require('./shipping.controller');

const router = express.Router();

router.post('/quote', shippingController.quote);

module.exports = router;
