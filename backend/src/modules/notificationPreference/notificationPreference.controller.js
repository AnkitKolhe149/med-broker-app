const service = require('./notificationPreference.service');

module.exports = {
  getPreferences: async (req, res, next) => {
    try {
      const prefs = await service.get(req.user.id);
      res.json({ success: true, data: prefs });
    } catch (err) { next(err); }
  },

  createOrUpdatePreferences: async (req, res, next) => {
    try {
      const prefs = await service.createOrUpdate(req.user.id, req.body);
      res.json({ success: true, data: prefs });
    } catch (err) { next(err); }
  }
};
