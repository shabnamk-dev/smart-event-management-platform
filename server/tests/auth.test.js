import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Authentication API & Lifecycle Tests', () => {
  let app;

  beforeEach(async () => {
    getDatabase();
    await seedDatabase();
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new participant and return JWT and sanitized profile', async () => {
      const payload = {
        name: 'Jordan Lee',
        email: 'jordan.lee@example.com',
        password: 'SecurePassword123!',
        skills: ['Python', 'Django'],
        preferred_roles: ['Backend Developer'],
        interests: ['FinTech', 'AI/ML'],
        bio: 'Aspiring fintech builder.',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Jordan Lee');
      expect(res.body.user.email).toBe('jordan.lee@example.com');
      expect(res.body.user.role).toBe('participant');
      expect(res.body.user.skills).toEqual(['Python', 'Django']);

      // Ensure NO sensitive security fields are exposed
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.attendance_token_hash).toBeUndefined();
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      const payload = {
        name: 'Alex Duplicate',
        email: 'alex@hackathon.dev', // Seeded account email
        password: 'Password123!',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject invalid email format with 400 Bad Request', async () => {
      const payload = {
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'Password123!',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should reject weak/short password (< 8 chars) with 400 Bad Request', async () => {
      const payload = {
        name: 'Short Password User',
        email: 'shortpass@example.com',
        password: '12345',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should prevent role escalation through registration payload (forces participant)', async () => {
      const payload = {
        name: 'Escalation Hacker',
        email: 'hacker@example.com',
        password: 'Password123!',
        role: 'organizer', // Attempting to self-assign organizer
        is_demo: 1,
        checked_in: 1,
        attendance_token_hash: 'evil_hash',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('participant'); // Role MUST be participant
      expect(res.body.user.is_demo).toBe(false);
      expect(res.body.user.checked_in).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in an existing user with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'alex@hackathon.dev',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('alex@hackathon.dev');
      expect(res.body.user.role).toBe('participant');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('should return 401 with generic error for incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'alex@hackathon.dev',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 401 with generic error for non-existent account (no user enumeration)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@nowhere.dev',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject malformed login request with 400 Bad Request', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'invalid-email-format',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile when valid Bearer token is provided', async () => {
      // First login to get a token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'dr.elena@hackathon.dev',
        password: 'password123',
      });
      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('dr.elena@hackathon.dev');
      expect(res.body.user.role).toBe('judge');
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.attendance_token_hash).toBeUndefined();
    });

    it('should reject unauthenticated request without Authorization header with 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token missing');
    });

    it('should reject tampered or invalid Bearer token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/demo-login', () => {
    it('should log in as demo participant', async () => {
      const res = await request(app).post('/api/auth/demo-login').send({ demoRole: 'participant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('participant');
      expect(res.body.user.is_demo).toBe(true);
    });

    it('should log in as demo judge', async () => {
      const res = await request(app).post('/api/auth/demo-login').send({ demoRole: 'judge' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('judge');
      expect(res.body.user.is_demo).toBe(true);
    });

    it('should log in as demo organizer', async () => {
      const res = await request(app).post('/api/auth/demo-login').send({ demoRole: 'organizer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('organizer');
      expect(res.body.user.is_demo).toBe(true);
    });

    it('should reject invalid or arbitrary demo roles with 400 Bad Request', async () => {
      const res = await request(app).post('/api/auth/demo-login').send({ demoRole: 'superadmin' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 on logout with instructions to discard token', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'alex@hackathon.dev',
        password: 'password123',
      });
      const token = loginRes.body.token;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logged out');
    });
  });
});
