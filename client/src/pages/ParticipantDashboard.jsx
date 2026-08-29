import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit3,
  Users,
  Briefcase,
  Sparkles,
  Heart,
  Calendar,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function ParticipantDashboard({ setActivePage }) {
  const { user, token, updateProfile, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [qrData, setQrData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editSkills, setEditSkills] = useState(user?.skills || []);
  const [editRoles, setEditRoles] = useState(user?.preferred_roles || []);
  const [editInterests, setEditInterests] = useState(user?.interests || []);
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch QR Attendee Pass
  const fetchQr = async () => {
    if (!token) return;
    try {
      setIsLoadingQr(true);
      const res = await fetch('/api/users/qr', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
      }
    } catch (err) {
      console.error('Failed to load QR pass:', err);
    } finally {
      setIsLoadingQr(false);
    }
  };

  // Fetch Team Status
  const fetchTeam = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/teams/my-team', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeamData(data);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    }
  };

  useEffect(() => {
    fetchQr();
    fetchTeam();
  }, [token]);

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setEditSkills(user?.skills || []);
    setEditRoles(user?.preferred_roles || []);
    setEditInterests(user?.interests || []);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateProfile({
        name: editName,
        bio: editBio,
        skills: editSkills,
        preferred_roles: editRoles,
        interests: editInterests,
      });
      success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrData.qrDataUrl;
    a.download = `attendee-pass-${user.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    success('QR Attendee Pass downloaded!');
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!editSkills.includes(skillInput.trim())) {
        setEditSkills([...editSkills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const addInterest = (e) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      if (!editInterests.includes(interestInput.trim())) {
        setEditInterests([...editInterests, interestInput.trim()]);
      }
      setInterestInput('');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '1.5rem auto' }}>
      {/* HEADER BAR */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Participant Hub</h2>
            <span className="badge badge-success">Attendee</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Welcome back, {user?.name}. Your credentials and digital check-in pass are ready.
          </p>
        </div>

        <button onClick={handleOpenEdit} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          <Edit3 size={15} /> Edit Profile
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* 1. DIGITAL QR ATTENDANCE PASS */}
        <section aria-labelledby="qr-pass-heading" className="glass-card" style={{ textAlign: 'center' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={18} color="var(--brand-cyan)" />
              <h3 id="qr-pass-heading" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                Digital Attendee Pass
              </h3>
            </div>

            <div
              className={`badge ${user?.checked_in ? 'badge-success' : 'badge-warning'}`}
              role="status"
              aria-live="polite"
            >
              {user?.checked_in ? (
                <>
                  <CheckCircle2 size={13} /> CHECKED IN
                </>
              ) : (
                <>
                  <AlertCircle size={13} /> NOT CHECKED IN
                </>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '1.25rem',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-block',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '1rem',
            }}
          >
            {isLoadingQr ? (
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                }}
              >
                Generating QR...
              </div>
            ) : qrData?.qrDataUrl ? (
              <img
                src={qrData.qrDataUrl}
                alt={`Official attendance QR pass for ${user?.name}`}
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            ) : (
              <div style={{ color: '#ef4444' }}>QR generation unavailable</div>
            )}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {user?.email}
            </div>

            {user?.checked_in && user?.checked_in_at && (
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Calendar size={13} /> Verified at {new Date(user.checked_in_at).toLocaleTimeString()}
              </div>
            )}
          </div>

          <button onClick={handleDownloadQR} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8125rem' }}>
            <Download size={14} /> Download Pass Image
          </button>
        </section>

        {/* 2. PROFILE & TEAM SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* PROFILE SUMMARY CARD */}
          <section aria-labelledby="profile-heading" className="glass-card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShieldCheck size={18} color="var(--brand-primary)" />
              <h3 id="profile-heading" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                Participant Profile
              </h3>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Bio / Project Vision
              </span>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                {user?.bio || 'No bio provided yet. Add your vision to help teammates find you!'}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Skills ({user?.skills?.length || 0})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {user?.skills?.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.55rem',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--brand-primary)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Preferred Roles
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {user?.preferred_roles?.map((r) => (
                  <span
                    key={r}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.55rem',
                      backgroundColor: 'rgba(6, 182, 212, 0.12)',
                      color: 'var(--brand-cyan)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Domain Interests
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {user?.interests?.map((i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.55rem',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      color: 'var(--status-warning)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* TEAM STATUS WIDGET */}
          <section aria-labelledby="team-status-heading" className="glass-card">
            <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="var(--brand-cyan)" />
                <h3 id="team-status-heading" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                  Team Status
                </h3>
              </div>

              {teamData?.inTeam ? (
                <span className="badge badge-success">Assigned</span>
              ) : (
                <span className="badge badge-warning">Unassigned</span>
              )}
            </div>

            {teamData?.inTeam ? (
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {teamData.team.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Track: {teamData.team.track} • {teamData.members.length} Member{teamData.members.length > 1 ? 's' : ''}
                </div>
                <button
                  onClick={() => setActivePage('teams')}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                >
                  View Team Roster & Invite Code <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  You are not currently in a team. Discover compatible teammates using our deterministic Smart Matcher!
                </p>
                <button
                  onClick={() => setActivePage('teams')}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                >
                  <Sparkles size={14} /> Discover & Match Teammates <ArrowRight size={14} />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ACCESSIBLE EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onKeyDown={(e) => e.key === 'Escape' && setIsEditModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <h3 id="modal-edit-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Edit Participant Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close modal"
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-name" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="edit-bio" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>

              {/* SKILLS CHIPS EDITOR */}
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="skill-input" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Skills (Type and press Enter)
                </label>
                <input
                  id="skill-input"
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  placeholder="e.g. Next.js, Rust, Figma (Press Enter)"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {editSkills.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.55rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-full)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setEditSkills(editSkills.filter((x) => x !== s))}
                        aria-label={`Remove ${s}`}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* INTERESTS CHIPS EDITOR */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="interest-input" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Interests (Type and press Enter)
                </label>
                <input
                  id="interest-input"
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={addInterest}
                  placeholder="e.g. AI/ML, ClimateTech (Press Enter)"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {editInterests.map((i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.55rem',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-full)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {i}
                      <button
                        type="button"
                        onClick={() => setEditInterests(editInterests.filter((x) => x !== i))}
                        aria-label={`Remove ${i}`}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn-primary"
                >
                  {isUpdating ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
