import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Project Submissions API & Team Lead Authorization Tests', () => {
  let app;
  let priyaToken; // Team lead of NeuralVision AI
  let marcusToken; // Regular member of NeuralVision AI
  let alexToken; // Unassigned participant (not in a team)

  beforeEach(async () => {
    getDatabase();
    await seedDatabase();
    app = createApp();

    const priyaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'priya@hackathon.dev', password: 'password123' });
    priyaToken = priyaLogin.body.token;

    const marcusLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'marcus@hackathon.dev', password: 'password123' });
    marcusToken = marcusLogin.body.token;

    const alexLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@hackathon.dev', password: 'password123' });
    alexToken = alexLogin.body.token;
  });

  describe('GET /api/submissions/my', () => {
    it('should retrieve existing project submission for team member', async () => {
      const res = await request(app)
        .get('/api/submissions/my')
        .set('Authorization', `Bearer ${priyaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.inTeam).toBe(true);
      expect(res.body.isLead).toBe(true);
      expect(res.body.submission).toBeDefined();
      expect(res.body.submission.title).toContain('HealthAI Vision');
    });

    it('should return inTeam: false when participant is not in a team', async () => {
      const res = await request(app)
        .get('/api/submissions/my')
        .set('Authorization', `Bearer ${alexToken}`);

      expect(res.status).toBe(200);
      expect(res.body.inTeam).toBe(false);
      expect(res.body.submission).toBeNull();
    });
  });

  describe('POST /api/submissions (Create or Update Submission)', () => {
    it('should allow team lead (Priya) to update project submission', async () => {
      const payload = {
        title: 'HealthAI Vision 2.0 (Updated)',
        tagline: 'Edge-accelerated clinical diagnostics with WebAssembly.',
        description: 'Comprehensive update featuring real-time eye-tracking and edge AI inference.',
        demo_url: 'https://v2.healthai-vision.dev',
        repo_url: 'https://github.com/abhiyantrix/neuralvision-v2',
        track: 'AI/Healthcare',
      };

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${priyaToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.submission.title).toBe('HealthAI Vision 2.0 (Updated)');
      expect(res.body.submission.demo_url).toBe('https://v2.healthai-vision.dev');

      // Verify in SQLite
      const db = getDatabase();
      const subInDb = db.prepare('SELECT title FROM submissions WHERE team_id = ?').get('team_neuralvision_01');
      expect(subInDb.title).toBe('HealthAI Vision 2.0 (Updated)');
    });

    it('should REJECT non-team-lead member (Marcus) from updating project submission (403 Forbidden)', async () => {
      const payload = {
        title: 'Unauthorized Project Title',
        tagline: 'Tagline',
        description: 'Description of the project attempting unauthorized update.',
      };

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${marcusToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only the team lead');
    });

    it('should REJECT unassigned participant from submitting a project (400 Bad Request)', async () => {
      const payload = {
        title: 'Solo Project Without Team',
        tagline: 'Tagline',
        description: 'Valid description for a project that has no team.',
      };

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${alexToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('must be a member of a team');
    });

    it('should reject invalid submission data (missing title / short description) with 400 Bad Request', async () => {
      const payload = {
        title: 'AB', // < 3 chars
        tagline: 'CD', // < 3 chars
        description: 'short', // < 10 chars
        demo_url: 'not-a-url',
      };

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${priyaToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });
  });

  describe('GET /api/submissions (List Submissions)', () => {
    it('should return list of all team project submissions with team names', async () => {
      const res = await request(app)
        .get('/api/submissions')
        .set('Authorization', `Bearer ${alexToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.submissions)).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.submissions[0].team_name).toBe('NeuralVision AI');
    });
  });
});
