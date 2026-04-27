const service = require('./address.service');

module.exports = {
  listAddresses: async (req, res, next) => {
    try {
      const items = await service.list(req.user.id);
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  },

  createAddress: async (req, res, next) => {
    try {
      const item = await service.create(req.user.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  getAddress: async (req, res, next) => {
    try {
      const item = await service.get(req.user.id, req.params.id);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  updateAddress: async (req, res, next) => {
    try {
      const item = await service.update(req.user.id, req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  deleteAddress: async (req, res, next) => {
    try {
      const item = await service.remove(req.user.id, req.params.id);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }
};
