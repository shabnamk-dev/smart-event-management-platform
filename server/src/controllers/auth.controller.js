import crypto from 'crypto';
import { getDatabase } from '../db/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { generateUserAttendanceToken, hashAttendanceToken } from '../utils/qr.js';
import { sanitizeUser } from '../utils/sanitize.js';
import { ConflictError, UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { config } from '../config/env.js';

// Pre-defined demo account mapping for controlled 1-click evaluation
const DEMO_ACCOUNTS = {
  participant: 'alex@hackathon.dev',
  judge: 'dr.elena@hackathon.dev',
  organizer: 'sarah.admin@hackathon.dev',
};

/**
 * Public participant registration.
 * ALWAYS forces role = 'participant'.
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, skills, preferred_roles, interests, bio } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const db = getDatabase();

    // Check email uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passwordHash = await hashPassword(password);
    const rawAttendanceToken = generateUserAttendanceToken(userId);
    const attendanceTokenHash = hashAttendanceToken(rawAttendanceToken);

    // Strictly enforce role='participant', is_demo=0, checked_in=0 (prevent mass assignment)
    const insertStmt = db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, skills, preferred_roles,
        interests, bio, attendance_token_hash, checked_in, is_demo
      ) VALUES (
        ?, ?, ?, ?, 'participant', ?, ?, ?, ?, ?, 0, 0
      )
    `);

    insertStmt.run(
      userId,
      name.trim(),
      normalizedEmail,
      passwordHash,
      JSON.stringify(skills || []),
      JSON.stringify(preferred_roles || []),
      JSON.stringify(interests || []),
      bio ? bio.trim() : '',
      attendanceTokenHash
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const sanitized = sanitizeUser(newUser);

    // Issue JWT with minimal claims
    const token = signToken({ id: newUser.id, role: newUser.role });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: sanitized,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * User login with credentials.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    // Generic error message to prevent user enumeration
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({ id: user.id, role: user.role });
    const sanitized = sanitizeUser(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitized,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get profile of current authenticated user.
 */
export function getMe(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Stateless logout endpoint.
 */
export function logout(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Please discard your authentication token.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controlled demo login for hackathon evaluation.
 * Strictly maps demoRole to seeded accounts; rejects arbitrary IDs/roles.
 */
export function demoLogin(req, res, next) {
  try {
    if (!config.DEMO_MODE) {
      throw new ForbiddenError('Demo login is disabled in this environment');
    }

    const { demoRole } = req.body;
    const targetEmail = DEMO_ACCOUNTS[demoRole];

    if (!targetEmail) {
      throw new ForbiddenError('Invalid demo role requested');
    }

    const db = getDatabase();
    const demoUser = db
      .prepare('SELECT * FROM users WHERE email = ? AND role = ? AND is_demo = 1')
      .get(targetEmail, demoRole);

    if (!demoUser) {
      throw new NotFoundError(`Demo user for role '${demoRole}' not found. Please ensure database is seeded.`);
    }

    const token = signToken({ id: demoUser.id, role: demoUser.role });
    const sanitized = sanitizeUser(demoUser);

    res.status(200).json({
      success: true,
      message: `Authenticated as demo ${demoRole}`,
      token,
      user: sanitized,
    });
  } catch (err) {
    next(err);
  }
}
