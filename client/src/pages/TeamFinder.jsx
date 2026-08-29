import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import {
  Users,
  Sparkles,
  Plus,
  UserPlus,
  Copy,
  Check,
  LogOut,
  Crown,
  Search,
  Shield,
  Tag,
  ArrowRight,
} from 'lucide-react';

export default function TeamFinder({ setActivePage }) {
  const { user, token } = useAuth();
  const { success, error } = useToast();

  const [teamData, setTeamData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTrack, setNewTeamTrack] = useState('AI/Healthcare');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchTeamAndRecommendations = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Fetch My Team
      const teamRes = await fetch('/api/teams/my-team', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (teamRes.ok) {
        const tData = await teamRes.json();
        setTeamData(tData);
      }

      // Fetch Recommendations
      const recRes = await fetch('/api/teams/recommendations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (recRes.ok) {
        const rData = await recRes.json();
        setRecommendations(rData.recommendations || []);
      }
    } catch (err) {
      console.error('Error loading team data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAndRecommendations();
  }, [token]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTeamName, track: newTeamTrack }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create team');

      success(`Team "${data.team.name}" created successfully!`);
      setNewTeamName('');
      fetchTeamAndRecommendations();
    } catch (err) {
      error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setIsJoining(true);
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCodeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join team');

      success(`Joined team "${data.team.name}" successfully!`);
      setInviteCodeInput('');
      fetchTeamAndRecommendations();
    } catch (err) {
      error(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave your team?')) return;
    try {
      const res = await fetch('/api/teams/leave', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to leave team');

      success('You have left the team.');
      fetchTeamAndRecommendations();
    } catch (err) {
      error(err.message);
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    success('Invite code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const filteredRecommendations = recommendations.filter((r) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.skills.some((s) => s.toLowerCase().includes(q)) ||
      r.interests.some((i) => i.toLowerCase().includes(q)) ||
      r.preferred_roles.some((pr) => pr.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: '1180px', margin: '1.5rem auto' }}>
      {/* TITLE BAR */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Smart Team Formation</h2>
            <span className="badge badge-success">Deterministic Matcher</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Find compatible teammates based on complementary skills, roles, and shared project interests.
          </p>
        </div>
      </div>

      {/* 1. CURRENT TEAM SECTION */}
      {teamData?.inTeam ? (
        <section aria-labelledby="active-team-heading" className="glass-card" style={{ marginBottom: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Users size={22} color="var(--brand-cyan)" />
                <h3 id="active-team-heading" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {teamData.team.name}
                </h3>
                <span className="badge badge-success">Track: {teamData.team.track}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                }}
              >
                <span>Invite: <strong>{teamData.team.invite_code}</strong></span>
                <button
                  type="button"
                  onClick={() => copyInviteCode(teamData.team.invite_code)}
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                  title="Copy Invite Code"
                >
                  {copiedCode ? <Check size={12} color="var(--status-success)" /> : <Copy size={12} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleLeaveTeam}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', color: 'var(--status-danger)' }}
              >
                <LogOut size={14} /> Leave Team
              </button>
            </div>
          </div>

          {/* TEAM MEMBERS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {teamData.members.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{m.name}</div>
                  {m.is_lead && (
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                      <Crown size={11} /> Lead
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {m.preferred_roles.join(', ') || 'Participant'}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {m.skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* CREATE OR JOIN TEAM ACTION BOXES */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* CREATE TEAM */}
          <section aria-labelledby="create-team-heading" className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Plus size={20} color="var(--brand-cyan)" />
              <h3 id="create-team-heading" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                Create a New Team
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Form a team and invite collaborators using your unique team invite code.
            </p>

            <form onSubmit={handleCreateTeam}>
              <div style={{ marginBottom: '0.85rem' }}>
                <label htmlFor="team-name" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Team Name *
                </label>
                <input
                  id="team-name"
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. CyberPulse AI"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="team-track" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Focus Track
                </label>
                <select
                  id="team-track"
                  value={newTeamTrack}
                  onChange={(e) => setNewTeamTrack(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="AI/Healthcare">AI / Healthcare</option>
                  <option value="FinTech/Web3">FinTech / Web3</option>
                  <option value="Sustainability/IoT">Sustainability / IoT</option>
                  <option value="Open Innovation">Open Innovation</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.875rem' }}
              >
                {isCreating ? 'Creating Team...' : 'Create Team & Generate Invite'}
              </button>
            </form>
          </section>

          {/* JOIN TEAM */}
          <section aria-labelledby="join-team-heading" className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <UserPlus size={20} color="var(--brand-primary)" />
              <h3 id="join-team-heading" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                Join with Invite Code
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Got an invite code from a team lead? Enter it below to join their roster.
            </p>

            <form onSubmit={handleJoinTeam}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="invite-code" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Team Invite Code *
                </label>
                <input
                  id="invite-code"
                  type="text"
                  required
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. NV-9941"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9375rem',
                    letterSpacing: '0.05em',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.875rem', marginTop: '1.5rem' }}
              >
                {isJoining ? 'Verifying Code...' : 'Join Team'}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* 2. SMART TEAMMATE RECOMMENDATIONS */}
      <section aria-labelledby="recommendations-heading">
        <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 id="recommendations-heading" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Available Teammate Recommendations
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Deterministic compatibility calculated across interests (40%), complementary skills (35%), and role diversity (25%).
            </p>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by skill, role, or interest..."
              aria-label="Search recommended teammates"
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem 0.5rem 2.2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Calculating teammate compatibility scores...</p>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              No Available Unassigned Participants Found
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              {searchTerm
                ? 'No participants match your filter. Try clearing your search keyword.'
                : 'All participants are currently assigned to teams or there are no other registered attendees yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {filteredRecommendations.map((rec) => (
              <div key={rec.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* HEADER & MATCH PERCENTAGE */}
                <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{rec.name}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {rec.preferred_roles.join(' • ') || 'Participant'}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor:
                        rec.matchScore >= 70
                          ? 'rgba(16, 185, 129, 0.15)'
                          : rec.matchScore >= 50
                          ? 'rgba(6, 182, 212, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        rec.matchScore >= 70
                          ? 'var(--status-success)'
                          : rec.matchScore >= 50
                          ? 'var(--brand-cyan)'
                          : 'var(--status-warning)',
                      border: `1px solid ${
                        rec.matchScore >= 70
                          ? 'var(--status-success-border)'
                          : rec.matchScore >= 50
                          ? 'rgba(6, 182, 212, 0.3)'
                          : 'var(--status-warning-border)'
                      }`,
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <Sparkles size={13} /> {rec.matchScore}% MATCH
                  </div>
                </div>

                {rec.bio && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    "{rec.bio}"
                  </p>
                )}

                {/* EXPLAINABLE MATCH REASONS */}
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Why this match:
                  </span>
                  <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: 'var(--brand-cyan)', lineHeight: 1.4 }}>
                    {rec.matchReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {/* SKILLS CHIPS */}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Skills & Domains:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {rec.skills.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(99, 102, 241, 0.12)',
                          color: 'var(--brand-primary)',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {rec.interests.map((i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          color: 'var(--status-warning)',
                        }}
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
