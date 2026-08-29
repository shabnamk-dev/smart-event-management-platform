import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Server-Side Role-Based Access Control (RBAC) Tests', () => {
  let app;
  let participantToken;
  let judgeToken;
  let organizerToken;

  beforeEach(async () => {
    getDatabase();
    await seedDatabase();
    app = createApp();

    // Retrieve tokens for each distinct role via demo login
    const participantRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'participant' });
    participantToken = participantRes.body.token;

    const judgeRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'judge' });
    judgeToken = judgeRes.body.token;

    const organizerRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'organizer' });
    organizerToken = organizerRes.body.token;
  });

  describe('Participant Role Authorization', () => {
    it('participant CAN access participant-only endpoint (200 OK)', async () => {
      const res = await request(app)
        .get('/api/test-rbac/participant-only')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.userRole).toBe('participant');
    });

    it('participant CANNOT access organizer-only endpoint (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/test-rbac/organizer-only')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access forbidden');
    });

    it('participant CANNOT access judge-only endpoint (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/test-rbac/judge-only')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access forbidden');
    });
  });

  describe('Judge Role Authorization', () => {
    it('judge CAN access judge-only endpoint (200 OK)', async () => {
      const res = await request(app)
        .get('/api/test-rbac/judge-only')
        .set('Authorization', `Bearer ${judgeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.userRole).toBe('judge');
    });

    it('judge CANNOT access organizer-only endpoint (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/test-rbac/organizer-only')
        .set('Authorization', `Bearer ${judgeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access forbidden');
    });
  });

  describe('Organizer Role Authorization', () => {
    it('organizer CAN access organizer-only endpoint (200 OK)', async () => {
      const res = await request(app)
        .get('/api/test-rbac/organizer-only')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.userRole).toBe('organizer');
    });

    it('organizer CANNOT access participant-only endpoint (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/test-rbac/participant-only')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Multi-Role Array Authorization', () => {
    it('both judge and organizer CAN access judge-or-organizer endpoint (200 OK)', async () => {
      const judgeRes = await request(app)
        .get('/api/test-rbac/judge-or-organizer')
        .set('Authorization', `Bearer ${judgeToken}`);
      expect(judgeRes.status).toBe(200);

      const organizerRes = await request(app)
        .get('/api/test-rbac/judge-or-organizer')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(organizerRes.status).toBe(200);
    });

    it('participant is REJECTED on judge-or-organizer endpoint (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/test-rbac/judge-or-organizer')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Unauthenticated RBAC Protection', () => {
    it('unauthenticated request is rejected with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/test-rbac/organizer-only');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
