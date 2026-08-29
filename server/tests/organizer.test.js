import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';
import { generateUserAttendanceToken } from '../src/utils/qr.js';

describe('Organizer QR Check-In, Attendee Roster & Analytics API Tests', () => {
  let app;
  let organizerToken;
  let participantToken;
  let judgeToken;

  beforeEach(async () => {
    getDatabase();
    await seedDatabase();
    app = createApp();

    const orgRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'organizer' });
    organizerToken = orgRes.body.token;

    const partRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'participant' });
    participantToken = partRes.body.token;

    const judgeRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'judge' });
    judgeToken = judgeRes.body.token;
  });

  describe('Organizer RBAC Protection', () => {
    it('should reject participant attempting organizer check-in with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/organizer/checkin')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ token: 'some_random_token_123456789' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject judge attempting organizer analytics with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/organizer/analytics')
        .set('Authorization', `Bearer ${judgeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/organizer/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/organizer/checkin (QR Attendance Verification)', () => {
    it('should successfully verify valid attendance token, mark checked_in = 1, and return safe attendee info', async () => {
      // Alex Chen is un-checked-in in initial seed
      const alexRawToken = generateUserAttendanceToken('usr_alex_01');

      const res = await request(app)
        .post('/api/organizer/checkin')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ token: alexRawToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Alex Chen');
      expect(res.body.attendee.name).toBe('Alex Chen');
      expect(res.body.attendee.checked_in).toBe(true);
      expect(res.body.attendee.checked_in_at).toBeDefined();

      // Verify direct database mutation
      const db = getDatabase();
      const userInDb = db.prepare('SELECT checked_in, checked_in_at FROM users WHERE id = ?').get('usr_alex_01');
      expect(userInDb.checked_in).toBe(1);
      expect(userInDb.checked_in_at).not.toBeNull();
    });

    it('should reject already checked-in participant with 409 Conflict (Duplicate prevention)', async () => {
      // Priya Sharma is already checked in in seed
      const priyaRawToken = generateUserAttendanceToken('usr_priya_02');

      const res = await request(app)
        .post('/api/organizer/checkin')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ token: priyaRawToken });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Duplicate Check-in');
    });

    it('should reject invalid or unrecognized token with 404 Not Found', async () => {
      const fakeToken = 'forged_fake_token_1234567890abcdef1234567890abcdef';

      const res = await request(app)
        .post('/api/organizer/checkin')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ token: fakeToken });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or unrecognized attendance token');
    });

    it('should reject malformed or short token with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/organizer/checkin')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ token: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/organizer/attendees (Roster)', () => {
    it('should retrieve attendee roster with check-in status and team names', async () => {
      const res = await request(app)
        .get('/api/organizer/attendees')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.attendees)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(4);

      // Verify safe fields only (no password_hash or attendance_token_hash)
      const first = res.body.attendees[0];
      expect(first.name).toBeDefined();
      expect(first.email).toBeDefined();
      expect(first.password_hash).toBeUndefined();
      expect(first.attendance_token_hash).toBeUndefined();
    });

    it('should filter attendee roster by search term', async () => {
      const res = await request(app)
        .get('/api/organizer/attendees?search=Alex')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.attendees.length).toBe(1);
      expect(res.body.attendees[0].name).toBe('Alex Chen');
    });
  });

  describe('GET /api/organizer/analytics (Real SQLite Metrics)', () => {
    it('should return live metrics computed directly from SQLite state', async () => {
      const res = await request(app)
        .get('/api/organizer/analytics')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const a = res.body.analytics;

      expect(a.totalParticipants).toBe(4); // Alex, Priya, Marcus, David
      expect(a.checkedInParticipants).toBe(2); // Priya, Marcus checked in initially
      expect(a.checkInPercentage).toBe(50); // 2/4 = 50%
      expect(a.teamsFormed).toBe(1); // NeuralVision AI
      expect(a.projectsSubmitted).toBe(1); // HealthAI Vision
      expect(a.totalEvaluations).toBe(1); // Dr. Elena Vance evaluated
      expect(a.averageScore).toBe(92.0);
    });
  });
});
