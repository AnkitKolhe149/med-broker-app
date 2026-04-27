const service = require('./inventoryBatch.service');

module.exports = {
  createBatch: async (req, res, next) => {
    try {
      const item = await service.create(req.user.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  listForInventory: async (req, res, next) => {
    try {
      const items = await service.listForInventory(req.user.id, req.params.inventoryId);
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  },

  updateBatch: async (req, res, next) => {
    try {
      const item = await service.update(req.user.id, req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  },

  deleteBatch: async (req, res, next) => {
    try {
      const item = await service.remove(req.user.id, req.params.id);
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  }
};
