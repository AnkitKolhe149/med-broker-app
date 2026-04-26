const inventoryService = require('./inventory.service');

module.exports = {
  /**
   * GET /api/inventory
   * Get all inventory items for the vendor
   */
  getVendorInventory: async (req, res, next) => {
    try {
      const { page, limit, search } = req.query;
      
      const options = {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        search
      };

      const result = await inventoryService.getVendorInventory(req.user, options);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/inventory/medicines
   * Add medicine to vendor's inventory
   */
  addMedicineToInventory: async (req, res, next) => {
    try {
      const result = await inventoryService.addMedicineToVendorInventory(req.user, req.body);

      res.status(201).json({
        success: true,
        message: result.medicineCreated
          ? 'Medicine created and added to inventory successfully'
          : 'Medicine inventory updated successfully',
        data: result.inventory
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/inventory/:id/image
   * Upload medicine images for an inventory item
   */
  uploadInventoryMedicineImage: async (req, res, next) => {
    try {
      const inventoryId = req.params.id;
      const result = await inventoryService.uploadInventoryMedicineImage(
        req.user,
        inventoryId,
        req.files || (req.file ? [req.file] : [])
      );

      res.status(200).json({
        success: true,
        message: 'Medicine images uploaded successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/inventory/:id/image
   * Delete a specific medicine image
   */
  deleteInventoryMedicineImage: async (req, res, next) => {
    try {
      const inventoryId = req.params.id;
      const { imageUrl } = req.body;
      const result = await inventoryService.deleteInventoryMedicineImage(
        req.user,
        inventoryId,
        imageUrl
      );

      res.status(200).json({
        success: true,
        message: 'Medicine image deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/inventory/:id
   * Update inventory item (quantity)
   */
  updateInventoryItem: async (req, res, next) => {
    try {
      const inventoryId = req.params.id;
      const updatedItem = await inventoryService.updateInventoryItem(
        req.user,
        inventoryId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Inventory item updated successfully',
        data: updatedItem
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/inventory/:id
   * Remove medicine from vendor's inventory
   */
  deleteInventoryItem: async (req, res, next) => {
    try {
      const inventoryId = req.params.id;
      const result = await inventoryService.deleteInventoryItem(req.user, inventoryId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
};
