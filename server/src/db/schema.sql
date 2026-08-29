-- ==============================================================================
-- SMART EVENT MANAGEMENT PLATFORM - SQLITE RELATIONAL SCHEMA
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('participant', 'judge', 'organizer')),
    skills TEXT NOT NULL DEFAULT '[]',          -- Stored as JSON array string
    preferred_roles TEXT NOT NULL DEFAULT '[]', -- Stored as JSON array string
    interests TEXT NOT NULL DEFAULT '[]',       -- Stored as JSON array string
    bio TEXT NOT NULL DEFAULT '',
    attendance_token_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of random high-entropy token
    checked_in INTEGER NOT NULL DEFAULT 0 CHECK (checked_in IN (0, 1)),
    checked_in_at DATETIME NULL,
    is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    lead_user_id TEXT NOT NULL,
    track TEXT NOT NULL DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 3. TEAM MEMBERS TABLE (Strictly enforces 1 team per participant)
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    user_id TEXT UNIQUE NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. SUBMISSIONS TABLE (Strictly enforces 1 submission per team)
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    team_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    demo_url TEXT NOT NULL DEFAULT '',
    repo_url TEXT NOT NULL DEFAULT '',
    track TEXT NOT NULL DEFAULT 'General',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 5. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('normal', 'important', 'urgent')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 6. RUBRIC EVALUATIONS TABLE (Enforces 1 evaluation per judge per submission)
CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    judge_id TEXT NOT NULL,
    innovation_score REAL NOT NULL CHECK (innovation_score >= 0.0 AND innovation_score <= 10.0),
    technical_score REAL NOT NULL CHECK (technical_score >= 0.0 AND technical_score <= 10.0),
    impact_score REAL NOT NULL CHECK (impact_score >= 0.0 AND impact_score <= 10.0),
    presentation_score REAL NOT NULL CHECK (presentation_score >= 0.0 AND presentation_score <= 10.0),
    total_score REAL NOT NULL CHECK (total_score >= 0.0 AND total_score <= 100.0),
    feedback TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, judge_id),
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (judge_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- INDEXES FOR HIGH-EFFICIENCY RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_attendance_token ON users(attendance_token_hash);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_submission ON evaluations(submission_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_judge ON evaluations(judge_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
