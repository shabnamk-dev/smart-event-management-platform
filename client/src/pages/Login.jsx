import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { Lock, Mail, Sparkles, User, Award, Shield, ArrowRight } from 'lucide-react';

export default function Login({ setActivePage }) {
  const { login, demoLogin } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      success('Login successful! Welcome back.');
      setActivePage('dashboard');
    } catch (err) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemo = async (role) => {
    try {
      await demoLogin(role);
      success(`Authenticated as Demo ${role.toUpperCase()}`);
      setActivePage('dashboard');
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign In to Platform</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Access your QR Attendee Pass, Team Portal, and Event Hub
          </p>
        </div>

        {/* 1-CLICK DEMO AUTHENTICATION TILES */}
        <div
          style={{
            marginBottom: '1.75rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--brand-cyan)',
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={14} /> Quick Demo Login (Instant Access)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleDemo('participant')}
              className="btn btn-secondary"
              style={{ flexDirection: 'column', padding: '0.6rem 0.25rem', fontSize: '0.75rem', gap: '0.25rem' }}
            >
              <User size={16} color="var(--brand-cyan)" />
              <span>Participant</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('judge')}
              className="btn btn-secondary"
              style={{ flexDirection: 'column', padding: '0.6rem 0.25rem', fontSize: '0.75rem', gap: '0.25rem' }}
            >
              <Award size={16} color="var(--status-warning)" />
              <span>Judge</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('organizer')}
              className="btn btn-secondary"
              style={{ flexDirection: 'column', padding: '0.6rem 0.25rem', fontSize: '0.75rem', gap: '0.25rem' }}
            >
              <Shield size={16} color="var(--status-urgent)" />
              <span>Organizer</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>or credentials</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </div>

        {/* STANDARD CREDENTIALS FORM */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hackathon.dev"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.35rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.35rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Don't have an attendee account?{' '}
          <button
            onClick={() => setActivePage('register')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-cyan)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Register as Participant
          </button>
        </div>
      </div>
    </div>
  );
}
