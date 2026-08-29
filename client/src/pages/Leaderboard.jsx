import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import {
  Trophy,
  Medal,
  Award,
  RefreshCw,
  Sparkles,
  Filter,
  ExternalLink,
  Code2,
  Globe,
  Users,
} from 'lucide-react';

export default function Leaderboard() {
  const { token } = useAuth();
  const { success, error } = useToast();

  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchLeaderboard = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const url = new URL('/api/leaderboard', window.location.origin);
      if (selectedTrack) url.searchParams.set('track', selectedTrack);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [token, selectedTrack]);

  const topThree = leaderboard.slice(0, 3);

  return (
    <div style={{ maxWidth: '1180px', margin: '1.5rem auto' }}>
      {/* TITLE & LIVE REFRESH BAR */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Trophy size={24} color="#f59e0b" />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Live Event Leaderboard</h2>
            <span className="badge badge-warning">Official Standings</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time rankings calculated from 4-pillar judge rubric evaluations in SQLite.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* TRACK FILTER */}
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            aria-label="Filter by Track"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
            }}
          >
            <option value="">All Focus Tracks</option>
            <option value="AI/Healthcare">AI / Healthcare</option>
            <option value="FinTech/Web3">FinTech / Web3</option>
            <option value="Sustainability/IoT">Sustainability / IoT</option>
            <option value="Open Innovation">Open Innovation</option>
          </select>

          <button
            type="button"
            onClick={fetchLeaderboard}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem' }}
            title="Refresh Leaderboard"
          >
            <RefreshCw size={13} /> {lastRefreshed ? `Updated ${lastRefreshed}` : 'Refresh'}
          </button>
        </div>
      </div>

      {/* 1. TOP 3 PODIUM DISPLAY */}
      {topThree.length > 0 && (
        <section aria-labelledby="podium-heading" style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {topThree.map((item, index) => {
              const isGold = index === 0;
              const isSilver = index === 1;
              const isBronze = index === 2;

              const badgeColor = isGold
                ? '#f59e0b'
                : isSilver
                ? '#94a3b8'
                : '#d97706';

              const rankLabel = isGold ? '1st Place' : isSilver ? '2nd Place' : '3rd Place';

              return (
                <div
                  key={item.submission_id}
                  className="glass-card"
                  style={{
                    border: `1px solid ${isGold ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
                    background: isGold
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.8))'
                      : 'var(--bg-surface)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Medal size={20} color={badgeColor} />
                      <span style={{ fontWeight: 800, fontSize: '0.875rem', color: badgeColor }}>
                        {rankLabel}
                      </span>
                    </div>

                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                      Track: {item.track}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {item.title}
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Team: <strong style={{ color: 'var(--brand-cyan)' }}>{item.team_name}</strong>
                  </div>

                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Score / 100
                      </span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: badgeColor, fontFamily: 'var(--font-mono)' }}>
                        {item.average_score.toFixed(1)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Evaluations
                      </span>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.evaluation_count} Judge{item.evaluation_count === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. FULL STANDINGS TABLE */}
      <section aria-labelledby="standings-heading" className="glass-card">
        <h3 id="standings-heading" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Complete Standings ({leaderboard.length} Project{leaderboard.length === 1 ? '' : 's'})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem', width: '60px' }}>Rank</th>
                <th style={{ padding: '0.75rem 1rem' }}>Project & Team</th>
                <th style={{ padding: '0.75rem 1rem' }}>Track</th>
                <th style={{ padding: '0.75rem 1rem' }}>Innovation (25%)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Technical (35%)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Impact (25%)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Presentation (15%)</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading leaderboard rankings...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No submissions available in this track.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row) => (
                  <tr
                    key={row.submission_id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      #{row.rank}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Team: {row.team_name} • {row.evaluation_count} review{row.evaluation_count === 1 ? '' : 's'}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        {row.track}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {row.breakdown.innovation.toFixed(1)}/10
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {row.breakdown.technical.toFixed(1)}/10
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {row.breakdown.impact.toFixed(1)}/10
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {row.breakdown.presentation.toFixed(1)}/10
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: row.average_score >= 85 ? 'var(--status-success)' : 'var(--brand-cyan)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {row.average_score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
