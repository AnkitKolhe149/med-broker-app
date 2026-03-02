const inventoryService = require('./inventory.service');

module.exports = {
  addMedicineToInventory: async (req, res, next) => {
    try {
      const result = await inventoryService.addMedicineToVendorInventory(req.user.id, req.body);

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
  }
};
