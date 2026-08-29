import { getDatabase } from '../db/database.js';
import { hashAttendanceToken } from '../utils/qr.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Scan & verify participant QR attendance token.
 * Performs atomic server-side check-in and prevents duplicate verification.
 */
export function checkIn(req, res, next) {
  try {
    const { token } = req.body;
    const db = getDatabase();

    const tokenHash = hashAttendanceToken(token.trim());
    const user = db.prepare('SELECT * FROM users WHERE attendance_token_hash = ?').get(tokenHash);

    if (!user) {
      throw new NotFoundError('Invalid or unrecognized attendance token. Attendee not found.');
    }

    if (user.checked_in === 1) {
      const checkInTime = user.checked_in_at ? new Date(user.checked_in_at).toLocaleTimeString() : 'earlier';
      throw new ConflictError(
        `Duplicate Check-in Alert: Participant "${user.name}" was already checked in at ${checkInTime}.`
      );
    }

    // Atomic update transaction
    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE users
        SET checked_in = 1, checked_in_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(user.id);
    });

    updateTx();

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

    res.status(200).json({
      success: true,
      message: `Participant "${user.name}" successfully checked in!`,
      attendee: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        checked_in: true,
        checked_in_at: updatedUser.checked_in_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all participants with search filtering and team membership status.
 */
export function getAttendees(req, res, next) {
  try {
    const { search, status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT
        u.id, u.name, u.email, u.role, u.skills, u.preferred_roles,
        u.interests, u.checked_in, u.checked_in_at, t.name as team_name
      FROM users u
      LEFT JOIN team_members tm ON u.id = tm.user_id
      LEFT JOIN teams t ON tm.team_id = t.id
      WHERE u.role = 'participant'
    `;

    const params = [];

    if (status === 'checked_in') {
      query += ` AND u.checked_in = 1`;
    } else if (status === 'pending') {
      query += ` AND u.checked_in = 0`;
    }

    if (search && search.trim()) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR t.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY u.checked_in DESC, u.name ASC`;

    const rawRows = db.prepare(query).all(...params);

    const attendees = rawRows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      skills: typeof r.skills === 'string' ? JSON.parse(r.skills || '[]') : r.skills,
      preferred_roles:
        typeof r.preferred_roles === 'string' ? JSON.parse(r.preferred_roles || '[]') : r.preferred_roles,
      interests: typeof r.interests === 'string' ? JSON.parse(r.interests || '[]') : r.interests,
      checked_in: Boolean(r.checked_in),
      checked_in_at: r.checked_in_at,
      team_name: r.team_name || null,
    }));

    res.status(200).json({
      success: true,
      count: attendees.length,
      attendees,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get real-time event analytics directly from SQLite state.
 */
export function getAnalytics(req, res, next) {
  try {
    const db = getDatabase();

    const totalParticipants = db
      .prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'participant'`)
      .get().count;

    const checkedInParticipants = db
      .prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'participant' AND checked_in = 1`)
      .get().count;

    const teamsFormed = db.prepare(`SELECT COUNT(*) as count FROM teams`).get().count;

    const unassignedParticipants = db
      .prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE role = 'participant'
          AND id NOT IN (SELECT user_id FROM team_members)
      `)
      .get().count;

    const projectsSubmitted = db.prepare(`SELECT COUNT(*) as count FROM submissions`).get().count;

    const judgedProjects = db
      .prepare(`SELECT COUNT(DISTINCT submission_id) as count FROM evaluations`)
      .get().count;

    const totalEvaluations = db.prepare(`SELECT COUNT(*) as count FROM evaluations`).get().count;

    const avgScoreRow = db.prepare(`SELECT AVG(total_score) as avg_score FROM evaluations`).get();
    const averageScore = avgScoreRow.avg_score ? Math.round(avgScoreRow.avg_score * 10) / 10 : 0;

    const checkInPercentage =
      totalParticipants > 0 ? Math.round((checkedInParticipants / totalParticipants) * 100) : 0;

    const judgingProgress =
      projectsSubmitted > 0 ? Math.round((judgedProjects / projectsSubmitted) * 100) : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalParticipants,
        checkedInParticipants,
        checkInPercentage,
        teamsFormed,
        unassignedParticipants,
        projectsSubmitted,
        judgedProjects,
        totalEvaluations,
        judgingProgress,
        averageScore,
      },
    });
  } catch (err) {
    next(err);
  }
}
