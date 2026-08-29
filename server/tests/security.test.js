import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { signToken, verifyToken } from '../src/utils/jwt.js';
import {
  generateAttendanceToken,
  hashAttendanceToken,
  verifyAttendanceToken,
} from '../src/utils/qr.js';

describe('Security & Cryptography Utilities', () => {
  describe('Password Hashing (bcrypt)', () => {
    it('should hash passwords with salt and verify matches accurately', async () => {
      const plainPassword = 'SuperSecretPassword2026!';
      const hash = await hashPassword(plainPassword);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(plainPassword);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await comparePassword(plainPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should reject empty passwords', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password must be a non-empty string');
    });
  });

  describe('JWT Token Utilities', () => {
    it('should sign and verify valid payload', () => {
      const payload = { id: 'user_123', email: 'test@dev.com', role: 'participant' };
      const token = signToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const verified = verifyToken(token);
      expect(verified).toBeDefined();
      expect(verified.id).toBe('user_123');
      expect(verified.email).toBe('test@dev.com');
      expect(verified.role).toBe('participant');
    });

    it('should return null for tampered or invalid JWT', () => {
      const token = signToken({ id: 'user_123', role: 'participant' });
      const tampered = token.slice(0, -5) + 'abcde';

      const verified = verifyToken(tampered);
      expect(verified).toBeNull();
    });
  });

  describe('QR Attendance Token Security', () => {
    it('should generate high-entropy 64-char hex attendance tokens', () => {
      const token1 = generateAttendanceToken();
      const token2 = generateAttendanceToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toEqual(token2);
    });

    it('should calculate consistent SHA-256 hashes and verify tokens timing-safely', () => {
      const rawToken = generateAttendanceToken();
      const hash = hashAttendanceToken(rawToken);

      expect(hash).toHaveLength(64); // SHA-256 in hex is 64 chars
      expect(hash).not.toEqual(rawToken);

      // Verify authentic token matches hash
      expect(verifyAttendanceToken(rawToken, hash)).toBe(true);

      // Verify wrong token fails
      const forgedToken = generateAttendanceToken();
      expect(verifyAttendanceToken(forgedToken, hash)).toBe(false);
    });
  });
});
