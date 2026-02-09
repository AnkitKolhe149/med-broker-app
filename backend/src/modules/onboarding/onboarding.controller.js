const onboardingService = require('./onboarding.service');

class OnboardingController {
  /**
   * POST /onboarding/vendor
   * Complete vendor onboarding
   */
  async completeVendorOnboarding(req, res, next) {
    try {
      const vendor = await onboardingService.completeVendorOnboarding(
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Vendor onboarding completed successfully. Your profile is under verification.',
        data: vendor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /onboarding/customer
   * Complete customer onboarding
   */
  async completeCustomerOnboarding(req, res, next) {
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
  }

  /**
   * GET /onboarding/status
   * Get onboarding status
   */
  async getStatus(req, res, next) {
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
}

module.exports = new OnboardingController();
