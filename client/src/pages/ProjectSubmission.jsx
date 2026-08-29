import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import {
  FolderGit2,
  Crown,
  ExternalLink,
  Code2,
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  Users,
  Tag,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function ProjectSubmission({ setActivePage }) {
  const { token, user } = useAuth();
  const { success, error } = useToast();

  const [myTeamData, setMyTeamData] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [track, setTrack] = useState('AI/Healthcare');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  const fetchSubmission = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/submissions/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyTeamData(data);
        if (data.submission) {
          setSubmission(data.submission);
          setTitle(data.submission.title || '');
          setTagline(data.submission.tagline || '');
          setTrack(data.submission.track || data.team?.track || 'AI/Healthcare');
          setDescription(data.submission.description || '');
          setRepoUrl(data.submission.repo_url || '');
          setDemoUrl(data.submission.demo_url || '');
        } else if (data.team?.track) {
          setTrack(data.team.track);
        }
      }
    } catch (err) {
      console.error('Failed to load team submission:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          tagline,
          track,
          description,
          repo_url: repoUrl,
          demo_url: demoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save project submission');

      setSubmission(data.submission);
      success(data.message || 'Project submission saved successfully!');
    } catch (err) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card" style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading project submission status...</p>
      </div>
    );
  }

  // Not in a team state
  if (!myTeamData?.inTeam) {
    return (
      <div className="glass-card" style={{ maxWidth: '640px', margin: '3rem auto', textAlign: 'center', padding: '3rem' }}>
        <Users size={40} color="var(--brand-cyan)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Team Formation Required
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Project submissions are managed per team. You must create or join a team before submitting a project.
        </p>
        <button
          onClick={() => setActivePage('teams')}
          className="btn btn-primary"
          style={{ fontSize: '0.875rem' }}
        >
          Go to Team Finder & Matcher
        </button>
      </div>
    );
  }

  const isLead = myTeamData.isLead;

  return (
    <div style={{ maxWidth: '1000px', margin: '1.5rem auto' }}>
      {/* HEADER */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <FolderGit2 size={24} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Project Submission Portal</h2>
            <span className="badge badge-success">Team: {myTeamData.team.name}</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Submit your team's hackathon project repository, demo, and architecture for judging evaluation.
          </p>
        </div>

        {isLead ? (
          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
            <Crown size={12} /> Team Lead Authorized
          </span>
        ) : (
          <span className="badge badge-subtle" style={{ fontSize: '0.75rem' }}>
            Read-Only (Lead Access Required to Edit)
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* 1. SUBMISSION FORM / EDIT CARD */}
        <section aria-labelledby="submission-form-heading" className="glass-card">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <h3 id="submission-form-heading" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              {submission ? 'Edit Team Submission' : 'Create Project Submission'}
            </h3>
            {submission && (
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                <CheckCircle2 size={12} /> Submitted
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="proj-title" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Project Title *
              </label>
              <input
                id="proj-title"
                type="text"
                required
                disabled={!isLead}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HealthAI Vision"
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
              <label htmlFor="proj-tagline" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Tagline (Elevator Pitch) *
              </label>
              <input
                id="proj-tagline"
                type="text"
                required
                disabled={!isLead}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Edge AI-powered diabetic retinopathy detection in under 30s."
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
              <label htmlFor="proj-track" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Submission Track
              </label>
              <select
                id="proj-track"
                disabled={!isLead}
                value={track}
                onChange={(e) => setTrack(e.target.value)}
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

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="proj-desc" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Project Description & Architecture *
              </label>
              <textarea
                id="proj-desc"
                required
                rows={4}
                disabled={!isLead}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the problem, technical architecture, and impact..."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-sans)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label htmlFor="proj-repo" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Repository URL
                </label>
                <input
                  id="proj-repo"
                  type="url"
                  disabled={!isLead}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
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

              <div>
                <label htmlFor="proj-demo" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Live Demo URL
                </label>
                <input
                  id="proj-demo"
                  type="url"
                  disabled={!isLead}
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://my-demo-app.dev"
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
            </div>

            {isLead ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
              >
                <Save size={16} /> {isSubmitting ? 'Saving Submission...' : submission ? 'Update Project Submission' : 'Submit Project for Evaluation'}
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '0.5rem' }}>
                Only the team lead ({myTeamData.team.lead_user_id === user.id ? 'You' : 'your team lead'}) can save changes.
              </div>
            )}
          </form>
        </section>

        {/* 2. LIVE SUBMISSION PREVIEW CARD */}
        <section aria-labelledby="preview-heading" className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--brand-cyan)" />
              <h3 id="preview-heading" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                Submission Card Preview
              </h3>
            </div>
            <span className="badge badge-success">Track: {track}</span>
          </div>

          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem',
              flex: 1,
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {title || 'Untitled Project'}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--brand-cyan)', fontWeight: 600, marginBottom: '0.75rem' }}>
              {tagline || 'Project tagline will appear here...'}
            </p>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              {description || 'Project description will appear here after typing...'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  <Code2 size={13} /> Source Code
                </a>
              )}
              {demoUrl && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  <Globe size={13} /> Live Demo
                </a>
              )}
            </div>
          </div>

          {submission && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Last saved: {new Date(submission.updated_at || submission.submitted_at).toLocaleString()}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
