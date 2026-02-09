const authService = require('./auth.service');

class AuthController {
  /**
   * POST /auth/register
   * Register a new user
   */
  async register(req, res, next) {
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
  }

  /**
   * POST /auth/login
   * Login user
   */
  async login(req, res, next) {
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
  }

  /**
   * GET /auth/profile-status
   * Get user profile status
   */
  async getProfileStatus(req, res, next) {
    try {
      const result = await authService.getProfileStatus(req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   * Get current user
   */
  async getCurrentUser(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
