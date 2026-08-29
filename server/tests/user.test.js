import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

describe('User Profile & QR Attendance Pass API Tests', () => {
  let app;
  let participantToken;
  let judgeToken;

  beforeEach(async () => {
    getDatabase();
    await seedDatabase();
    app = createApp();

    const partRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'participant' });
    participantToken = partRes.body.token;

    const judgeRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'judge' });
    judgeToken = judgeRes.body.token;
  });

  describe('GET /api/users/profile', () => {
    it('should retrieve current participant profile with safe fields', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Alex Chen');
      expect(res.body.user.email).toBe('alex@hackathon.dev');
      expect(res.body.user.role).toBe('participant');
      expect(Array.isArray(res.body.user.skills)).toBe(true);

      // Security check: no sensitive hashes
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.attendance_token_hash).toBeUndefined();
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should allow participant to update allowed profile fields (name, bio, skills, roles, interests)', async () => {
      const updateData = {
        name: 'Alex Chen Updated',
        bio: 'Updated bio for AI diagnostics.',
        skills: ['React', 'TypeScript', 'Node.js', 'PyTorch', 'FastAPI'],
        preferred_roles: ['Fullstack Engineer', 'ML Engineer'],
        interests: ['AI/ML', 'Healthcare', 'Robotics'],
      };

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Alex Chen Updated');
      expect(res.body.user.bio).toBe('Updated bio for AI diagnostics.');
      expect(res.body.user.skills).toContain('PyTorch');
      expect(res.body.user.interests).toContain('Robotics');
    });

    it('should NOT allow modification of protected fields (id, email, role, is_demo, checked_in)', async () => {
      const updateData = {
        name: 'Alex Chen',
        email: 'hacked.email@evil.com',
        role: 'organizer',
        is_demo: false,
        checked_in: true,
      };

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('alex@hackathon.dev'); // Unchanged
      expect(res.body.user.role).toBe('participant'); // Unchanged
      expect(res.body.user.checked_in).toBe(false); // Unchanged
    });

    it('should reject invalid profile updates with 400 Bad Request', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ name: 'A' }); // Name < 2 chars

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });
  });

  describe('GET /api/users/qr', () => {
    it('should generate and return digital QR Attendance Pass for participant', async () => {
      const res = await request(app)
        .get('/api/users/qr')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.qrDataUrl).toBeDefined();
      expect(res.body.qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
      expect(res.body.attendee).toBeDefined();
      expect(res.body.attendee.name).toBe('Alex Chen');
      expect(res.body.attendee.role).toBe('participant');

      expect(res.body.rawToken).toBeDefined();
      expect(typeof res.body.rawToken).toBe('string');
      expect(res.body.rawToken.length).toBeGreaterThanOrEqual(16);

      // Verify that hashing rawToken matches the user's attendance_token_hash in DB
      const db = getDatabase();
      const userInDb = db.prepare('SELECT attendance_token_hash FROM users WHERE name = ?').get('Alex Chen');
      const crypto = await import('crypto');
      const computedHash = crypto.default.createHash('sha256').update(res.body.rawToken).digest('hex');
      expect(computedHash).toBe(userInDb.attendance_token_hash);

      // Security check: no token hash exposure
      expect(res.body.attendance_token_hash).toBeUndefined();
      expect(res.body.attendee.attendance_token_hash).toBeUndefined();
    });

    it('should forbid non-participants (judge/organizer) from accessing participant QR pass with 403', async () => {
      const res = await request(app)
        .get('/api/users/qr')
        .set('Authorization', `Bearer ${judgeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
