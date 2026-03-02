const onboardingService = require('./onboarding.service');

module.exports = {
  completeVendorOnboarding: async (req, res, next) => {
    try {
      const vendor = await onboardingService.completeVendorOnboarding(
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Vendor onboarding completed successfully. Your profile has been approved.',
        data: vendor
      });
    } catch (error) {
      next(error);
    }
  },

  completeCustomerOnboarding: async (req, res, next) => {
    try {
      const customer = await onboardingService.completeCustomerOnboarding(
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Customer onboarding completed successfully',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  },

  getStatus: async (req, res, next) => {
    try {
      const status = await onboardingService.getOnboardingStatus(req.user.id);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
};
