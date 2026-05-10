const { prisma } = require('../../database/prisma');
const { ValidationError, NotFoundError, ConflictError } = require('../../utils/errors');
const { orderWhereVendorRevenue, orderItemVendorLineGrossCents } = require('../../utils/vendorRevenueOrders');

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const normalizePhone = (value) => {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits;
};

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const text = String(value).trim();
  return text ? text : undefined;
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

const DEFAULT_NOTIFICATION_PREFS = {
  newOrders: true,
  orderUpdates: true,
  messages: true,
  settlements: true,
  weeklyReports: false,
  marketingUpdates: false
};

const DEFAULT_SECURITY_PREFS = {
  twoFAEnabled: false
};

const DEFAULT_COMPLIANCE_DATA = {
  complianceDocuments: [],
  complianceAuditLogs: []
};

const DEFAULT_CHAT_THREADS = {
  conversations: [],
  messagesByConversation: {},
  selectedConversationId: null
};

const mapVendorProfile = (user, vendor) => {
  const profileMeta = vendor?.bankAccountDetails?.profileMeta || {};
  const razorpayLinkedAccountId = vendor?.bankAccountDetails?.razorpayLinkedAccountId
    || vendor?.bankAccountDetails?.razorpayRouteAccountId
    || '';
  const bankAccountDetails = vendor?.bankAccountDetails && typeof vendor.bankAccountDetails === 'object'
    ? vendor.bankAccountDetails
    : {};

  return {
    businessName: vendor.companyName || '',
    verificationStatus: vendor.verificationStatus || 'PENDING',
    email: user.email || '',
    phone: user.mobile || vendor.contactNumber || '',
    address: vendor.businessAddress || '',
    city: profileMeta.city || '',
    state: vendor.state || '',
    pincode: profileMeta.pincode || '',
    gstNumber: vendor.gstinNumber || '',
    aboutBusiness: profileMeta.aboutBusiness || '',
    contactPersonName: vendor.contactPersonName || '',
    razorpayLinkedAccountId,
    bankAccountDetails: {
      accountHolderName: bankAccountDetails.accountHolderName || '',
      accountNumber: bankAccountDetails.accountNumber || '',
      bankName: bankAccountDetails.bankName || '',
      ifscCode: bankAccountDetails.ifscCode || '',
      branchName: bankAccountDetails.branchName || '',
      upiId: bankAccountDetails.upiId || '',
      payoutReferenceId: bankAccountDetails.payoutReferenceId || bankAccountDetails.razorpayLinkedAccountId || ''
    },
    notificationPrefs: {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...(profileMeta.notificationPrefs || {})
    },
    securityPrefs: {
      ...DEFAULT_SECURITY_PREFS,
      ...(profileMeta.securityPrefs || {})
    },
    complianceDocuments: Array.isArray(profileMeta.complianceDocuments)
      ? profileMeta.complianceDocuments
      : DEFAULT_COMPLIANCE_DATA.complianceDocuments,
    complianceAuditLogs: Array.isArray(profileMeta.complianceAuditLogs)
      ? profileMeta.complianceAuditLogs
      : DEFAULT_COMPLIANCE_DATA.complianceAuditLogs,
    rating: vendor.rating || 0,
    totalRatings: vendor.totalRatings || 0,
    chatThreads: profileMeta.chatThreads && typeof profileMeta.chatThreads === 'object'
      ? {
        ...DEFAULT_CHAT_THREADS,
        ...profileMeta.chatThreads
      }
      : DEFAULT_CHAT_THREADS
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
    razorpayLinkedAccountId,
    bankAccountDetails,
    contactPersonName,
    notificationPrefs,
    securityPrefs,
    complianceDocuments,
    complianceAuditLogs,
    chatThreads
  } = data;

  const existing = await prisma.user.findUnique({
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
          contactPersonName: true,
          contactNumber: true,
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
  const currentProfileMeta = existingBankDetails.profileMeta && typeof existingBankDetails.profileMeta === 'object'
    ? existingBankDetails.profileMeta
    : {};

  const nextBusinessName = typeof businessName === 'string' && businessName.trim()
    ? businessName.trim()
    : existing.vendor.companyName;
  const nextAddress = typeof address === 'string' && address.trim()
    ? address.trim()
    : existing.vendor.businessAddress;
  const nextState = typeof state === 'string' && state.trim()
    ? state.trim()
    : existing.vendor.state;
  const nextContactPersonName = typeof contactPersonName === 'string' && contactPersonName.trim()
    ? contactPersonName.trim()
    : existing.vendor.contactPersonName;
  const nextEmail = typeof email === 'string' && email.trim() ? email.trim() : existing.email;
  const nextPhone = typeof phone === 'string' && phone.trim() ? normalizePhone(phone) : existing.mobile;
  const nextGstin = typeof gstNumber === 'string' && gstNumber.trim() ? gstNumber.trim() : existing.vendor.gstinNumber;
  const nextAboutBusiness = typeof aboutBusiness === 'string' ? aboutBusiness : (currentProfileMeta.aboutBusiness || '');
  const nextCity = typeof city === 'string' ? city : (currentProfileMeta.city || '');
  const nextPincode = typeof pincode === 'string' ? pincode : (currentProfileMeta.pincode || '');

  const nextBankAccountDetails = {
    ...existingBankDetails,
    accountHolderName: normalizeOptionalText(bankAccountDetails?.accountHolderName) ?? existingBankDetails.accountHolderName,
    accountNumber: normalizeOptionalText(bankAccountDetails?.accountNumber) ?? existingBankDetails.accountNumber,
    bankName: normalizeOptionalText(bankAccountDetails?.bankName) ?? existingBankDetails.bankName,
    ifscCode: normalizeOptionalText(bankAccountDetails?.ifscCode) ?? existingBankDetails.ifscCode,
    branchName: normalizeOptionalText(bankAccountDetails?.branchName) ?? existingBankDetails.branchName,
    upiId: normalizeOptionalText(bankAccountDetails?.upiId) ?? existingBankDetails.upiId,
    payoutReferenceId: normalizeOptionalText(bankAccountDetails?.payoutReferenceId)
      ?? normalizeOptionalText(razorpayLinkedAccountId)
      ?? existingBankDetails.payoutReferenceId
      ?? existingBankDetails.razorpayLinkedAccountId
  };

  if (!nextBusinessName || !nextAddress || !nextState || !nextContactPersonName) {
    throw new ValidationError('Business name, address, state, and contact person are required');
  }

  validateEmail(nextEmail);
  validateGstin(nextGstin);

  if (nextPhone && nextPhone.length !== 10) {
    throw new ValidationError('Phone number must be exactly 10 digits');
  }

  const profileMeta = {
    ...currentProfileMeta,
    city: nextCity,
    pincode: nextPincode,
    aboutBusiness: nextAboutBusiness,
    notificationPrefs: notificationPrefs
      ? {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...currentProfileMeta.notificationPrefs,
        ...notificationPrefs
      }
      : (currentProfileMeta.notificationPrefs || DEFAULT_NOTIFICATION_PREFS),
    securityPrefs: securityPrefs
      ? {
        ...DEFAULT_SECURITY_PREFS,
        ...currentProfileMeta.securityPrefs,
        ...securityPrefs
      }
      : (currentProfileMeta.securityPrefs || DEFAULT_SECURITY_PREFS),
    complianceDocuments: Array.isArray(complianceDocuments)
      ? complianceDocuments
      : (Array.isArray(currentProfileMeta.complianceDocuments) ? currentProfileMeta.complianceDocuments : DEFAULT_COMPLIANCE_DATA.complianceDocuments),
    complianceAuditLogs: Array.isArray(complianceAuditLogs)
      ? complianceAuditLogs
      : (Array.isArray(currentProfileMeta.complianceAuditLogs) ? currentProfileMeta.complianceAuditLogs : DEFAULT_COMPLIANCE_DATA.complianceAuditLogs),
    chatThreads: chatThreads && typeof chatThreads === 'object'
      ? {
        ...DEFAULT_CHAT_THREADS,
        ...currentProfileMeta.chatThreads,
        ...chatThreads
      }
      : (currentProfileMeta.chatThreads || DEFAULT_CHAT_THREADS)
  };

  const mergedBankAccountDetails = {
    ...existingBankDetails,
    ...nextBankAccountDetails,
    profileMeta
  };

  if (typeof razorpayLinkedAccountId === 'string') {
    const normalizedLinkedAccountId = razorpayLinkedAccountId.trim();
    if (normalizedLinkedAccountId) {
      mergedBankAccountDetails.razorpayLinkedAccountId = normalizedLinkedAccountId;
    } else {
      delete mergedBankAccountDetails.razorpayLinkedAccountId;
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(nextEmail ? { email: nextEmail } : {}),
          ...(nextPhone ? { mobile: nextPhone } : {})
        }
      });

      await tx.vendor.update({
        where: { id: existing.vendor.id },
        data: {
          companyName: nextBusinessName,
          state: nextState,
          gstinNumber: nextGstin || undefined,
          businessAddress: nextAddress,
          contactPersonName: nextContactPersonName,
          contactNumber: nextPhone || undefined,
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

const getVendorPendingBalanceCents = async (vendorId) => {
  const [paidOrderItems, completedPayouts] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        vendorId,
        order: orderWhereVendorRevenue
      },
      select: {
        quantity: true,
        unitPriceCents: true,
        discountCents: true,
        lineTotalCents: true
      }
    }),
    prisma.payout.findMany({
      where: {
        vendorId,
        status: 'COMPLETED'
      },
      select: {
        amountCents: true
      }
    })
  ]);

  const grossEarnedCents = paidOrderItems.reduce(
    (sum, item) => sum + orderItemVendorLineGrossCents(item),
    0
  );

  const completedPayoutCents = completedPayouts.reduce(
    (sum, payout) => sum + (Number(payout.amountCents) || 0),
    0
  );

  return Math.max(0, grossEarnedCents - completedPayoutCents);
};

