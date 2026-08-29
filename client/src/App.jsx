import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ParticipantDashboard from './pages/ParticipantDashboard.jsx';
import TeamFinder from './pages/TeamFinder.jsx';
import { Award, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: 'var(--brand-cyan)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9375rem',
        }}
      >
        Initializing Smart Event Platform...
      </div>
    );
  }

  // If not logged in, show Login or Register
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main className="container" style={{ flex: 1, padding: '2rem 1.25rem' }}>
          {activePage === 'register' ? (
            <Register setActivePage={setActivePage} />
          ) : (
            <Login setActivePage={setActivePage} />
          )}
        </main>
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '1.5rem 0',
            backgroundColor: 'var(--bg-base)',
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
          }}
        >
          <div className="container flex-between">
            <p>© 2026 PromptWars × AbhiyantriX. WCAG 2.1 AA Compliant & Secure.</p>
            <p style={{ fontFamily: 'var(--font-mono)' }}>System Baseline: Phase 3 Ready</p>
          </div>
        </footer>
      </div>
    );
  }

  // Non-participant demo placeholders (for Judge / Organizer demo switches before Phase 4 & 5)
  if (user.role === 'judge') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main className="container" style={{ flex: 1, padding: '3rem 1.25rem' }}>
          <div className="glass-card" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
            <Award size={48} color="var(--status-warning)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Authenticated as Judge: {user.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              You are authenticated with the <strong>Judge</strong> role. The interactive Rubric Evaluation and Project Scoring Portal will be activated in Phase 5.
            </p>
            <div className="badge badge-warning" style={{ marginBottom: '1.5rem' }}>
              RBAC Authorization Active: Participant routes strictly protected
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (user.role === 'organizer') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main className="container" style={{ flex: 1, padding: '3rem 1.25rem' }}>
          <div className="glass-card" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
            <Shield size={48} color="var(--status-urgent)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Authenticated as Organizer: {user.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              You are authenticated with the <strong>Organizer</strong> role. The QR Code Verification Scanner and Live Event Analytics Dashboard will be activated in Phase 4.
            </p>
            <div className="badge badge-urgent" style={{ marginBottom: '1.5rem' }}>
              RBAC Authorization Active: Administrator privileges verified
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Default Participant View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="container" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {activePage === 'teams' ? (
          <TeamFinder setActivePage={setActivePage} />
        ) : (
          <ParticipantDashboard setActivePage={setActivePage} />
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem 0',
          backgroundColor: 'var(--bg-base)',
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
        }}
      >
        <div className="container flex-between">
          <p>© 2026 PromptWars × AbhiyantriX. Built with WCAG 2.1 AA Accessibility & Clean Architecture.</p>
          <p style={{ fontFamily: 'var(--font-mono)' }}>Participant Portal: Active</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
