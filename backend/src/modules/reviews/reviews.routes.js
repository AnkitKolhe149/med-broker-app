const express = require('express');
const controller = require('./reviews.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/medicine/:medicineId', controller.listForMedicine);
router.post('/', authenticate, controller.createReview);

module.exports = router;
