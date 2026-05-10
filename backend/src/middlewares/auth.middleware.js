const authService = require('../modules/auth/auth.service');
const { prisma } = require('../database/prisma');

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

    // Fetch full user details — always from DB to catch bans and deactivations
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        role: true,
        isActive: true,
        isBanned: true,
        preferredCurrency: true,
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

    // Session revocation: block banned users even with a valid JWT
    // Invalidate tokens issued before user's tokenInvalidBefore (if set)
    if (user.tokenInvalidBefore) {
      const tokenIat = decoded && decoded.iat ? Number(decoded.iat) : null;
      const invalidBefore = Math.floor(new Date(user.tokenInvalidBefore).getTime() / 1000);
      if (tokenIat && tokenIat < invalidBefore) {
        return res.status(401).json({ success: false, message: 'Session invalidated. Please login again.' });
      }
    }
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    req.user = {
      ...user,
      availableRoles: (authService.getAvailableRoles && typeof authService.getAvailableRoles === 'function')
        ? authService.getAvailableRoles(user)
        : [user.role]
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Attach user if token exists; continue as guest on missing/invalid token.
 */
async function authenticateOptional(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        preferredCurrency: true,
        vendor: true,
        customer: true
      }
    });

    if (user) {
      req.user = user;
    }

    return next();
  } catch (_error) {
    return next();
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
    const userRoles = req.user.availableRoles || [req.user.role];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
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
  authenticateOptional,
  requireCompleteProfile,
  requireRole
};
