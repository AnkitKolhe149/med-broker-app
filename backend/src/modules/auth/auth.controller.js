const authService = require('./auth.service');

module.exports = {
  register: async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  getProfileStatus: async (req, res, next) => {
    try {
      const result = await authService.getProfileStatus(req.user);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  getCurrentUser: async (req, res, next) => {
    try {
      res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const result = await authService.changePassword(req.user, req.body);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
 ,
  updateProfile: async (req, res, next) => {
    try {
      const result = await authService.updateProfile(req.user.id, req.body);
      // return refreshed user data
      const updated = await authService.getCurrentUser ? undefined : undefined; // noop placeholder
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
};
