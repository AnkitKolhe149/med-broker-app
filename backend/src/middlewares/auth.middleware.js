const authService = require('../modules/auth/auth.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authenticate user via JWT token
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    // Fetch full user details
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        role: true,
        isProfileComplete: true,
        vendor: true,
        customer: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Check if user has completed profile
 */
function requireCompleteProfile(req, res, next) {
  if (!req.user.isProfileComplete) {
    return res.status(403).json({
      success: false,
      message: 'Please complete your profile to access this resource'
    });
  }
  next();
}

/**
 * Require specific role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireCompleteProfile,
  requireRole
};
