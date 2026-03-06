const paymentService = require('./payments.service');

module.exports = {
  /**
   * POST /api/payments/initiate
   * Initiate payment for an order
   */
  initiatePayment: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { orderId, provider, returnUrl } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      const paymentData = await paymentService.initiatePayment(
        orderId,
        userId,
        { provider, returnUrl }
      );

      res.status(201).json({
        success: true,
        message: 'Payment initiated successfully',
        data: paymentData
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/payments/verify
   * Verify payment callback from gateway
   */
  verifyPayment: async (req, res, next) => {
    try {
      const { paymentId, signature, orderId, status } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      const result = await paymentService.verifyPayment(paymentId, {
        signature,
        orderId,
        status
      });

      res.status(200).json({
        success: result.success,
        message: result.message,
        data: {
          payment: result.payment,
          order: result.order
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/payments/:orderId
   * Get payment status for an order
   */
  getPaymentStatus: async (req, res, next) => {
    try {
      const orderId = req.params.orderId;
      const userId = req.user.id;
      const userRole = req.user.role;

      const payment = await paymentService.getPaymentStatus(orderId, userId, userRole);

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/payments/refund
   * Process refund for an order
   */
  processRefund: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { orderId, reason, amount } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      const result = await paymentService.processRefund(
        orderId,
        userId,
        userRole,
        { reason, amount }
      );

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/payments
   * Get all payments (admin only)
   */
  getAllPayments: async (req, res, next) => {
    try {
      const { page, limit, status, provider } = req.query;

      const filters = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        status,
        provider
      };

      const result = await paymentService.getAllPayments(filters);

      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
};
