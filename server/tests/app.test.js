import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Express Application & Health Check API', () => {
  const app = createApp();

  it('GET /api/health should return 200 OK with healthy status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('Smart Event Management Platform');
  });

  it('GET /api/nonexistent should return 404 Not Found', async () => {
    const res = await request(app).get('/api/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toContain('not found');
  });
});
