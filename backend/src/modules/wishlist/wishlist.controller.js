const wishlistService = require('./wishlist.service');

module.exports = {
  getFavorites: async (req, res, next) => {
    try {
      const items = await wishlistService.getFavorites(req.user.id);
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  },

  addFavorite: async (req, res, next) => {
    try {
      const item = await wishlistService.addFavorite(req.user.id, req.body.medicineId);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  removeFavorite: async (req, res, next) => {
    try {
      const item = await wishlistService.removeFavorite(req.user.id, req.params.id);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }
};
