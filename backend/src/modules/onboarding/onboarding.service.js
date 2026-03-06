const { prisma } = require('../../database/prisma');
const { ValidationError, ConflictError, NotFoundError } = require('../../utils/errors');

// Helper function to validate GSTIN format
// Format: 22AAAAA0000A1Z5 (15 characters)
const isValidGSTIN = (gstin) => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
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

    const existingVendor = await prisma.vendor.findUnique({
      where: { userId }
    });

    if (existingVendor) {
      throw new ConflictError('Vendor profile already exists');
    }

    const duplicateGSTIN = await prisma.vendor.findUnique({
      where: { gstinNumber }
    });

    if (duplicateGSTIN) {
      throw new ConflictError('GSTIN number already registered');
    }

    const duplicateLicense = await prisma.vendor.findUnique({
      where: { drugLicenseNumber }
    });

    if (duplicateLicense) {
      throw new ConflictError('Drug license number already registered');
    }

    const vendor = await prisma.vendor.create({
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

    await prisma.user.update({
      where: { id: userId },
      data: { isProfileComplete: true }
    });

    return vendor;
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

    const existingCustomer = await prisma.customer.findUnique({
      where: { userId }
    });

    if (existingCustomer) {
      throw new ConflictError('Customer profile already exists');
    }

    if (buyerType === 'WHOLESALE' && !businessName) {
      throw new ValidationError('Business name is required for wholesale buyers');
    }

    const customer = await prisma.customer.create({
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

    await prisma.user.update({
      where: { id: userId },
      data: { isProfileComplete: true }
    });

    return customer;
  },

  getOnboardingStatus: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
