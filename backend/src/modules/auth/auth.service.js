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

// Public API
module.exports = {
  register: async (data) => {
    const { email, mobile, password, role } = data;

    // Input validation
    if (!email || !password) {
      throw new ConflictError('Email and password are required');
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
    const { email, password, role } = data;

    // Input validation
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required');
    }

    validateEmail(email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: true,
        customer: true
      }
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (role && user.role !== role) {
      throw new AuthenticationError(`You are registered as ${user.role}. Please select the correct role.`);
    }

    const token = generateToken(user);
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

  generateToken,
  verifyToken
};
