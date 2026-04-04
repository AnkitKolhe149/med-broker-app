const { prisma } = require('../../database/prisma');
const { ValidationError, ConflictError, NotFoundError } = require('../../utils/errors');

// Helper function to validate GSTIN format
// Format: 22AAAAA0000A1Z5 (15 characters)
const isValidGSTIN = (gstin) => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

const parseUniqueTarget = (error) => {
  if (!error || error.code !== 'P2002') {
    return [];
  }

  if (Array.isArray(error.meta?.target)) {
    return error.meta.target;
  }

  const message = String(error.message || '');
  return [message];
};

const toVendorConflictError = (error) => {
  const target = parseUniqueTarget(error).join(',');

  if (target.includes('userId')) {
    return new ConflictError('Vendor profile already exists');
  }

  if (target.includes('gstinNumber')) {
    return new ConflictError('GSTIN number already registered');
  }

  if (target.includes('drugLicenseNumber')) {
    return new ConflictError('Drug license number already registered');
  }

  return new ConflictError('Vendor profile could not be created due to duplicate data');
};

const toCustomerConflictError = (error) => {
  const target = parseUniqueTarget(error).join(',');

  if (target.includes('userId')) {
    return new ConflictError('Customer profile already exists');
  }

  return new ConflictError('Customer profile could not be created due to duplicate data');
};

// Public API
module.exports = {
  completeVendorOnboarding: async (userId, data) => {
    const {
      companyName,
      vendorType,
      country,
      state,
      gstinNumber,
      drugLicenseNumber,
      businessAddress,
      bankAccountDetails,
      contactPersonName,
      contactNumber
    } = data;

    // Validate required fields
    if (!companyName || !vendorType || !country || !state || !gstinNumber || 
        !drugLicenseNumber || !businessAddress || !contactPersonName || !contactNumber) {
      throw new ValidationError('All required fields must be provided');
    }

    // Validate GSTIN format
    if (!isValidGSTIN(gstinNumber)) {
      throw new ValidationError('Invalid GSTIN format. Must be 15 characters (e.g., 22AAAAA0000A1Z5)');
    }

    // Validate vendor type
    const validVendorTypes = ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY'];
    if (!validVendorTypes.includes(vendorType)) {
      throw new ValidationError('Vendor type must be MANUFACTURER, DISTRIBUTOR, or PHARMACY');
    }

    // Validate contact number
    if (!/^\d{10}$/.test(contactNumber)) {
      throw new ValidationError('Contact number must be exactly 10 digits');
    }

    try {
      const vendor = await prisma.$transaction(async (tx) => {
        const createdVendor = await tx.vendor.create({
          data: {
            userId,
            companyName,
            vendorType,
            country,
            state,
            gstinNumber,
            drugLicenseNumber,
            businessAddress,
            bankAccountDetails: bankAccountDetails || {},
            contactPersonName,
            contactNumber,
            verificationStatus: 'VERIFIED'
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: { isProfileComplete: true }
        });

        return createdVendor;
      });

      return vendor;
    } catch (error) {
      if (error.code === 'P2002') {
        throw toVendorConflictError(error);
      }

      throw error;
    }
  },

  completeCustomerOnboarding: async (userId, data) => {
    const {
      fullName,
      buyerType,
      businessName,
      gstin,
      country,
      city,
      deliveryAddress,
      contactNumber
    } = data;

    // Validate required fields
    if (!fullName || !buyerType || !country || !city || !deliveryAddress || !contactNumber) {
      throw new ValidationError('All required fields must be provided');
    }

    // Validate buyer type
    const validBuyerTypes = ['RETAIL', 'WHOLESALE'];
    if (!validBuyerTypes.includes(buyerType)) {
      throw new ValidationError('Buyer type must be RETAIL or WHOLESALE');
    }

    // Validate GSTIN if provided (required for WHOLESALE)
    if (gstin && !isValidGSTIN(gstin)) {
      throw new ValidationError('Invalid GSTIN format. Must be 15 characters (e.g., 22AAAAA0000A1Z5)');
    }

    // WHOLESALE buyers must provide business name and GSTIN
    if (buyerType === 'WHOLESALE' && (!businessName || !gstin)) {
      throw new ValidationError('Business name and GSTIN are required for wholesale buyers');
    }

    // Validate contact number
    if (!/^\d{10}$/.test(contactNumber)) {
      throw new ValidationError('Contact number must be exactly 10 digits');
    }

    try {
      const customer = await prisma.$transaction(async (tx) => {
        const createdCustomer = await tx.customer.create({
          data: {
            userId,
            fullName,
            buyerType,
            businessName,
            gstin,
            country,
            city,
            deliveryAddress,
            contactNumber
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: { isProfileComplete: true }
        });

        return createdCustomer;
      });

      return customer;
    } catch (error) {
      if (error.code === 'P2002') {
        throw toCustomerConflictError(error);
      }

      throw error;
    }
  },

  getOnboardingStatus: async (userContext) => {
    const isLoadedUser = typeof userContext === 'object' && userContext !== null;
    const user = isLoadedUser
      ? userContext
      : await prisma.user.findUnique({
        where: { id: userContext },
        include: {
          vendor: true,
          customer: true
        }
      });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      hasVendorProfile: !!user.vendor,
      hasCustomerProfile: !!user.customer,
      vendorVerificationStatus: user.vendor?.verificationStatus || null
    };
  }
};
