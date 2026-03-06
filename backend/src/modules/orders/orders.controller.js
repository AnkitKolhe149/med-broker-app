const orderService = require('./orders.service');

module.exports = {
  /**
   * POST /api/orders
   * Create a new order
   */
  createOrder: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const order = await orderService.createOrder(userId, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/orders
   * Get all orders for the authenticated user
   */
  getUserOrders: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { page, limit, status } = req.query;
      
      const options = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        status
      };

      const result = await orderService.getUserOrders(userId, options);
      
      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/orders/:id
   * Get order details by ID
   */
  getOrderById: async (req, res, next) => {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const order = await orderService.getOrderById(orderId, userId, userRole);
      
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/orders/:id/status
   * Update order status (vendors/admins only)
   */
  updateOrderStatus: async (req, res, next) => {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }
      
      const order = await orderService.updateOrderStatus(orderId, status, userId, userRole);
      
      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/orders/:id/cancel
   * Cancel an order (customers only)
   */
  cancelOrder: async (req, res, next) => {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const order = await orderService.cancelOrder(orderId, userId, userRole);
      
      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
};
