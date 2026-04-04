const { prisma } = require('../../database/prisma');
const { ValidationError, NotFoundError, ConflictError } = require('../../utils/errors');

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const normalizePhone = (value) => {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits;
};

const validateEmail = (email) => {
  if (!email) return;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

const validateGstin = (gstin) => {
  if (!gstin) return;
  if (!GSTIN_REGEX.test(gstin)) {
    throw new ValidationError('Invalid GST number format');
  }
};

const mapVendorProfile = (user, vendor) => {
  const profileMeta = vendor?.bankAccountDetails?.profileMeta || {};

  return {
    businessName: vendor.companyName || '',
    email: user.email || '',
    phone: user.mobile || vendor.contactNumber || '',
    address: vendor.businessAddress || '',
    city: profileMeta.city || '',
    state: vendor.state || '',
    pincode: profileMeta.pincode || '',
    gstNumber: vendor.gstinNumber || '',
    aboutBusiness: profileMeta.aboutBusiness || '',
    contactPersonName: vendor.contactPersonName || ''
  };
};

const mapConflictError = (error) => {
  if (error?.code !== 'P2002') {
    return null;
  }

  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.join(',')
    : String(error.message || '');

  if (target.includes('email')) {
    return new ConflictError('Email already in use by another account');
  }

  if (target.includes('mobile')) {
    return new ConflictError('Phone number already in use by another account');
  }

  if (target.includes('gstinNumber')) {
    return new ConflictError('GST number already in use by another vendor');
  }

  return new ConflictError('Profile update conflicts with an existing record');
};

const getVendorProfile = async (userContext) => {
  const userId = typeof userContext === 'string' ? userContext : userContext?.id;
  const loadedVendor = typeof userContext === 'object' ? userContext?.vendor : null;

  if (
    typeof userContext === 'object' &&
    userContext?.email &&
    userContext?.mobile !== undefined &&
    loadedVendor
  ) {
    return mapVendorProfile(userContext, loadedVendor);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      mobile: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
          state: true,
          gstinNumber: true,
          businessAddress: true,
          bankAccountDetails: true,
          contactPersonName: true,
          contactNumber: true
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const vendor = user.vendor;
  if (!vendor) {
    throw new NotFoundError('Vendor profile not found');
  }

  return mapVendorProfile(user, vendor);
};

const updateVendorProfile = async (userContext, data) => {
  const userId = typeof userContext === 'string' ? userContext : userContext?.id;

  const {
    businessName,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    gstNumber,
    aboutBusiness,
    contactPersonName
  } = data;

  if (!businessName || !address || !state || !contactPersonName) {
    throw new ValidationError('Business name, address, state, and contact person are required');
  }

  validateEmail(email);
  validateGstin(gstNumber);

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone && normalizedPhone.length !== 10) {
    throw new ValidationError('Phone number must be exactly 10 digits');
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      vendor: {
        select: {
          id: true,
          bankAccountDetails: true
        }
      }
    }
  });

  if (!existing || !existing.vendor) {
    throw new NotFoundError('Vendor profile not found');
  }

  const existingBankDetails =
    existing.vendor.bankAccountDetails && typeof existing.vendor.bankAccountDetails === 'object'
      ? existing.vendor.bankAccountDetails
      : {};

  const profileMeta = {
    ...(existingBankDetails.profileMeta || {}),
    city: city || '',
    pincode: pincode || '',
    aboutBusiness: aboutBusiness || ''
  };

  const mergedBankAccountDetails = {
    ...existingBankDetails,
    profileMeta
  };

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(email ? { email } : {}),
          ...(normalizedPhone ? { mobile: normalizedPhone } : {})
        }
      });

      await tx.vendor.update({
        where: { id: existing.vendor.id },
        data: {
          companyName: businessName,
          state,
          gstinNumber: gstNumber || undefined,
          businessAddress: address,
          contactPersonName,
          contactNumber: normalizedPhone || undefined,
          bankAccountDetails: mergedBankAccountDetails
        }
      });

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          mobile: true,
          vendor: {
            select: {
              companyName: true,
              state: true,
              gstinNumber: true,
              businessAddress: true,
              bankAccountDetails: true,
              contactPersonName: true,
              contactNumber: true
            }
          }
        }
      });
    });

    return mapVendorProfile(updated, updated.vendor);
  } catch (error) {
    const mappedError = mapConflictError(error);
    if (mappedError) {
      throw mappedError;
    }

    throw error;
  }
};

module.exports = {
  getVendorProfile,
  updateVendorProfile
};
