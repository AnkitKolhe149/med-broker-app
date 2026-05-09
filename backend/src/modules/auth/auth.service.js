const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../database/prisma');
const { ConflictError, AuthenticationError, NotFoundError } = require('../../utils/errors');

// Validate JWT_SECRET is set (fail fast in production)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set');
}

const JWT_EXPIRES_IN = '7d';

// Helper functions (internal)
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      isProfileComplete: user.isProfileComplete
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ConflictError('Invalid email format');
  }
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    throw new ConflictError('Password must be at least 8 characters long');
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    throw new ConflictError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }
};

const validateMobile = (mobile) => {
  if (mobile && !/^\d{10}$/.test(mobile)) {
    throw new ConflictError('Mobile number must be exactly 10 digits');
  }
};

const validatePasswordChange = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new ConflictError('Current password and new password are required');
  }

  validatePassword(newPassword);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }
};

// Public API
module.exports = {
  register: async (data) => {
    const { email, mobile, password, role } = data;

    // Input validation
    if (!email || !password) {
      throw new ConflictError('Email and password are required');
    }

    // ✅ FIX: ADMIN accounts can only be created by existing admins, not via public registration
    if (role === 'ADMIN') {
      throw new ConflictError('Admin accounts cannot be created via public registration. Contact an existing administrator.');
    }

    validateEmail(email);
    validatePassword(password);
    validateMobile(mobile);

    // Single lookup for registration conflicts to avoid duplicate checks.
    const existingAccount = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(mobile ? [{ mobile }] : [])
        ]
      },
      select: {
        email: true,
        mobile: true
      }
    });

    if (existingAccount) {
      if (existingAccount.email === email) {
        throw new ConflictError('User with this email already exists');
      }

      if (mobile && existingAccount.mobile === mobile) {
        throw new ConflictError('Mobile number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        mobile,
        passwordHash,
        role: role || 'CUSTOMER',
        isProfileComplete: false
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        role: true,
        isProfileComplete: true,
        createdAt: true
      }
    });

    const token = generateToken(user);

    return {
      user,
      token
    };
  },

  login: async (data) => {
    const { email, password, role, mobile } = data;

    // Input validation - allow login by email OR mobile
    if ((!email && !mobile) || !password) {
      throw new AuthenticationError('Email or mobile and password are required');
    }

    if (email) validateEmail(email);

    const findBy = email ? { email } : { mobile };
    const user = await prisma.user.findFirst({
      where: findBy,
      include: {
        vendor: true,
        customer: true
      }
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Block banned users immediately — before bcrypt, before token generation
    if (user.isBanned) {
      const suspendedError = new Error('Your account has been suspended. Please contact support.');
      suspendedError.statusCode = 403;
      suspendedError.code = 'ACCOUNT_SUSPENDED';
      throw suspendedError;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (role && user.role !== role) {
      throw new AuthenticationError(`You are registered as ${user.role}. Please select the correct role.`);
    }

    const token = generateToken(user);
    // record last login time
    try {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    } catch (e) {
      // non-fatal
      console.warn('Failed to update lastLoginAt for user', user.id, e?.message || e);
    }
    delete user.passwordHash;

    return {
      user,
      token
    };
  },

  getProfileStatus: async (userContext) => {
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
      isProfileComplete: user.isProfileComplete,
      role: user.role,
      hasVendorProfile: !!user.vendor,
      hasCustomerProfile: !!user.customer
    };
  },

  changePassword: async (userContext, data) => {
    const userId = typeof userContext === 'object' ? userContext?.id : userContext;
    const { currentPassword, newPassword } = data || {};

    await validatePasswordChange(userId, currentPassword, newPassword);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    return {
      message: 'Password updated successfully'
    };
  },

  updateProfile: async (userId, data) => {
    // Allow updating basic user fields and customer profile fields
    const userUpdates = {};
    const customerUpdates = {};

    if (data.name) userUpdates.name = String(data.name);
    if (data.mobile) userUpdates.mobile = String(data.mobile);
    if (data.avatarUrl) userUpdates.avatarUrl = String(data.avatarUrl);
    if (data.preferredCurrency) userUpdates.preferredCurrency = String(data.preferredCurrency);
    if (data.timezone) userUpdates.timezone = String(data.timezone);

    // Customer-specific
    if (data.fullName) customerUpdates.fullName = String(data.fullName);
    if (data.contactNumber) customerUpdates.contactNumber = String(data.contactNumber);
    if (data.deliveryAddress) customerUpdates.deliveryAddress = String(data.deliveryAddress || '');
    if (data.city) customerUpdates.city = String(data.city);
    if (data.country) customerUpdates.country = String(data.country);
    if (data.profileImage) customerUpdates.profileImage = String(data.profileImage);

    // Run updates in transaction
    const operations = [];
    if (Object.keys(userUpdates).length) {
      operations.push(prisma.user.update({ where: { id: userId }, data: userUpdates }));
    }

    // If customer exists, update; otherwise ignore
    const customer = await prisma.customer.findFirst({ where: { userId } });
    if (customer && Object.keys(customerUpdates).length) {
      operations.push(prisma.customer.update({ where: { id: customer.id }, data: customerUpdates }));
    }

    const results = operations.length ? await prisma.$transaction(operations) : [];

    // return refreshed user with relations
    const refreshed = await prisma.user.findUnique({ where: { id: userId }, include: { customer: true, vendor: true } });
    return refreshed;
  },

  generateToken,
  verifyToken
};

module.exports.invalidateUserSessions = async (userId) => {
  const { prisma } = require('../database/prisma');
  // set tokenInvalidBefore to now to invalidate older JWTs
  await prisma.user.update({ where: { id: userId }, data: { tokenInvalidBefore: new Date() } });
  return true;
};
