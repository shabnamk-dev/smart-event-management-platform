import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

describe('Critical MVP End-to-End Workflow Verification', () => {
  it('should flawlessly execute the entire end-to-end hackathon lifecycle', async () => {
    getDatabase();
    await seedDatabase();
    const app = createApp();

    // 1. Participant Login (Alex Chen)
    const alexLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@hackathon.dev', password: 'password123' });
    expect(alexLoginRes.status).toBe(200);
    const alexToken = alexLoginRes.body.token;
    expect(alexToken).toBeDefined();

    // 2. Participant has/gets attendance QR token
    const qrRes = await request(app)
      .get('/api/users/qr')
      .set('Authorization', `Bearer ${alexToken}`);
    expect(qrRes.status).toBe(200);
    expect(qrRes.body.qrDataUrl).toBeDefined();
    expect(qrRes.body.rawToken).toBeDefined();
    expect(qrRes.body.attendee.checked_in).toBe(false);
    const alexAttendanceToken = qrRes.body.rawToken;

    // 3. Organizer Login (Sarah Jenkins)
    const orgLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.admin@hackathon.dev', password: 'password123' });
    expect(orgLoginRes.status).toBe(200);
    const orgToken = orgLoginRes.body.token;

    // Check analytics before check-in (2/4 checked in = 50%)
    const analyticsBeforeRes = await request(app)
      .get('/api/organizer/analytics')
      .set('Authorization', `Bearer ${orgToken}`);
    expect(analyticsBeforeRes.body.analytics.checkedInParticipants).toBe(2);
    expect(analyticsBeforeRes.body.analytics.checkInPercentage).toBe(50);

    // 4. Organizer enters/scans attendance token
    const checkinRes = await request(app)
      .post('/api/organizer/checkin')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ token: alexAttendanceToken });

    // 5. Server validates token
    expect(checkinRes.status).toBe(200);
    expect(checkinRes.body.success).toBe(true);
    expect(checkinRes.body.attendee.name).toBe('Alex Chen');
    expect(checkinRes.body.attendee.checked_in).toBe(true);
    expect(checkinRes.body.attendee.checked_in_at).not.toBeNull();

    // 6. Database checked_in changes to 1 and checked_in_at is recorded
    const db = getDatabase();
    const alexInDb = db.prepare('SELECT checked_in, checked_in_at FROM users WHERE id = ?').get('usr_alex_01');
    expect(alexInDb.checked_in).toBe(1);
    expect(alexInDb.checked_in_at).not.toBeNull();

    // 7. Duplicate scan rejection
    const duplicateRes = await request(app)
      .post('/api/organizer/checkin')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ token: alexAttendanceToken });
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.message).toContain('Duplicate Check-in');

    // 8. Organizer analytics reflects the check-in (3/4 checked in = 75%)
    const analyticsAfterRes = await request(app)
      .get('/api/organizer/analytics')
      .set('Authorization', `Bearer ${orgToken}`);
    expect(analyticsAfterRes.body.analytics.checkedInParticipants).toBe(3);
    expect(analyticsAfterRes.body.analytics.checkInPercentage).toBe(75);

    // 9. Participant Alex creates a new team
    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${alexToken}`)
      .send({ name: 'Alex Super Innovators', track: 'AI/Healthcare' });
    expect(teamRes.status).toBe(201);
    const teamId = teamRes.body.team.id;

    // 10. Participant/team creates a project submission
    const createSubRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${alexToken}`)
      .send({
        title: 'RetinalAI Visionary',
        tagline: 'Autonomous AI ocular screening.',
        description: 'End-to-end edge AI vision system running in WebAssembly.',
        repo_url: 'https://github.com/alexchen/retinal-ai',
        demo_url: 'https://retinal-ai-live.dev',
        track: 'AI/Healthcare',
      });
    expect(createSubRes.status).toBe(201);
    expect(createSubRes.body.submission.title).toBe('RetinalAI Visionary');

    // 11. Submission is stored in SQLite
    const subInDb = db.prepare('SELECT * FROM submissions WHERE team_id = ?').get(teamId);
    expect(subInDb).toBeDefined();
    expect(subInDb.title).toBe('RetinalAI Visionary');

    // 12. Participant can update their own team's submission
    const updateSubRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${alexToken}`)
      .send({
        title: 'RetinalAI Visionary Pro Edition',
        tagline: 'Autonomous AI ocular screening updated.',
        description: 'Updated architecture with 10x throughput and offline caching.',
        repo_url: 'https://github.com/alexchen/retinal-ai-pro',
        demo_url: 'https://retinal-ai-pro.dev',
        track: 'AI/Healthcare',
      });
    expect(updateSubRes.status).toBe(200);
    expect(updateSubRes.body.submission.title).toBe('RetinalAI Visionary Pro Edition');

    // 13. Non-lead cannot modify it
    // Seed Marcus as regular member of NeuralVision AI (Priya is lead)
    const marcusLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'marcus@hackathon.dev', password: 'password123' });
    const marcusToken = marcusLogin.body.token;

    const marcusEditRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${marcusToken}`)
      .send({
        title: 'Marcus Unauthorized Edit',
        tagline: 'Tagline',
        description: 'Unauthorized edit attempt.',
      });
    expect(marcusEditRes.status).toBe(403);
    expect(marcusEditRes.body.message).toContain('Only the team lead');

    // 14. Judge Login (Dr. Elena Vance) & View Submissions
    const elenaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr.elena@hackathon.dev', password: 'password123' });
    const elenaToken = elenaLogin.body.token;

    const judgeSubmissionsRes = await request(app)
      .get('/api/judge/submissions')
      .set('Authorization', `Bearer ${elenaToken}`);
    expect(judgeSubmissionsRes.status).toBe(200);
    expect(judgeSubmissionsRes.body.submissions.length).toBe(2);

    const alexSubmission = judgeSubmissionsRes.body.submissions.find(
      (s) => s.title === 'RetinalAI Visionary Pro Edition'
    );
    expect(alexSubmission).toBeDefined();
    expect(alexSubmission.has_evaluated).toBe(false);

    // 15. Judge Evaluates Alex's Submission with 4-Pillar Rubric
    const evalRes = await request(app)
      .post('/api/judge/evaluations')
      .set('Authorization', `Bearer ${elenaToken}`)
      .send({
        submission_id: alexSubmission.id,
        innovation_score: 9.5,
        technical_score: 9.5,
        impact_score: 9.5,
        presentation_score: 9.5,
        feedback: 'Groundbreaking architecture with proven clinical efficacy.',
      });
    expect(evalRes.status).toBe(201);
    expect(evalRes.body.evaluation.total_score).toBe(95.0);

    // 16. Live Leaderboard Verification
    const leaderboardRes = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${alexToken}`);
    expect(leaderboardRes.status).toBe(200);
    expect(leaderboardRes.body.leaderboard.length).toBe(2);

    // Rank #1: RetinalAI Visionary Pro Edition (Score: 95.0)
    expect(leaderboardRes.body.leaderboard[0].rank).toBe(1);
    expect(leaderboardRes.body.leaderboard[0].title).toBe('RetinalAI Visionary Pro Edition');
    expect(leaderboardRes.body.leaderboard[0].average_score).toBe(95.0);

    // Rank #2: HealthAI Vision (Score: 92.0)
    expect(leaderboardRes.body.leaderboard[1].rank).toBe(2);
    expect(leaderboardRes.body.leaderboard[1].title).toContain('HealthAI Vision');
    expect(leaderboardRes.body.leaderboard[1].average_score).toBe(92.0);

    // 17. Organizer Analytics Reflects Updated Evaluation & Average Score
    const finalAnalyticsRes = await request(app)
      .get('/api/organizer/analytics')
      .set('Authorization', `Bearer ${orgToken}`);
    expect(finalAnalyticsRes.status).toBe(200);
    expect(finalAnalyticsRes.body.analytics.projectsSubmitted).toBe(2);
    expect(finalAnalyticsRes.body.analytics.totalEvaluations).toBe(2);
    // Elena on HealthAI: 92, Elena on RetinalAI: 95 -> Avg: (92 + 95)/2 = 93.5
    expect(finalAnalyticsRes.body.analytics.averageScore).toBe(93.5);
  });
});
