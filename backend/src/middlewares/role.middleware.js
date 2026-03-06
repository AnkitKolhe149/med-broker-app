const { ForbiddenError } = require('../utils/errors');

/**
 * Middleware to restrict access to specific roles
 * @param {Array<string>} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const restrictTo = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};

module.exports = { restrictTo };
