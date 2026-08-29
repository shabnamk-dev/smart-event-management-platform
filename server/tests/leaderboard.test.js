import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Live Leaderboard & Dynamic Aggregate Scoring API Tests', () => {
  let app;
  let participantToken;
  let judgeElenaToken;
  let judgeKenjiToken;

  beforeEach(async () => {
    getDatabase();
    await seedDatabase();
    app = createApp();

    const partRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@hackathon.dev', password: 'password123' });
    participantToken = partRes.body.token;

    const elenaRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr.elena@hackathon.dev', password: 'password123' });
    judgeElenaToken = elenaRes.body.token;

    const kenjiRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'kenji.sato@hackathon.dev', password: 'password123' });
    judgeKenjiToken = kenjiRes.body.token;
  });

  describe('GET /api/leaderboard', () => {
    it('should return ranked submissions with real SQLite evaluation aggregates', async () => {
      const res = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.leaderboard)).toBe(true);
      expect(res.body.leaderboard.length).toBe(1);

      const top = res.body.leaderboard[0];
      expect(top.rank).toBe(1);
      expect(top.title).toContain('HealthAI Vision');
      expect(top.team_name).toBe('NeuralVision AI');
      expect(top.evaluation_count).toBe(1);
      expect(top.average_score).toBe(92.0); // Seeded evaluation from Dr. Elena
      expect(top.breakdown).toBeDefined();
    });

    it('should dynamically update average score and evaluation count when a new evaluation is added', async () => {
      // Kenji evaluates HealthAI Vision with score 86.0
      await request(app)
        .post('/api/judge/evaluations')
        .set('Authorization', `Bearer ${judgeKenjiToken}`)
        .send({
          submission_id: 'sub_neuralvision_01',
          innovation_score: 8.0,
          technical_score: 9.0,
          impact_score: 8.0,
          presentation_score: 10.0, // (2.0 + 3.15 + 2.0 + 1.5) * 10 = 86.5
          feedback: 'Solid presentation and tech quality.',
        });

      const res = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(200);
      const top = res.body.leaderboard[0];
      expect(top.evaluation_count).toBe(2);
      // Elena: 92.0, Kenji: 86.5 -> Avg: (92.0 + 86.5) / 2 = 89.25 -> rounded to 89.3
      expect(top.average_score).toBe(89.3);
    });

    it('should support track filtering on the leaderboard', async () => {
      const res = await request(app)
        .get('/api/leaderboard?track=AI/Healthcare')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.leaderboard.length).toBe(1);
      expect(res.body.leaderboard[0].track).toBe('AI/Healthcare');

      const resEmpty = await request(app)
        .get('/api/leaderboard?track=NonexistentTrack')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(resEmpty.status).toBe(200);
      expect(resEmpty.body.leaderboard.length).toBe(0);
    });
  });
});
