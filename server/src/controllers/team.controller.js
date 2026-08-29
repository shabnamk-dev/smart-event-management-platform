import crypto from 'crypto';
import { getDatabase } from '../db/database.js';
import { calculateUserMatch } from '../services/matching.service.js';
import { sanitizeUser } from '../utils/sanitize.js';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Discover and recommend compatible teammates for the current participant.
 * Excludes the current user, non-participants, and users already in teams.
 */
export function getRecommendations(req, res, next) {
  try {
    const db = getDatabase();

    // Fetch current user
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // Fetch available participants not in any team
    const candidates = db
      .prepare(`
        SELECT id, name, skills, preferred_roles, interests, bio
        FROM users
        WHERE role = 'participant'
          AND id != ?
          AND id NOT IN (SELECT user_id FROM team_members)
      `)
      .all(req.userId);

    // Run deterministic matching algorithm on each candidate
    const recommendations = candidates.map((candidate) => {
      const match = calculateUserMatch(currentUser, candidate);
      return {
        id: candidate.id,
        name: candidate.name,
        skills: typeof candidate.skills === 'string' ? JSON.parse(candidate.skills || '[]') : candidate.skills,
        preferred_roles:
          typeof candidate.preferred_roles === 'string'
            ? JSON.parse(candidate.preferred_roles || '[]')
            : candidate.preferred_roles,
        interests:
          typeof candidate.interests === 'string' ? JSON.parse(candidate.interests || '[]') : candidate.interests,
        bio: candidate.bio,
        matchScore: match.score,
        matchFactors: match.factors,
        matchReasons: match.reasons,
      };
    });

    // Sort by compatibility score descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new team and make the creator the initial team lead.
 */
export function createTeam(req, res, next) {
  try {
    const { name, track } = req.body;
    const db = getDatabase();

    // Check if current user is already in a team
    const existingMembership = db.prepare('SELECT team_id FROM team_members WHERE user_id = ?').get(req.userId);
    if (existingMembership) {
      throw new ConflictError('You are already a member of a team. Please leave your current team first.');
    }

    // Check if team name is taken (case-insensitive)
    const existingTeam = db.prepare('SELECT id FROM teams WHERE name = ? COLLATE NOCASE').get(name.trim());
    if (existingTeam) {
      throw new ConflictError('A team with this name already exists. Please choose a different name.');
    }

    const teamId = `team_${crypto.randomUUID()}`;
    const inviteCode = `TEAM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const memberId = `tm_${crypto.randomUUID()}`;

    // Execute atomic transaction for team creation and lead membership
    const createTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO teams (id, name, invite_code, lead_user_id, track)
        VALUES (?, ?, ?, ?, ?)
      `).run(teamId, name.trim(), inviteCode, req.userId, track ? track.trim() : 'General');

      db.prepare(`
        INSERT INTO team_members (id, team_id, user_id)
        VALUES (?, ?, ?)
      `).run(memberId, teamId, req.userId);
    });

    createTx();

    const createdTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: createdTeam,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Join an existing team using a valid invite code.
 */
export function joinTeam(req, res, next) {
  try {
    const { inviteCode } = req.body;
    const db = getDatabase();

    // Check if user is already in a team
    const existingMembership = db.prepare('SELECT team_id FROM team_members WHERE user_id = ?').get(req.userId);
    if (existingMembership) {
      throw new ConflictError('You are already a member of a team. Please leave your current team first.');
    }

    // Lookup team by invite code
    const team = db.prepare('SELECT * FROM teams WHERE invite_code = ?').get(inviteCode.trim().toUpperCase());
    if (!team) {
      throw new NotFoundError('Invalid invite code. Team not found.');
    }

    // Atomic transaction for capacity verification and member addition
    const joinTx = db.transaction(() => {
      const countRow = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(team.id);
      if (countRow.count >= 4) {
        throw new ConflictError('This team is already at maximum capacity (4 members).');
      }

      const memberId = `tm_${crypto.randomUUID()}`;
      db.prepare('INSERT INTO team_members (id, team_id, user_id) VALUES (?, ?, ?)').run(memberId, team.id, req.userId);
    });

    joinTx();

    res.status(200).json({
      success: true,
      message: `Successfully joined ${team.name}`,
      team,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Leave current team.
 * If team lead leaves:
 * - If other members remain: Promotes next oldest member to lead.
 * - If no other members remain: Dissolves the team.
 */
export function leaveTeam(req, res, next) {
  try {
    const db = getDatabase();

    const membership = db
      .prepare(`
        SELECT tm.id as member_id, tm.team_id, t.lead_user_id, t.name as team_name
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = ?
      `)
      .get(req.userId);

    if (!membership) {
      throw new BadRequestError('You are not currently in any team.');
    }

    const leaveTx = db.transaction(() => {
      // Find other members
      const otherMembers = db
        .prepare('SELECT user_id FROM team_members WHERE team_id = ? AND user_id != ? ORDER BY joined_at ASC')
        .all(membership.team_id, req.userId);

      if (membership.lead_user_id === req.userId) {
        if (otherMembers.length > 0) {
          // Promote next member to lead
          db.prepare('UPDATE teams SET lead_user_id = ? WHERE id = ?').run(
            otherMembers[0].user_id,
            membership.team_id
          );
        } else {
          // Dissolve team if no other members remain
          db.prepare('DELETE FROM teams WHERE id = ?').run(membership.team_id);
        }
      }

      // Remove member
      db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(membership.team_id, req.userId);
    });

    leaveTx();

    res.status(200).json({
      success: true,
      message: 'Successfully left the team',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve current participant's active team details, members, and project submission status.
 */
export function getMyTeam(req, res, next) {
  try {
    const db = getDatabase();

    const team = db
      .prepare(`
        SELECT t.*, u.name as lead_name, u.email as lead_email
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        JOIN users u ON t.lead_user_id = u.id
        WHERE tm.user_id = ?
      `)
      .get(req.userId);

    if (!team) {
      return res.status(200).json({
        success: true,
        inTeam: false,
        team: null,
        members: [],
      });
    }

    // Fetch all members with their profile metadata
    const rawMembers = db
      .prepare(`
        SELECT u.id, u.name, u.email, u.skills, u.preferred_roles, u.interests, u.bio,
               tm.joined_at, (u.id = ?) as is_lead
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ?
        ORDER BY tm.joined_at ASC
      `)
      .all(team.lead_user_id, team.id);

    const members = rawMembers.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      skills: typeof m.skills === 'string' ? JSON.parse(m.skills || '[]') : m.skills,
      preferred_roles:
        typeof m.preferred_roles === 'string' ? JSON.parse(m.preferred_roles || '[]') : m.preferred_roles,
      interests: typeof m.interests === 'string' ? JSON.parse(m.interests || '[]') : m.interests,
      bio: m.bio,
      joined_at: m.joined_at,
      is_lead: Boolean(m.is_lead),
    }));

    // Fetch project submission if exists
    const submission = db
      .prepare('SELECT id, title, tagline, demo_url, repo_url, track, submitted_at FROM submissions WHERE team_id = ?')
      .get(team.id);

    res.status(200).json({
      success: true,
      inTeam: true,
      team,
      members,
      isLead: team.lead_user_id === req.userId,
      submission: submission || null,
    });
  } catch (err) {
    next(err);
  }
}
