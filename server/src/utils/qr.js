import crypto from 'crypto';
import QRCode from 'qrcode';
import { config } from '../config/env.js';

/**
 * Generate a cryptographically random, high-entropy attendance token.
 * @returns {string} 64-character hex token
 */
export function generateAttendanceToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a deterministic high-entropy attendance token for a specific user ID
 * using server HMAC secret. This ensures raw tokens don't need to be stored in the database.
 * @param {string} userId
 * @returns {string} 64-character hex token
 */
export function generateUserAttendanceToken(userId) {
  if (!userId) {
    throw new Error('userId is required to generate user attendance token');
  }
  return crypto
    .createHmac('sha256', config.JWT_SECRET)
    .update(`att:${userId}`)
    .digest('hex');
}

/**
 * Hash an attendance token using SHA-256.
 * ONLY this hash is stored in the database, never the raw credential.
 * @param {string} rawToken 
 * @returns {string} SHA-256 hash hex string
 */
export function hashAttendanceToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Attendance token must be a non-empty string');
  }
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Verify an incoming raw attendance token against a stored hash using timing-safe comparison.
 * @param {string} rawToken 
 * @param {string} storedHash 
 * @returns {boolean}
 */
export function verifyAttendanceToken(rawToken, storedHash) {
  if (!rawToken || !storedHash) return false;
  const computedHash = hashAttendanceToken(rawToken);
  try {
    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

/**
 * Generate a QR Code Data URL (PNG/Base64) for client display/download.
 * Note: Only the raw attendance token is encoded into the QR code.
 * Never embed JWTs, passwords, roles, or sensitive PII into the QR payload.
 * @param {string} rawToken 
 * @returns {Promise<string>} Data URL
 */
export async function generateQRCodeDataURL(rawToken) {
  if (!rawToken) {
    throw new Error('Token is required to generate QR code');
  }
  return QRCode.toDataURL(rawToken, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    width: 320,
  });
}
