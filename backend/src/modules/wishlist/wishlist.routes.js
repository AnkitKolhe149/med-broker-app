const express = require('express');
const wishlistController = require('./wishlist.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', wishlistController.getFavorites);
router.post('/', wishlistController.addFavorite);
router.delete('/:id', wishlistController.removeFavorite);

module.exports = router;
