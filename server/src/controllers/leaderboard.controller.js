import { getDatabase } from '../db/database.js';

/**
 * Get dynamic leaderboard calculated directly from SQLite evaluations.
 * Supports track filtering and orders by average score descending.
 */
export function getLeaderboard(req, res, next) {
  try {
    const { track } = req.query;
    const db = getDatabase();

    let query = `
      SELECT
        s.id as submission_id,
        s.title,
        s.tagline,
        s.description,
        s.track,
        s.demo_url,
        s.repo_url,
        s.submitted_at,
        t.id as team_id,
        t.name as team_name,
        COUNT(e.id) as evaluation_count,
        ROUND(AVG(e.total_score), 1) as average_score,
        ROUND(AVG(e.innovation_score), 1) as avg_innovation,
        ROUND(AVG(e.technical_score), 1) as avg_technical,
        ROUND(AVG(e.impact_score), 1) as avg_impact,
        ROUND(AVG(e.presentation_score), 1) as avg_presentation
      FROM submissions s
      JOIN teams t ON s.team_id = t.id
      LEFT JOIN evaluations e ON s.id = e.submission_id
    `;

    const params = [];

    if (track && track.trim()) {
      query += ` WHERE s.track = ?`;
      params.push(track.trim());
    }

    query += `
      GROUP BY s.id
      ORDER BY
        (average_score IS NOT NULL) DESC,
        average_score DESC,
        evaluation_count DESC,
        s.submitted_at ASC
    `;

    const rawRows = db.prepare(query).all(...params);

    // Assign standard ranking (1, 2, 3...)
    const leaderboard = rawRows.map((row, index) => ({
      rank: index + 1,
      submission_id: row.submission_id,
      title: row.title,
      tagline: row.tagline,
      description: row.description,
      track: row.track,
      demo_url: row.demo_url,
      repo_url: row.repo_url,
      submitted_at: row.submitted_at,
      team_name: row.team_name,
      team_id: row.team_id,
      evaluation_count: row.evaluation_count,
      average_score: row.average_score !== null ? row.average_score : 0,
      has_evaluations: row.evaluation_count > 0,
      breakdown: {
        innovation: row.avg_innovation !== null ? row.avg_innovation : 0,
        technical: row.avg_technical !== null ? row.avg_technical : 0,
        impact: row.avg_impact !== null ? row.avg_impact : 0,
        presentation: row.avg_presentation !== null ? row.avg_presentation : 0,
      },
    }));

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      leaderboard,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
