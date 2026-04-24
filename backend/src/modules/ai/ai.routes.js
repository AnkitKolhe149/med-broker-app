const express = require('express');
const aiController = require('./ai.controller');
const { authenticateOptional } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/chat', authenticateOptional, aiController.chat);

module.exports = router;
