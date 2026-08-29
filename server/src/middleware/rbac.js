import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/**
 * Reusable Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user has one of the specified allowed roles.
 * @param {string | string[]} roles - Single role or array of allowed roles
 */
export function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return next(new UnauthorizedError('Authentication required before role verification'));
    }

    if (!allowedRoles.includes(req.userRole)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Requires ${allowedRoles.join(' or ')} permission, but user has role '${req.userRole}'`
        )
      );
    }

    next();
  };
}
