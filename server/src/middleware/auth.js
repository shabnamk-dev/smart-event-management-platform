import { UnauthorizedError } from '../utils/errors.js';
import { verifyToken } from '../utils/jwt.js';
import { getDatabase } from '../db/database.js';
import { sanitizeUser } from '../utils/sanitize.js';

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      throw new UnauthorizedError('User account associated with this token no longer exists');
    }

    // Attach sanitized user profile to request (role comes directly from server/database)
    req.user = sanitizeUser(user);
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (err) {
    next(err);
  }
}
