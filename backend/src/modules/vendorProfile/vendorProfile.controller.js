const vendorProfileService = require('./vendorProfile.service');

module.exports = {
  getProfile: async (req, res, next) => {
    try {
      const data = await vendorProfileService.getVendorProfile(req.user);

      return res.json({
        success: true,
        data
      });
    } catch (error) {
      return next(error);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const data = await vendorProfileService.updateVendorProfile(req.user, req.body);

      return res.json({
        success: true,
        message: 'Vendor profile updated successfully',
        data
      });
    } catch (error) {
      return next(error);
    }
  },

  requestWithdrawal: async (req, res, next) => {
    try {
      const data = await vendorProfileService.requestWithdrawal(req.user, req.body);

      return res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data
      });
    } catch (error) {
      return next(error);
    }
  },

  getWithdrawalHistory: async (req, res, next) => {
    try {
      const data = await vendorProfileService.getWithdrawalHistory(req.user, req.query);

      return res.json({
        success: true,
        data: data.requests,
        pagination: data.pagination
      });
    } catch (error) {
      return next(error);
    }
  }
};
