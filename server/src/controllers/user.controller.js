import { getDatabase } from '../db/database.js';
import { sanitizeUser } from '../utils/sanitize.js';
import { generateUserAttendanceToken, generateQRCodeDataURL } from '../utils/qr.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Get current authenticated user's profile.
 */
export function getProfile(req, res, next) {
  try {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update authenticated user's profile information.
 * Strictly prevents mutation of id, email, role, password_hash, is_demo, checked_in, attendance_token_hash.
 */
export function updateProfile(req, res, next) {
  try {
    const { name, bio, skills, preferred_roles, interests } = req.body;

    const db = getDatabase();

    const updateStmt = db.prepare(`
      UPDATE users
      SET
        name = ?,
        bio = ?,
        skills = ?,
        preferred_roles = ?,
        interests = ?
      WHERE id = ?
    `);

    updateStmt.run(
      name.trim(),
      bio ? bio.trim() : '',
      JSON.stringify(skills || []),
      JSON.stringify(preferred_roles || []),
      JSON.stringify(interests || []),
      req.userId
    );

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(updatedUser),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve the current participant's digital QR Attendance Pass.
 * Generates an opaque QR payload without exposing token hashes, passwords, or JWTs.
 */
export async function getQR(req, res, next) {
  try {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate deterministic high-entropy attendance token for QR payload
    const rawToken = generateUserAttendanceToken(user.id);
    const qrDataUrl = await generateQRCodeDataURL(rawToken);

    res.status(200).json({
      success: true,
      qrDataUrl,
      attendee: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        checked_in: Boolean(user.checked_in),
        checked_in_at: user.checked_in_at,
      },
    });
  } catch (err) {
    next(err);
  }
}
