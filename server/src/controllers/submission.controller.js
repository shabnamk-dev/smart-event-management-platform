import crypto from 'crypto';
import { getDatabase } from '../db/database.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';

/**
 * Get current participant's team submission.
 */
export function getMySubmission(req, res, next) {
  try {
    const db = getDatabase();

    // Check team membership
    const membership = db
      .prepare(`
        SELECT tm.team_id, t.lead_user_id, t.name as team_name, t.track as team_track,
               (t.lead_user_id = ?) as is_lead
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = ?
      `)
      .get(req.userId, req.userId);

    if (!membership) {
      return res.status(200).json({
        success: true,
        inTeam: false,
        isLead: false,
        team: null,
        submission: null,
      });
    }

    const submission = db.prepare('SELECT * FROM submissions WHERE team_id = ?').get(membership.team_id);

    res.status(200).json({
      success: true,
      inTeam: true,
      isLead: Boolean(membership.is_lead),
      team: {
        id: membership.team_id,
        name: membership.team_name,
        track: membership.team_track,
        lead_user_id: membership.lead_user_id,
      },
      submission: submission || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create or update project submission for current participant's team.
 * Strictly enforces that only the team lead can submit / edit.
 */
export function createOrUpdateSubmission(req, res, next) {
  try {
    const { title, tagline, description, repo_url, demo_url, track } = req.body;
    const db = getDatabase();

    // Verify team membership & leadership
    const membership = db
      .prepare(`
        SELECT tm.team_id, t.lead_user_id, t.name as team_name
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = ?
      `)
      .get(req.userId);

    if (!membership) {
      throw new BadRequestError('You must be a member of a team to submit a project.');
    }

    if (membership.lead_user_id !== req.userId) {
      throw new ForbiddenError('Only the team lead has permission to create or update project submissions.');
    }

    const existingSubmission = db
      .prepare('SELECT id FROM submissions WHERE team_id = ?')
      .get(membership.team_id);

    let submissionId;
    let isNew = false;

    if (existingSubmission) {
      submissionId = existingSubmission.id;
      db.prepare(`
        UPDATE submissions
        SET
          title = ?,
          tagline = ?,
          description = ?,
          repo_url = ?,
          demo_url = ?,
          track = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE team_id = ?
      `).run(
        title.trim(),
        tagline.trim(),
        description.trim(),
        repo_url ? repo_url.trim() : '',
        demo_url ? demo_url.trim() : '',
        track ? track.trim() : 'General',
        membership.team_id
      );
    } else {
      isNew = true;
      submissionId = `sub_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO submissions (
          id, team_id, title, tagline, description, repo_url, demo_url, track,
          submitted_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).run(
        submissionId,
        membership.team_id,
        title.trim(),
        tagline.trim(),
        description.trim(),
        repo_url ? repo_url.trim() : '',
        demo_url ? demo_url.trim() : '',
        track ? track.trim() : 'General'
      );
    }

    const savedSubmission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Project submitted successfully!' : 'Project submission updated successfully!',
      submission: savedSubmission,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List all project submissions with team names and tracks.
 */
export function getAllSubmissions(req, res, next) {
  try {
    const db = getDatabase();

    const submissions = db
      .prepare(`
        SELECT s.*, t.name as team_name, u.name as lead_name
        FROM submissions s
        JOIN teams t ON s.team_id = t.id
        JOIN users u ON t.lead_user_id = u.id
        ORDER BY s.submitted_at DESC
      `)
      .all();

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (err) {
    next(err);
  }
}
