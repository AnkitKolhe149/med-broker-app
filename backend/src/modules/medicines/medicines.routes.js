const express = require('express');
const medicinesController = require('./medicines.controller');

const router = express.Router();

router.get('/', medicinesController.getMedicines);

module.exports = router;
