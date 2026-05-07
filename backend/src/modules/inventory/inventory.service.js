const { prisma } = require('../../database/prisma');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError
} = require('../../utils/errors');
const { uploadMedicineImage } = require('../../services/cloudinary.service');
const { validatePricingLogic } = require('../orders/orderPricing.util');

const MAX_MEDICINE_IMAGES = 4;

const normalizeImageUrls = (inventoryItem = {}) => {
  const urls = [];

  if (inventoryItem.imageUrl) {
    urls.push(inventoryItem.imageUrl);
  }

  if (Array.isArray(inventoryItem.imageUrls)) {
    urls.push(...inventoryItem.imageUrls);
  }

  return [...new Set(urls.filter(Boolean))].slice(0, MAX_MEDICINE_IMAGES);
};

const resolveVendorContext = async (userContext) => {
  const userId = typeof userContext === 'string' ? userContext : userContext?.id;
  const userVendor = typeof userContext === 'object' ? userContext?.vendor : null;

  if (userVendor?.id) {
    return {
      id: userVendor.id,
      verificationStatus: userVendor.verificationStatus || null
    };
  }

  if (!userId) {
    throw new NotFoundError('User context is missing.');
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

  return vendor;
};

module.exports = {
  /**
   * Get all inventory items for a vendor
   */
  getVendorInventory: async (userContext, options = {}) => {
    const { page = 1, limit = 20, search } = options;
    const skip = (page - 1) * limit;

    const vendor = await resolveVendorContext(userContext);

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
   * Update inventory item (quantity and optionally medicine details)
   */
  updateInventoryItem: async (userContext, inventoryId, updateData) => {
    const { quantity, name, description, priceCents, wholesalePriceCents } = updateData;

    // Validate quantity
    if (quantity !== undefined) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new ValidationError('Quantity must be a non-negative integer');
      }
    }

    const vendor = await resolveVendorContext(userContext);

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

    const isUpdatingMedicine = name || description || priceCents !== undefined || wholesalePriceCents !== undefined;

    if (isUpdatingMedicine) {
      const updatedPriceCents = priceCents !== undefined ? priceCents : inventoryItem.medicine.priceCents;
      const updatedWholesaleCents = wholesalePriceCents !== undefined ? wholesalePriceCents : inventoryItem.medicine.wholesalePriceCents;

      try {
        validatePricingLogic({
          priceCents: updatedPriceCents,
          wholesalePriceCents: updatedWholesaleCents
        });
      } catch (error) {
        throw new ValidationError('Pricing validation failed. ' + error.message);
      }
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      if (isUpdatingMedicine) {
        await tx.medicine.update({
          where: { id: inventoryItem.medicine.id },
          data: {
            name: name !== undefined ? name.trim() : undefined,
            description: description !== undefined ? description?.trim() : undefined,
            priceCents: priceCents !== undefined ? priceCents : undefined,
            wholesalePriceCents: wholesalePriceCents !== undefined ? wholesalePriceCents : undefined
          }
        });
      }

      return tx.inventory.update({
        where: { id: inventoryId },
        data: {
          quantity: quantity !== undefined ? quantity : inventoryItem.quantity
        },
        include: {
          medicine: true
        }
      });
    });

    return updatedItem;
  },

  /**
   * Upload medicine images for a vendor-owned inventory item
   */
  uploadInventoryMedicineImage: async (userContext, inventoryId, files) => {
    if (!Array.isArray(files) || files.length === 0) {
      throw new ValidationError('At least one medicine image is required');
    }

    const vendor = await resolveVendorContext(userContext);

    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        id: true,
        vendorId: true,
        medicineId: true,
        imageUrl: true,
        imageUrls: true
      }
    });

    if (!inventoryItem) {
      throw new NotFoundError('Inventory item not found');
    }

    if (inventoryItem.vendorId !== vendor.id) {
      throw new ForbiddenError('You can only upload images for your own inventory items');
    }

    const existingImageUrls = normalizeImageUrls(inventoryItem);
    const availableSlots = MAX_MEDICINE_IMAGES - existingImageUrls.length;

    if (availableSlots <= 0) {
      throw new ValidationError('This medicine already has the maximum of 4 images');
    }

    if (files.length > availableSlots) {
      throw new ValidationError(`You can upload up to ${availableSlots} more image(s) for this medicine`);
    }

    const uploadedImageUrls = await Promise.all(
      files.map((file) => {
        if (!file || !file.buffer || !file.mimetype) {
          throw new ValidationError('Each medicine image must be a valid image file');
        }

        return uploadMedicineImage(file.buffer, file.mimetype, inventoryItem.id);
      })
    );

    const imageUrls = normalizeImageUrls({
      imageUrl: existingImageUrls[0] || null,
      imageUrls: [...existingImageUrls.slice(1), ...uploadedImageUrls]
    });

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventoryItem.id },
      data: {
        imageUrl: imageUrls[0] || null,
        imageUrls
      },
      include: {
        medicine: true
      }
    });

    return {
      inventoryId: updatedInventory.id,
      medicineId: updatedInventory.medicineId,
      imageUrl: updatedInventory.imageUrl,
      imageUrls: updatedInventory.imageUrls || []
    };
  },

  /**
   * Delete a specific image from an inventory item
   */
  deleteInventoryMedicineImage: async (userContext, inventoryId, imageUrl) => {
    if (!imageUrl) {
      throw new ValidationError('Image URL is required for deletion');
    }

    const vendor = await resolveVendorContext(userContext);

    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        id: true,
        vendorId: true,
        imageUrl: true,
        imageUrls: true
      }
    });

    if (!inventoryItem) {
      throw new NotFoundError('Inventory item not found');
    }

    if (inventoryItem.vendorId !== vendor.id) {
      throw new ForbiddenError('You can only delete images from your own inventory items');
    }

    const currentUrls = Array.isArray(inventoryItem.imageUrls) ? inventoryItem.imageUrls : (inventoryItem.imageUrl ? [inventoryItem.imageUrl] : []);
    const updatedUrls = currentUrls.filter(url => url !== imageUrl);

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        imageUrl: updatedUrls[0] || null,
        imageUrls: updatedUrls
      }
    });

    return {
      inventoryId: updatedInventory.id,
      imageUrl: updatedInventory.imageUrl,
      imageUrls: updatedInventory.imageUrls || []
    };
  },

  /**
   * Delete inventory item (remove medicine from vendor's inventory)
   */
  deleteInventoryItem: async (userContext, inventoryId) => {
    const vendor = await resolveVendorContext(userContext);

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

  addMedicineToVendorInventory: async (userContext, data) => {
    const {
      medicineId,
      name,
      description,
      priceCents,
      quantity,
      wholesalePriceCents
    } = data;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('Quantity must be a positive integer');
    }

    const vendor = await resolveVendorContext(userContext);

    // Use specific provided values, or keep existing ones if updating, or default to retail price only if creating new
    const normalizedWholesalePriceCents = Number.isInteger(wholesalePriceCents)
      ? wholesalePriceCents
      : (medicineId ? undefined : (Number.isInteger(priceCents) ? priceCents : null));

    if (normalizedWholesalePriceCents !== null && normalizedWholesalePriceCents <= 0) {
      throw new ValidationError('wholesalePriceCents must be a positive integer');
    }

    // Validate that prices follow the three-tier logic: Retail ≥ B2B Standard ≥ B2B Bulk
    // This ensures the pricing tier system makes economic sense
    const medicineToValidate = {
      priceCents,
      wholesalePriceCents: normalizedWholesalePriceCents
    };
    try {
      validatePricingLogic(medicineToValidate);
    } catch (error) {
      throw new ValidationError('Pricing validation failed. ' + error.message);
    }

    // Note: In development, we allow PENDING vendors to add medicines to enable faster testing.
    // In a strict production environment, this could be toggled by an environment variable.
    if (vendor.verificationStatus === 'REJECTED') {
      throw new ForbiddenError('Your vendor profile has been rejected. Please contact support.');
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

        medicine = await tx.medicine.update({
          where: { id: medicine.id },
          data: {
            wholesalePriceCents: normalizedWholesalePriceCents ?? medicine.wholesalePriceCents
          }
        });
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
            priceCents,
            wholesalePriceCents: normalizedWholesalePriceCents
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
