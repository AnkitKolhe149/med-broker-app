const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { ConflictError, AuthenticationError, NotFoundError } = require('../../utils/errors');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
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

// Public API
module.exports = {
  register: async (data) => {
    const { email, mobile, password, role } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
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

  getProfileStatus: async (userId) => {
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
      isProfileComplete: user.isProfileComplete,
      role: user.role,
      hasVendorProfile: !!user.vendor,
      hasCustomerProfile: !!user.customer
    };
  },

  generateToken,
  verifyToken
};
