const cartService = require('./cart.service');

module.exports = {
  getCart: async (req, res, next) => {
    try {
      const items = await cartService.getUserCart(req.user.id);
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  },

  addToCart: async (req, res, next) => {
    try {
      const item = await cartService.addItem(req.user.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  updateCartItem: async (req, res, next) => {
    try {
      const item = await cartService.updateItem(req.user.id, req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  removeCartItem: async (req, res, next) => {
    try {
      const item = await cartService.removeItem(req.user.id, req.params.id);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  clearCart: async (req, res, next) => {
    try {
      const result = await cartService.clearCart(req.user.id);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
};
