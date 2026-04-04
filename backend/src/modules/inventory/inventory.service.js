const { prisma } = require('../../database/prisma');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError
} = require('../../utils/errors');
const { uploadMedicineImage } = require('../../services/cloudinary.service');

module.exports = {
  /**
   * Get all inventory items for a vendor
   */
  getVendorInventory: async (userId, options = {}) => {
    const { page = 1, limit = 20, search } = options;
    const skip = (page - 1) * limit;

    // Get vendor ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found. Please complete onboarding first.');
    }

    // Build where clause
    const where = { vendorId: vendor.id };
    if (search) {
      where.medicine = {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }

    // Fetch inventory with pagination
    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          medicine: true
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.inventory.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Update inventory item (quantity only for now)
   */
  updateInventoryItem: async (userId, inventoryId, updateData) => {
    const { quantity } = updateData;

    // Validate quantity
    if (quantity !== undefined) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new ValidationError('Quantity must be a non-negative integer');
      }
    }

    // Get vendor ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found.');
    }

    // Check if inventory item exists and belongs to vendor
    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        medicine: true
      }
    });

    if (!inventoryItem) {
      throw new NotFoundError('Inventory item not found');
    }

    if (inventoryItem.vendorId !== vendor.id) {
      throw new ForbiddenError('You can only update your own inventory items');
    }

    // Update inventory
    const updatedItem = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        quantity: quantity !== undefined ? quantity : inventoryItem.quantity
      },
      include: {
        medicine: true
      }
    });

    return updatedItem;
  },

  /**
   * Upload or replace image for a vendor-owned inventory item
   */
  uploadInventoryMedicineImage: async (userId, inventoryId, file) => {
    if (!file || !file.buffer || !file.mimetype) {
      throw new ValidationError('Medicine image is required');
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found.');
    }

    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        id: true,
        vendorId: true,
        medicineId: true
      }
    });

    if (!inventoryItem) {
      throw new NotFoundError('Inventory item not found');
    }

    if (inventoryItem.vendorId !== vendor.id) {
      throw new ForbiddenError('You can only upload images for your own inventory items');
    }

    const imageUrl = await uploadMedicineImage(file.buffer, file.mimetype, inventoryItem.id);

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventoryItem.id },
      data: { imageUrl },
      include: {
        medicine: true
      }
    });

    return {
      inventoryId: updatedInventory.id,
      medicineId: updatedInventory.medicineId,
      imageUrl: updatedInventory.imageUrl
    };
  },

  /**
   * Delete inventory item (remove medicine from vendor's inventory)
   */
  deleteInventoryItem: async (userId, inventoryId) => {
    // Get vendor ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found.');
    }

    // Check if inventory item exists and belongs to vendor
    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: inventoryId }
    });

    if (!inventoryItem) {
      throw new NotFoundError('Inventory item not found');
    }

    if (inventoryItem.vendorId !== vendor.id) {
      throw new ForbiddenError('You can only delete your own inventory items');
    }

    // Delete inventory item
    await prisma.inventory.delete({
      where: { id: inventoryId }
    });

    return {
      success: true,
      message: 'Inventory item deleted successfully'
    };
  },

  addMedicineToVendorInventory: async (userId, data) => {
    const {
      medicineId,
      name,
      description,
      priceCents,
      quantity
    } = data;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('Quantity must be a positive integer');
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: {
        id: true,
        verificationStatus: true
      }
    });

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found. Please complete onboarding first.');
    }

    if (vendor.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenError('Vendor must be verified before adding medicines to inventory.');
    }

    const result = await prisma.$transaction(async (tx) => {
      let medicine;
      let medicineCreated = false;

      if (medicineId) {
        medicine = await tx.medicine.findUnique({
          where: { id: medicineId }
        });

        if (!medicine) {
          throw new NotFoundError('Medicine not found');
        }
      } else {
        if (!name || typeof name !== 'string' || !name.trim()) {
          throw new ValidationError('Medicine name is required when medicineId is not provided');
        }

        if (!Number.isInteger(priceCents) || priceCents <= 0) {
          throw new ValidationError('priceCents must be a positive integer when creating a medicine');
        }

        medicine = await tx.medicine.create({
          data: {
            name: name.trim(),
            description: description || null,
            priceCents
          }
        });

        medicineCreated = true;
      }

      const inventory = await tx.inventory.upsert({
        where: {
          medicineId_vendorId: {
            medicineId: medicine.id,
            vendorId: vendor.id
          }
        },
        update: {
          quantity: {
            increment: quantity
          }
        },
        create: {
          medicineId: medicine.id,
          vendorId: vendor.id,
          quantity
        },
        include: {
          medicine: true
        }
      });

      return {
        medicineCreated,
        inventory
      };
    });

    return result;
  }
};
