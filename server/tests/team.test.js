import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Smart Team Matching & Team Management API Tests', () => {
  let app;
  let alexToken; // Participant not in any team initially
  let priyaToken; // Participant who is lead of NeuralVision AI
  let judgeToken;

  beforeEach(async () => {
    getDatabase();
    await seedDatabase();
    app = createApp();

    // Login as Alex Chen (unassigned participant)
    const alexRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'participant' });
    alexToken = alexRes.body.token;

    // Login as Priya Sharma (team lead of NeuralVision)
    const priyaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'priya@hackathon.dev', password: 'password123' });
    priyaToken = priyaLogin.body.token;

    const judgeRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ demoRole: 'judge' });
    judgeToken = judgeRes.body.token;
  });

  describe('GET /api/teams/recommendations', () => {
    it('should return deterministic recommendations for available participants', async () => {
      const res = await request(app)
        .get('/api/teams/recommendations')
        .set('Authorization', `Bearer ${alexToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.recommendations)).toBe(true);

      // David Kim is unassigned (Priya & Marcus are already in NeuralVision)
      const david = res.body.recommendations.find((r) => r.name === 'David Kim');
      expect(david).toBeDefined();
      expect(david.matchScore).toBeGreaterThanOrEqual(10);
      expect(Array.isArray(david.matchReasons)).toBe(true);
      expect(david.matchFactors).toBeDefined();

      // Current user (Alex) must NOT be in recommendations
      expect(res.body.recommendations.some((r) => r.name === 'Alex Chen')).toBe(false);

      // Members already in teams (Priya, Marcus) must NOT be in recommendations
      expect(res.body.recommendations.some((r) => r.name === 'Priya Sharma')).toBe(false);
      expect(res.body.recommendations.some((r) => r.name === 'Marcus Brody')).toBe(false);
    });

    it('should reject non-participant (judge) with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/teams/recommendations')
        .set('Authorization', `Bearer ${judgeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/teams (Create Team)', () => {
    it('should allow an unassigned participant to create a new team', async () => {
      const payload = {
        name: 'Quantum Health Innovators',
        track: 'AI/Healthcare',
      };

      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${alexToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.team.name).toBe('Quantum Health Innovators');
      expect(res.body.team.invite_code.startsWith('TEAM-')).toBe(true);
      expect(res.body.team.lead_user_id).toBeDefined();
    });

    it('should reject duplicate team names with 409 Conflict', async () => {
      const payload = {
        name: 'NeuralVision AI', // Already seeded team
        track: 'AI/Healthcare',
      };

      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${alexToken}`)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject team creation if user is already in a team (409 Conflict)', async () => {
      const payload = {
        name: 'Priya Second Team',
        track: 'General',
      };

      // Priya is already lead of NeuralVision AI
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${priyaToken}`)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already a member');
    });
  });

  describe('POST /api/teams/join (Join Team)', () => {
    it('should allow an unassigned participant to join a team with valid invite code', async () => {
      const res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({ inviteCode: 'NV-9941' }); // Seeded invite code for NeuralVision AI

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Successfully joined');
      expect(res.body.team.name).toBe('NeuralVision AI');
    });

    it('should reject invalid/nonexistent invite code with 404 Not Found', async () => {
      const res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({ inviteCode: 'INVALID-CODE-999' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid invite code');
    });

    it('should reject joining when already in a team with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${priyaToken}`)
        .send({ inviteCode: 'NV-9941' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject joining when team is already at maximum capacity (4 members)', async () => {
      const db = getDatabase();
      // Add two more members to NeuralVision AI (already has Priya & Marcus) to reach 4 members
      db.prepare('INSERT INTO team_members (id, team_id, user_id) VALUES (?, ?, ?)').run('tm_extra_1', 'team_neuralvision_01', 'usr_david_04');
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, attendance_token_hash)
        VALUES ('usr_filler_05', 'Filler User', 'filler@test.dev', 'hash', 'participant', 'th_filler')
      `).run();
      db.prepare('INSERT INTO team_members (id, team_id, user_id) VALUES (?, ?, ?)').run('tm_extra_2', 'team_neuralvision_01', 'usr_filler_05');

      // Now Alex attempts to join the already full team (5th member attempt)
      const res = await request(app)
        .post('/api/teams/join')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({ inviteCode: 'NV-9941' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('maximum capacity');
    });
  });

  describe('POST /api/teams/leave (Leave Team)', () => {
    it('should allow team lead to leave and promote next member to lead', async () => {
      // Priya leaves NeuralVision (Marcus should become new lead)
      const res = await request(app)
        .post('/api/teams/leave')
        .set('Authorization', `Bearer ${priyaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Marcus is now in team and is lead
      const marcusLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'marcus@hackathon.dev', password: 'password123' });
      const marcusToken = marcusLogin.body.token;

      const myTeamRes = await request(app)
        .get('/api/teams/my-team')
        .set('Authorization', `Bearer ${marcusToken}`);

      expect(myTeamRes.body.inTeam).toBe(true);
      expect(myTeamRes.body.isLead).toBe(true);
    });

    it('should dissolve the team when the sole member leaves', async () => {
      // Alex creates a solo team
      const createRes = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${alexToken}`)
        .send({ name: 'Solo Team', track: 'AI' });
      const teamId = createRes.body.team.id;

      // Alex leaves the solo team
      const leaveRes = await request(app)
        .post('/api/teams/leave')
        .set('Authorization', `Bearer ${alexToken}`);

      expect(leaveRes.status).toBe(200);

      // Verify team was dissolved from DB
      const db = getDatabase();
      const teamRow = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
      expect(teamRow).toBeUndefined();
    });

    it('should reject leaving when not in any team with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/teams/leave')
        .set('Authorization', `Bearer ${alexToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/teams/my-team', () => {
    it('should return inTeam: false when participant is not in a team', async () => {
      const res = await request(app)
        .get('/api/teams/my-team')
        .set('Authorization', `Bearer ${alexToken}`);

      expect(res.status).toBe(200);
      expect(res.body.inTeam).toBe(false);
      expect(res.body.team).toBeNull();
      expect(res.body.members).toEqual([]);
    });

    it('should return team info, sanitized members, and submission when in a team', async () => {
      const res = await request(app)
        .get('/api/teams/my-team')
        .set('Authorization', `Bearer ${priyaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.inTeam).toBe(true);
      expect(res.body.team.name).toBe('NeuralVision AI');
      expect(res.body.isLead).toBe(true);
      expect(res.body.members.length).toBe(2);
      expect(res.body.submission).toBeDefined();
      expect(res.body.submission.title).toContain('HealthAI Vision');
    });
  });
});
