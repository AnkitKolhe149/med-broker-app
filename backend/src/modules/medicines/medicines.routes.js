const express = require('express');
const medicinesController = require('./medicines.controller');
const { authenticateOptional } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticateOptional, medicinesController.getMedicines);
router.get('/:id', authenticateOptional, medicinesController.getMedicineById);

module.exports = router;
