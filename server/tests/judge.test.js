import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Judge Portal & Rubric Evaluation API Tests', () => {
  let app;
  let judgeElenaToken; // Dr. Elena Vance
  let judgeKenjiToken; // Kenji Sato
  let participantToken; // Alex Chen
  let organizerToken; // Sarah Jenkins

  beforeEach(async () => {
    getDatabase();
    await seedDatabase();
    app = createApp();

    const elenaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr.elena@hackathon.dev', password: 'password123' });
    judgeElenaToken = elenaLogin.body.token;

    const kenjiLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'kenji.sato@hackathon.dev', password: 'password123' });
    judgeKenjiToken = kenjiLogin.body.token;

    const partLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@hackathon.dev', password: 'password123' });
    participantToken = partLogin.body.token;

    const orgLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.admin@hackathon.dev', password: 'password123' });
    organizerToken = orgLogin.body.token;
  });

  describe('Judge RBAC Authorization', () => {
    it('should reject participant attempting judge stats with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/judge/stats')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject organizer attempting judge stats with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/judge/stats')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow judge to access judge stats with 200 OK', async () => {
      const res = await request(app)
        .get('/api/judge/stats')
        .set('Authorization', `Bearer ${judgeElenaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.totalSubmissions).toBe(1);
    });
  });

  describe('GET /api/judge/submissions', () => {
    it('should list all submissions with has_evaluated indicator for the current judge', async () => {
      // Elena evaluated HealthAI Vision in seed
      const resElena = await request(app)
        .get('/api/judge/submissions')
        .set('Authorization', `Bearer ${judgeElenaToken}`);

      expect(resElena.status).toBe(200);
      expect(resElena.body.submissions.length).toBe(1);
      expect(resElena.body.submissions[0].has_evaluated).toBe(true);
      expect(resElena.body.submissions[0].evaluation.total_score).toBe(92);

      // Kenji has NOT evaluated HealthAI Vision yet
      const resKenji = await request(app)
        .get('/api/judge/submissions')
        .set('Authorization', `Bearer ${judgeKenjiToken}`);

      expect(resKenji.status).toBe(200);
      expect(resKenji.body.submissions[0].has_evaluated).toBe(false);
      expect(resKenji.body.submissions[0].evaluation).toBeNull();
    });

    it('should retrieve single submission details by ID', async () => {
      const res = await request(app)
        .get('/api/judge/submissions/sub_neuralvision_01')
        .set('Authorization', `Bearer ${judgeKenjiToken}`);

      expect(res.status).toBe(200);
      expect(res.body.submission.title).toContain('HealthAI Vision');
      expect(res.body.members.length).toBeGreaterThan(0);
      expect(res.body.has_evaluated).toBe(false);
    });
  });

  describe('POST /api/judge/evaluations (Submit Rubric Evaluation)', () => {
    it('should allow judge (Kenji) to submit a valid evaluation with server-side total score calculation', async () => {
      const payload = {
        submission_id: 'sub_neuralvision_01',
        innovation_score: 9.0,
        technical_score: 8.5,
        impact_score: 9.5,
        presentation_score: 9.0,
        feedback: 'Exceptional edge AI implementation. Great clinical feasibility.',
      };

      // Expected calculation:
      // (9.0 * 0.25 + 8.5 * 0.35 + 9.5 * 0.25 + 9.0 * 0.15) * 10
      // = (2.25 + 2.975 + 2.375 + 1.35) * 10 = 8.95 * 10 = 89.5
      const res = await request(app)
        .post('/api/judge/evaluations')
        .set('Authorization', `Bearer ${judgeKenjiToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.evaluation.total_score).toBe(89.5);
      expect(res.body.evaluation.judge_id).toBeDefined();

      // Verify in SQLite
      const db = getDatabase();
      const evInDb = db
        .prepare('SELECT total_score FROM evaluations WHERE submission_id = ? AND judge_id = ?')
        .get('sub_neuralvision_01', 'usr_judge_kenji');
      expect(evInDb.total_score).toBe(89.5);
    });

    it('should reject score greater than 10.0 with 400 Bad Request', async () => {
      const payload = {
        submission_id: 'sub_neuralvision_01',
        innovation_score: 11.0, // Invalid: > 10
        technical_score: 8.0,
        impact_score: 8.0,
        presentation_score: 8.0,
      };

      const res = await request(app)
        .post('/api/judge/evaluations')
        .set('Authorization', `Bearer ${judgeKenjiToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should reject score less than 0.0 with 400 Bad Request', async () => {
      const payload = {
        submission_id: 'sub_neuralvision_01',
        innovation_score: -1.0, // Invalid: < 0
        technical_score: 8.0,
        impact_score: 8.0,
        presentation_score: 8.0,
      };

      const res = await request(app)
        .post('/api/judge/evaluations')
        .set('Authorization', `Bearer ${judgeKenjiToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject evaluation for nonexistent submission with 404 Not Found', async () => {
      const payload = {
        submission_id: 'sub_nonexistent_9999',
        innovation_score: 8.0,
        technical_score: 8.0,
        impact_score: 8.0,
        presentation_score: 8.0,
      };

      const res = await request(app)
        .post('/api/judge/evaluations')
        .set('Authorization', `Bearer ${judgeKenjiToken}`)
        .send(payload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/judge/evaluations/:id (Update Evaluation & Ownership)', () => {
    it('should allow author judge (Elena) to update evaluation with recalculated total score', async () => {
      const payload = {
        innovation_score: 10.0,
        technical_score: 10.0,
        impact_score: 10.0,
        presentation_score: 10.0,
        feedback: 'Perfect score after review of working live demo.',
      };

      const res = await request(app)
        .put('/api/judge/evaluations/eval_01')
        .set('Authorization', `Bearer ${judgeElenaToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.evaluation.total_score).toBe(100.0);
    });

    it('should REJECT another judge (Kenji) from modifying Elena\'s evaluation (403 Forbidden)', async () => {
      const payload = {
        innovation_score: 5.0,
        technical_score: 5.0,
        impact_score: 5.0,
        presentation_score: 5.0,
        feedback: 'Unauthorized modification attempt.',
      };

      const res = await request(app)
        .put('/api/judge/evaluations/eval_01')
        .set('Authorization', `Bearer ${judgeKenjiToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authored');
    });
  });
});
