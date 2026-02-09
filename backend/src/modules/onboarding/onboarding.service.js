const { PrismaClient } = require('@prisma/client');
const { ValidationError, ConflictError, NotFoundError } = require('../../utils/errors');

const prisma = new PrismaClient();

class OnboardingService {
  /**
   * Complete vendor onboarding
   */
  async completeVendorOnboarding(userId, data) {
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

    // Validate GSTIN format (basic validation)
    if (!this.isValidGSTIN(gstinNumber)) {
      throw new ValidationError('Invalid GSTIN format');
    }

    // Check if vendor profile already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId }
    });

    if (existingVendor) {
      throw new ConflictError('Vendor profile already exists');
    }

    // Check for duplicate GSTIN or License
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

    // Create vendor profile
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
        verificationStatus: 'PENDING'
      }
    });

    // Update user profile completion status
    await prisma.user.update({
      where: { id: userId },
      data: { isProfileComplete: true }
    });

    return vendor;
  }

  /**
   * Complete customer onboarding
   */
  async completeCustomerOnboarding(userId, data) {
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

    // Validate GSTIN if provided (for wholesale buyers)
    if (gstin && !this.isValidGSTIN(gstin)) {
      throw new ValidationError('Invalid GSTIN format');
    }

    // Check if customer profile already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { userId }
    });

    if (existingCustomer) {
      throw new ConflictError('Customer profile already exists');
    }

    // For wholesale buyers, business name should be provided
    if (buyerType === 'WHOLESALE' && !businessName) {
      throw new ValidationError('Business name is required for wholesale buyers');
    }

    // Create customer profile
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

    // Update user profile completion status
    await prisma.user.update({
      where: { id: userId },
      data: { isProfileComplete: true }
    });

    return customer;
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId) {
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

  /**
   * Validate GSTIN format
   * Format: 22AAAAA0000A1Z5 (15 characters)
   */
  isValidGSTIN(gstin) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }
}

module.exports = new OnboardingService();
