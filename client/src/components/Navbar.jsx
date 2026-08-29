import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { Radio, User, Users, QrCode, LogOut, Sparkles, Shield, Award } from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, token, logout, demoLogin } = useAuth();
  const { success, error } = useToast();

  const handleDemoClick = async (role) => {
    try {
      await demoLogin(role);
      success(`Switched to Demo ${role.toUpperCase()}`);
      if (role === 'participant') {
        setActivePage('dashboard');
      }
    } catch (err) {
      error(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    setActivePage('login');
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(6, 9, 19, 0.92)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* 1-CLICK DEMO LOGIN BAR */}
      <div
        style={{
          backgroundColor: 'rgba(30, 41, 74, 0.65)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.35rem 0',
          fontSize: '0.75rem',
        }}
      >
        <div className="container flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-cyan)' }}>
            <Sparkles size={13} aria-hidden="true" />
            <span style={{ fontWeight: 600 }}>1-Click Hackathon Evaluator Switcher:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => handleDemoClick('participant')}
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              title="Switch to Demo Participant (Alex Chen)"
            >
              <User size={12} /> Participant (Alex)
            </button>
            <button
              onClick={() => handleDemoClick('judge')}
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              title="Switch to Demo Judge (Dr. Elena Vance)"
            >
              <Award size={12} /> Judge (Elena)
            </button>
            <button
              onClick={() => handleDemoClick('organizer')}
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              title="Switch to Demo Organizer (Sarah Jenkins)"
            >
              <Shield size={12} /> Organizer (Sarah)
            </button>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR */}
      <div className="container flex-between" style={{ padding: '0.875rem 1.25rem' }}>
        {/* LOGO */}
        <div
          onClick={() => setActivePage(user ? 'dashboard' : 'login')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActivePage(user ? 'dashboard' : 'login')}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Radio size={18} color="#ffffff" aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              PromptWars <span style={{ color: 'var(--brand-cyan)' }}>×</span> AbhiyantriX
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              Smart Event Management Platform
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} aria-label="Main Navigation">
          {user && user.role === 'participant' && (
            <>
              <button
                onClick={() => setActivePage('dashboard')}
                className={`btn ${activePage === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                <QrCode size={15} /> Pass & Profile
              </button>
              <button
                onClick={() => setActivePage('teams')}
                className={`btn ${activePage === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                <Users size={15} /> Teams & Matcher
              </button>
              <button
                onClick={() => setActivePage('submissions')}
                className={`btn ${activePage === 'submissions' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                <Sparkles size={15} color="var(--brand-primary)" /> Project Submission
              </button>
            </>
          )}

          {user && user.role === 'judge' && (
            <button
              onClick={() => setActivePage('judging')}
              className={`btn ${activePage === 'judging' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <Award size={15} color="var(--status-warning)" /> Judging Portal
            </button>
          )}

          {user && user.role === 'organizer' && (
            <button
              onClick={() => setActivePage('organizer')}
              className={`btn ${activePage === 'organizer' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <Shield size={15} color="var(--status-urgent)" /> Organizer Operations
            </button>
          )}

          {user && (
            <button
              onClick={() => setActivePage('leaderboard')}
              className={`btn ${activePage === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              <Sparkles size={15} color="#f59e0b" /> Leaderboard
            </button>
          )}

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ fontWeight: 600 }}>{user.name}</span>
                <span
                  className={`badge ${
                    user.role === 'organizer'
                      ? 'badge-urgent'
                      : user.role === 'judge'
                      ? 'badge-warning'
                      : 'badge-success'
                  }`}
                  style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}
                >
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}

          {!user && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setActivePage('login')}
                className={`btn ${activePage === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                Login
              </button>
              <button
                onClick={() => setActivePage('register')}
                className={`btn ${activePage === 'register' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                Register
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
