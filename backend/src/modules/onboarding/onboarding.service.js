const { prisma } = require('../../database/prisma');
const { ValidationError, ConflictError, NotFoundError } = require('../../utils/errors');

// Helper function to validate GSTIN format
// Format: 22AAAAA0000A1Z5 (15 characters)
const isValidGSTIN = (gstin) => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

const PAYMENT_CONFIG = require('../../config/payment');
const { normalizeCurrencyCode } = require('../../utils/currencyPipeline');

const COUNTRY_TO_CURRENCY = {
  'UNITED STATES': 'USD',
  'UNITED KINGDOM': 'GBP',
  'INDIA': 'INR',
  'AUSTRALIA': 'AUD',
  'CANADA': 'CAD',
  'SINGAPORE': 'SGD',
  'UAE': 'AED',
  'SAUDI ARABIA': 'SAR',
  'JAPAN': 'JPY',
  'CHINA': 'CNY',
  'BRAZIL': 'BRL',
  'SOUTH AFRICA': 'ZAR',
  'RUSSIA': 'RUB',
  'GERMANY': 'EUR',
  'FRANCE': 'EUR',
  'ITALY': 'EUR',
  'SPAIN': 'EUR',
  'NETHERLANDS': 'EUR',
  'KENYA': 'KES'
};

const getCurrencyForCountry = (country) => {
  const fallback = normalizeCurrencyCode(PAYMENT_CONFIG.currency) || String(process.env.EXCHANGE_RATE_BASE || 'INR').toUpperCase();
  if (!country) return fallback;
  const normalized = String(country).trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[normalized] || fallback;
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

    // Define strictly mandatory fields
    const requiredFields = {
      companyName: 'Company Name',
      vendorType: 'Vendor Type',
      country: 'Country',
      state: 'State/Region',
      gstinNumber: 'GSTIN Number',
      drugLicenseNumber: 'Drug License Number',
      businessAddress: 'Business Address',
      contactPersonName: 'Contact Person Name',
      contactNumber: 'Contact Number'
    };

    // Check each field and report the first missing one specifically
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!data[field] || String(data[field]).trim() === '') {
        throw new ValidationError(`${label} is required to complete your vendor profile`);
      }
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
            verificationStatus: 'PENDING'
          }
        });

        // ✅ Also create a Customer profile for the Vendor so they can buy products too
        // Use fallback values for mandatory fields to prevent database errors
        await tx.customer.create({
          data: {
            userId,
            fullName: contactPersonName || companyName || 'Vendor User',
            buyerType: 'RETAIL', 
            businessName: companyName || null,
            gstin: gstinNumber || null,
            country: country || 'India',
            city: state || 'Unknown', // Fallback for mandatory city field
            deliveryAddress: businessAddress || 'N/A', // Fallback for mandatory address field
            contactNumber: contactNumber || '0000000000'
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: { 
            isProfileComplete: true,
            preferredCurrency: getCurrencyForCountry(country)
          }
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
          data: { 
            isProfileComplete: true,
            preferredCurrency: getCurrencyForCountry(country)
          }
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
