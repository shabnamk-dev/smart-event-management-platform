import crypto from 'crypto';
import { getDatabase } from '../db/database.js';
import { calculateEvaluationScore } from '../services/scoring.service.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

/**
 * Get judging overview statistics for the authenticated judge.
 */
export function getStats(req, res, next) {
  try {
    const db = getDatabase();

    const totalRow = db.prepare('SELECT COUNT(*) as count FROM submissions').get();
    const totalSubmissions = totalRow.count;

    const evaluatedRow = db
      .prepare('SELECT COUNT(*) as count FROM evaluations WHERE judge_id = ?')
      .get(req.userId);
    const evaluatedCount = evaluatedRow.count;

    const pendingCount = Math.max(0, totalSubmissions - evaluatedCount);

    const avgRow = db
      .prepare('SELECT AVG(total_score) as avg_score FROM evaluations WHERE judge_id = ?')
      .get(req.userId);
    const averageScoreGiven = avgRow.avg_score ? Math.round(avgRow.avg_score * 10) / 10 : null;

    res.status(200).json({
      success: true,
      stats: {
        totalSubmissions,
        evaluatedCount,
        pendingCount,
        averageScoreGiven,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all project submissions with the current judge's evaluation status.
 */
export function getSubmissions(req, res, next) {
  try {
    const { status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT
        s.id, s.title, s.tagline, s.description, s.repo_url, s.demo_url, s.track, s.submitted_at,
        t.id as team_id, t.name as team_name,
        e.id as evaluation_id, e.innovation_score, e.technical_score, e.impact_score,
        e.presentation_score, e.total_score, e.feedback, e.created_at as evaluation_created_at,
        (e.id IS NOT NULL) as has_evaluated
      FROM submissions s
      JOIN teams t ON s.team_id = t.id
      LEFT JOIN evaluations e ON s.id = e.submission_id AND e.judge_id = ?
    `;

    const params = [req.userId];

    if (status === 'evaluated') {
      query += ` WHERE e.id IS NOT NULL`;
    } else if (status === 'pending') {
      query += ` WHERE e.id IS NULL`;
    }

    query += ` ORDER BY s.submitted_at ASC`;

    const rawRows = db.prepare(query).all(...params);

    const submissions = rawRows.map((r) => ({
      id: r.id,
      title: r.title,
      tagline: r.tagline,
      description: r.description,
      repo_url: r.repo_url,
      demo_url: r.demo_url,
      track: r.track,
      submitted_at: r.submitted_at,
      team_name: r.team_name,
      team_id: r.team_id,
      has_evaluated: Boolean(r.has_evaluated),
      evaluation: r.evaluation_id
        ? {
            id: r.evaluation_id,
            innovation_score: r.innovation_score,
            technical_score: r.technical_score,
            impact_score: r.impact_score,
            presentation_score: r.presentation_score,
            total_score: r.total_score,
            feedback: r.feedback,
            created_at: r.evaluation_created_at,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get details of a single submission for evaluation.
 */
export function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const submission = db
      .prepare(`
        SELECT s.*, t.name as team_name, t.track as team_track
        FROM submissions s
        JOIN teams t ON s.team_id = t.id
        WHERE s.id = ?
      `)
      .get(id);

    if (!submission) {
      throw new NotFoundError(`Submission with ID ${id} not found`);
    }

    // Fetch safe team members
    const rawMembers = db
      .prepare(`
        SELECT u.id, u.name, u.role, u.skills, u.preferred_roles
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ?
      `)
      .all(submission.team_id);

    const members = rawMembers.map((m) => ({
      id: m.id,
      name: m.name,
      skills: typeof m.skills === 'string' ? JSON.parse(m.skills || '[]') : m.skills,
      preferred_roles:
        typeof m.preferred_roles === 'string' ? JSON.parse(m.preferred_roles || '[]') : m.preferred_roles,
    }));

    // Fetch current judge's evaluation if exists
    const evaluation = db
      .prepare('SELECT * FROM evaluations WHERE submission_id = ? AND judge_id = ?')
      .get(id, req.userId);

    res.status(200).json({
      success: true,
      submission,
      members,
      has_evaluated: Boolean(evaluation),
      evaluation: evaluation || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit or update an evaluation for a submission.
 * Server calculates total score using 4-pillar rubric.
 */
export function submitEvaluation(req, res, next) {
  try {
    const {
      submission_id,
      innovation_score,
      technical_score,
      impact_score,
      presentation_score,
      feedback,
    } = req.body;

    const db = getDatabase();

    // Verify submission exists
    const submission = db.prepare('SELECT id, title FROM submissions WHERE id = ?').get(submission_id);
    if (!submission) {
      throw new NotFoundError(`Submission with ID ${submission_id} does not exist.`);
    }

    // Calculate total score server-side (0 - 100)
    const totalScore = calculateEvaluationScore({
      innovation: innovation_score,
      technical: technical_score,
      impact: impact_score,
      presentation: presentation_score,
    });

    const existingEval = db
      .prepare('SELECT id FROM evaluations WHERE submission_id = ? AND judge_id = ?')
      .get(submission_id, req.userId);

    let evalId;
    let isNew = false;

    if (existingEval) {
      evalId = existingEval.id;
      db.prepare(`
        UPDATE evaluations
        SET
          innovation_score = ?,
          technical_score = ?,
          impact_score = ?,
          presentation_score = ?,
          total_score = ?,
          feedback = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        innovation_score,
        technical_score,
        impact_score,
        presentation_score,
        totalScore,
        feedback ? feedback.trim() : '',
        evalId
      );
    } else {
      isNew = true;
      evalId = `eval_${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO evaluations (
          id, submission_id, judge_id, innovation_score, technical_score,
          impact_score, presentation_score, total_score, feedback, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).run(
        evalId,
        submission_id,
        req.userId,
        innovation_score,
        technical_score,
        impact_score,
        presentation_score,
        totalScore,
        feedback ? feedback.trim() : ''
      );
    }

    const savedEval = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evalId);

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew
        ? `Evaluation for "${submission.title}" recorded with score ${totalScore}/100.`
        : `Evaluation for "${submission.title}" updated successfully.`,
      evaluation: savedEval,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an evaluation by evaluation ID.
 * Strictly verifies that the authenticated judge is the evaluation owner.
 */
export function updateEvaluation(req, res, next) {
  try {
    const { id } = req.params;
    const {
      innovation_score,
      technical_score,
      impact_score,
      presentation_score,
      feedback,
    } = req.body;

    const db = getDatabase();

    const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id);
    if (!evaluation) {
      throw new NotFoundError(`Evaluation with ID ${id} not found.`);
    }

    if (evaluation.judge_id !== req.userId) {
      throw new ForbiddenError('You can only modify evaluations that you authored.');
    }

    const totalScore = calculateEvaluationScore({
      innovation: innovation_score,
      technical: technical_score,
      impact: impact_score,
      presentation: presentation_score,
    });

    db.prepare(`
      UPDATE evaluations
      SET
        innovation_score = ?,
        technical_score = ?,
        impact_score = ?,
        presentation_score = ?,
        total_score = ?,
        feedback = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      innovation_score,
      technical_score,
      impact_score,
      presentation_score,
      totalScore,
      feedback ? feedback.trim() : '',
      id
    );

    const updated = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id);

    res.status(200).json({
      success: true,
      message: 'Evaluation updated successfully.',
      evaluation: updated,
    });
  } catch (err) {
    next(err);
  }
}
