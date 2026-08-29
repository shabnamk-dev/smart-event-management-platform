import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Schema & Integrity Constraints', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    const schemaPath = path.resolve(__dirname, '../src/db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schemaSql);
  });

  afterEach(() => {
    db.close();
  });

  it('should enforce unique email constraint on users', () => {
    const insert = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, attendance_token_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run('u1', 'Alice', 'alice@test.dev', 'hash1', 'participant', 'token_hash_1');

    // Attempt duplicate email
    expect(() => {
      insert.run('u2', 'Alice Duplicate', 'alice@test.dev', 'hash2', 'participant', 'token_hash_2');
    }).toThrow(/UNIQUE constraint failed: users.email/);
  });

  it('should enforce unique attendance token hash on users', () => {
    const insert = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, attendance_token_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run('u1', 'Alice', 'alice@test.dev', 'hash1', 'participant', 'token_hash_1');

    // Attempt duplicate attendance token hash
    expect(() => {
      insert.run('u2', 'Bob', 'bob@test.dev', 'hash2', 'participant', 'token_hash_1');
    }).toThrow(/UNIQUE constraint failed: users.attendance_token_hash/);
  });

  it('should enforce role CHECK constraint on users', () => {
    const insert = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, attendance_token_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Invalid role 'superuser'
    expect(() => {
      insert.run('u1', 'Mallory', 'mallory@test.dev', 'hash1', 'superuser', 'token_hash_1');
    }).toThrow(/CHECK constraint failed/);
  });

  it('should enforce strictly ONE team per participant (team_members.user_id UNIQUE)', () => {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, attendance_token_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run('u1', 'Lead Alice', 'alice@test.dev', 'hash1', 'participant', 'th1');
    insertUser.run('u2', 'Member Bob', 'bob@test.dev', 'hash2', 'participant', 'th2');

    const insertTeam = db.prepare(`
      INSERT INTO teams (id, name, invite_code, lead_user_id)
      VALUES (?, ?, ?, ?)
    `);
    insertTeam.run('t1', 'Team Alpha', 'ALPHA-1', 'u1');
    insertTeam.run('t2', 'Team Beta', 'BETA-2', 'u1');

    const insertMember = db.prepare(`
      INSERT INTO team_members (id, team_id, user_id)
      VALUES (?, ?, ?)
    `);

    // Bob joins Team Alpha
    insertMember.run('tm1', 't1', 'u2');

    // Attempt Bob joining Team Beta while still in Alpha
    expect(() => {
      insertMember.run('tm2', 't2', 'u2');
    }).toThrow(/UNIQUE constraint failed: team_members.user_id/);
  });

  it('should enforce strictly ONE project submission per team (submissions.team_id UNIQUE)', () => {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, attendance_token_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run('u1', 'Lead Alice', 'alice@test.dev', 'hash1', 'participant', 'th1');

    const insertTeam = db.prepare(`
      INSERT INTO teams (id, name, invite_code, lead_user_id)
      VALUES (?, ?, ?, ?)
    `);
    insertTeam.run('t1', 'Team Alpha', 'ALPHA-1', 'u1');

    const insertSubmission = db.prepare(`
      INSERT INTO submissions (id, team_id, title, tagline, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertSubmission.run('sub1', 't1', 'Project 1', 'Tagline 1', 'Description 1');

    // Attempt second submission for Team Alpha
    expect(() => {
      insertSubmission.run('sub2', 't1', 'Project 2', 'Tagline 2', 'Description 2');
    }).toThrow(/UNIQUE constraint failed: submissions.team_id/);
  });

  it('should prevent duplicate evaluations by the same judge for the same submission', () => {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, attendance_token_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run('u1', 'Lead Alice', 'alice@test.dev', 'hash1', 'participant', 'th1');
    insertUser.run('j1', 'Judge Elena', 'elena@judge.dev', 'hash2', 'judge', 'th2');

    const insertTeam = db.prepare(`
      INSERT INTO teams (id, name, invite_code, lead_user_id)
      VALUES (?, ?, ?, ?)
    `);
    insertTeam.run('t1', 'Team Alpha', 'ALPHA-1', 'u1');

    const insertSubmission = db.prepare(`
      INSERT INTO submissions (id, team_id, title, tagline, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertSubmission.run('sub1', 't1', 'Project 1', 'Tagline 1', 'Description 1');

    const insertEval = db.prepare(`
      INSERT INTO evaluations (
        id, submission_id, judge_id, innovation_score, technical_score,
        impact_score, presentation_score, total_score, feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // First evaluation
    insertEval.run('ev1', 'sub1', 'j1', 8.0, 9.0, 8.5, 7.5, 84.0, 'Great work');

    // Attempt duplicate evaluation by Judge Elena on sub1
    expect(() => {
      insertEval.run('ev2', 'sub1', 'j1', 9.0, 9.0, 9.0, 9.0, 90.0, 'Updated work');
    }).toThrow(/UNIQUE constraint failed: evaluations.submission_id, evaluations.judge_id/);
  });

  it('should enforce score CHECK constraints (0.0 to 10.0)', () => {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, attendance_token_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run('u1', 'Lead Alice', 'alice@test.dev', 'hash1', 'participant', 'th1');
    insertUser.run('j1', 'Judge Elena', 'elena@judge.dev', 'hash2', 'judge', 'th2');

    const insertTeam = db.prepare(`
      INSERT INTO teams (id, name, invite_code, lead_user_id)
      VALUES (?, ?, ?, ?)
    `);
    insertTeam.run('t1', 'Team Alpha', 'ALPHA-1', 'u1');

    const insertSubmission = db.prepare(`
      INSERT INTO submissions (id, team_id, title, tagline, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertSubmission.run('sub1', 't1', 'Project 1', 'Tagline 1', 'Description 1');

    const insertEval = db.prepare(`
      INSERT INTO evaluations (
        id, submission_id, judge_id, innovation_score, technical_score,
        impact_score, presentation_score, total_score, feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Score > 10.0 should fail
    expect(() => {
      insertEval.run('ev1', 'sub1', 'j1', 15.0, 9.0, 8.5, 7.5, 95.0, 'Invalid');
    }).toThrow(/CHECK constraint failed/);

    // Negative score should fail
    expect(() => {
      insertEval.run('ev2', 'sub1', 'j1', -2.0, 9.0, 8.5, 7.5, 50.0, 'Invalid');
    }).toThrow(/CHECK constraint failed/);
  });
});
