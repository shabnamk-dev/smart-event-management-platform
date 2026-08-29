import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Clock,
  Sparkles,
  ExternalLink,
  Code2,
  Globe,
  Sliders,
  Users,
  Search,
} from 'lucide-react';

const RUBRIC_WEIGHTS = {
  innovation: 0.25,
  technical: 0.35,
  impact: 0.25,
  presentation: 0.15,
};

export default function JudgeDashboard() {
  const { token, user } = useAuth();
  const { success, error } = useToast();

  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rubric Form State
  const [innovation, setInnovation] = useState(8.0);
  const [technical, setTechnical] = useState(8.0);
  const [impact, setImpact] = useState(8.0);
  const [presentation, setPresentation] = useState(8.0);
  const [feedback, setFeedback] = useState('');

  // Fetch Judge Stats & Submissions
  const fetchData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);

      // 1. Stats
      const sRes = await fetch('/api/judge/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setStats(sData.stats);
      }

      // 2. Submissions
      const subRes = await fetch('/api/judge/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData.submissions || []);

        // Auto-select first submission if none selected
        if (!selectedSubmission && subData.submissions?.length > 0) {
          selectSubmission(subData.submissions[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load judge data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSubmission = async (subId) => {
    try {
      const res = await fetch(`/api/judge/submissions/${subId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedSubmission(subId);
        setSubmissionDetails(data);

        // Pre-fill form if judge has evaluated
        if (data.evaluation) {
          setInnovation(data.evaluation.innovation_score);
          setTechnical(data.evaluation.technical_score);
          setImpact(data.evaluation.impact_score);
          setPresentation(data.evaluation.presentation_score);
          setFeedback(data.evaluation.feedback || '');
        } else {
          setInnovation(8.0);
          setTechnical(8.0);
          setImpact(8.0);
          setPresentation(8.0);
          setFeedback('');
        }
      }
    } catch (err) {
      console.error('Failed to load submission details:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Calculated live preview score (0 - 100)
  const liveCalculatedScore = Math.round(
    (innovation * RUBRIC_WEIGHTS.innovation +
      technical * RUBRIC_WEIGHTS.technical +
      impact * RUBRIC_WEIGHTS.impact +
      presentation * RUBRIC_WEIGHTS.presentation) *
      10 *
      100
  ) / 100;

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/judge/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submission_id: selectedSubmission,
          innovation_score: Number(innovation),
          technical_score: Number(technical),
          impact_score: Number(impact),
          presentation_score: Number(presentation),
          feedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit evaluation');

      success(data.message || 'Evaluation recorded successfully!');
      // Refresh list & stats
      fetchData();
      selectSubmission(selectedSubmission);
    } catch (err) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter === 'evaluated' && !s.has_evaluated) return false;
    if (statusFilter === 'pending' && s.has_evaluated) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.team_name.toLowerCase().includes(q) ||
        s.track.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '1.5rem auto' }}>
      {/* HEADER */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Award size={24} color="var(--status-warning)" />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Interactive Judging Portal</h2>
            <span className="badge badge-warning">Official Judge</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Welcome, {user?.name}. Evaluate projects across the 4-pillar weighted rubric.
          </p>
        </div>
      </div>

      {/* 1. STATS OVERVIEW CARDS */}
      <section aria-labelledby="stats-heading" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Submissions
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {stats?.totalSubmissions ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Available for evaluation</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Evaluated by You
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-success)', marginTop: '0.25rem' }}>
              {stats?.evaluatedCount ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed evaluations</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Pending Your Review
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-warning)', marginTop: '0.25rem' }}>
              {stats?.pendingCount ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Remaining submissions</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Your Average Score
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-cyan)', marginTop: '0.25rem' }}>
              {stats?.averageScoreGiven ? `${stats.averageScoreGiven} / 100` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across all reviewed projects</div>
          </div>
        </div>
      </section>

      {/* 2. MAIN SPLIT VIEW: SUBMISSION LIST & RUBRIC SCORING TERMINAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(480px, 1.4fr)', gap: '1.5rem' }}>
        {/* LEFT COLUMN: SUBMISSION SELECTOR */}
        <section aria-labelledby="sub-list-heading" className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 id="sub-list-heading" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              Submissions ({submissions.length})
            </h3>

            {/* STATUS FILTER */}
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-base)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  background: statusFilter === 'all' ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: 'none',
                  color: statusFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                style={{
                  background: statusFilter === 'pending' ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: 'none',
                  color: statusFilter === 'pending' ? 'var(--status-warning)' : 'var(--text-muted)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('evaluated')}
                style={{
                  background: statusFilter === 'evaluated' ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: 'none',
                  color: statusFilter === 'evaluated' ? 'var(--status-success)' : 'var(--text-muted)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Evaluated
              </button>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search
              size={14}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title, team, or track..."
              aria-label="Filter submissions"
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
              }}
            />
          </div>

          {/* SUBMISSION CARDS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '580px' }}>
            {filteredSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No submissions match your filter.
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const isSelected = selectedSubmission === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => selectSubmission(sub.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && selectSubmission(sub.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                      border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {sub.title}
                      </div>
                      {sub.has_evaluated ? (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                          <CheckCircle2 size={11} /> {sub.evaluation?.total_score}/100
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Team: <strong>{sub.team_name}</strong> • Track: {sub.track}
                    </div>

                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sub.tagline}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: DETAILED RUBRIC SCORING TERMINAL */}
        <section aria-labelledby="rubric-heading" className="glass-card">
          {submissionDetails ? (
            <div>
              {/* SUBMISSION INFO HEADER */}
              <div className="flex-between" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 id="rubric-heading" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    {submissionDetails.submission.title}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--brand-cyan)', fontWeight: 600 }}>
                    {submissionDetails.submission.tagline}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {submissionDetails.submission.repo_url && (
                    <a
                      href={submissionDetails.submission.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
                      title="View Repository"
                    >
                      <Code2 size={12} /> Code
                    </a>
                  )}
                  {submissionDetails.submission.demo_url && (
                    <a
                      href={submissionDetails.submission.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
                      title="View Live Demo"
                    >
                      <Globe size={12} /> Demo
                    </a>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {submissionDetails.submission.description}
              </div>

              {/* RUBRIC SCORING FORM */}
              <form onSubmit={handleEvaluationSubmit}>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sliders size={16} color="var(--brand-primary)" />
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>4-Pillar Evaluation Rubric</span>
                    </div>

                    {/* LIVE COMPUTED SCORE BADGE */}
                    <div
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid var(--brand-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '0.9375rem',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      <Sparkles size={14} /> Total: {liveCalculatedScore} / 100
                    </div>
                  </div>

                  {/* 1. INNOVATION (25%) */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                      <label htmlFor="score-innovation" style={{ fontWeight: 600 }}>
                        Innovation & Originality (25% weight)
                      </label>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                        {innovation.toFixed(1)} / 10.0
                      </span>
                    </div>
                    <input
                      id="score-innovation"
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={innovation}
                      onChange={(e) => setInnovation(parseFloat(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>

                  {/* 2. TECHNICAL QUALITY (35%) */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                      <label htmlFor="score-technical" style={{ fontWeight: 600 }}>
                        Technical Execution & Complexity (35% weight)
                      </label>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                        {technical.toFixed(1)} / 10.0
                      </span>
                    </div>
                    <input
                      id="score-technical"
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={technical}
                      onChange={(e) => setTechnical(parseFloat(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>

                  {/* 3. IMPACT (25%) */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                      <label htmlFor="score-impact" style={{ fontWeight: 600 }}>
                        Real-World Impact & Value (25% weight)
                      </label>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                        {impact.toFixed(1)} / 10.0
                      </span>
                    </div>
                    <input
                      id="score-impact"
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={impact}
                      onChange={(e) => setImpact(parseFloat(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>

                  {/* 4. PRESENTATION (15%) */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                      <label htmlFor="score-presentation" style={{ fontWeight: 600 }}>
                        Presentation & Demo Clarity (15% weight)
                      </label>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                        {presentation.toFixed(1)} / 10.0
                      </span>
                    </div>
                    <input
                      id="score-presentation"
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={presentation}
                      onChange={(e) => setPresentation(parseFloat(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>

                  {/* STRUCTURED FEEDBACK */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="judge-feedback" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Constructive Feedback for Team
                    </label>
                    <textarea
                      id="judge-feedback"
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Highlight architectural strengths, clinical/market viability, and areas for improvement..."
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

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
                  >
                    <Save size={16} />{' '}
                    {isSubmitting
                      ? 'Recording Score...'
                      : submissionDetails.has_evaluated
                      ? 'Update Evaluation Score'
                      : 'Submit Official Rubric Score'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <Award size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p>Select a submission from the left panel to review and score.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
