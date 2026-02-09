const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { ConflictError, AuthenticationError, NotFoundError } = require('../../utils/errors');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

class AuthService {
  /**
   * Register a new user
   */
  async register(data) {
    const { email, mobile, password, role } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
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

    // Generate token
    const token = this.generateToken(user);

    return {
      user,
      token
    };
  }

  /**
   * Login user
   */
  async login(data) {
    const { email, password, role } = data;

    // Find user
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify role matches
    if (role && user.role !== role) {
      throw new AuthenticationError(`You are registered as ${user.role}. Please select the correct role.`);
    }

    // Generate token
    const token = this.generateToken(user);

    // Remove password hash from response
    delete user.passwordHash;

    return {
      user,
      token
    };
  }

  /**
   * Get profile status
   */
  async getProfileStatus(userId) {
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
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
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
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
