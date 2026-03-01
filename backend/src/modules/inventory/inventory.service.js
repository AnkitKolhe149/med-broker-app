const { prisma } = require('../../database/prisma');
const {
  ValidationError,
  NotFoundError,
  ForbiddenError
} = require('../../utils/errors');

class InventoryService {
  async addMedicineToVendorInventory(userId, data) {
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
}

module.exports = new InventoryService();