const requestWithdrawal = async (userContext, data = {}) => {
  const userId = typeof userContext === 'string' ? userContext : userContext?.id;
  const amountCents = Number(data.amountCents);
  const note = typeof data.note === 'string' ? data.note.trim() : '';

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new ValidationError('Withdrawal amount must be a positive number in cents');
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: {
      id: true,
      companyName: true,
      user: { select: { preferredCurrency: true } }
    }
  });

  if (!vendor) {
    throw new NotFoundError('Vendor profile not found');
  }

  const pendingBalanceCents = await getVendorPendingBalanceCents(vendor.id);
  if (amountCents > pendingBalanceCents) {
    throw new ValidationError(`Requested amount exceeds available balance of ${pendingBalanceCents} cents`);
  }

  const PAYMENT_CONFIG = require('../../config/payment');
  const { normalizeCurrencyCode } = require('../../utils/currencyPipeline');
  const fallbackCurrency = normalizeCurrencyCode(PAYMENT_CONFIG.currency) || String(process.env.EXCHANGE_RATE_BASE || 'INR').toUpperCase();
  const currencyUsed = normalizeCurrencyCode(data.currencyCode) || normalizeCurrencyCode(vendor?.user?.preferredCurrency) || fallbackCurrency;

  const payoutRequest = await prisma.payout.create({
    data: {
      vendorId: vendor.id,
      amountCents,
      status: 'PENDING',
      notes: note || 'Vendor withdrawal request',
      meta: {
        requestedByUserId: userId,
        requestedAt: new Date().toISOString(),
        type: 'WITHDRAWAL_REQUEST',
        currencyCode: currencyUsed
      }
    }
  });

  return {
    request: payoutRequest,
    availableBalanceAfterRequestCents: pendingBalanceCents - amountCents,
    vendor: {
      id: vendor.id,
      companyName: vendor.companyName,
      preferredCurrency: vendor?.user?.preferredCurrency || null
    }
  };
};

const getWithdrawalHistory = async (userContext, options = {}) => {
  const userId = typeof userContext === 'string' ? userContext : userContext?.id;
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: {
      id: true,
      companyName: true
    }
  });

  if (!vendor) {
    throw new NotFoundError('Vendor profile not found');
  }

  const where = {
    vendorId: vendor.id,
    meta: {
      path: ['type'],
      equals: 'WITHDRAWAL_REQUEST'
    }
  };

  const [requests, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.payout.count({ where })
  ]);

  return {
    vendor,
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
};

module.exports = {
  getVendorProfile,
  updateVendorProfile,
  requestWithdrawal,
  getWithdrawalHistory
};
