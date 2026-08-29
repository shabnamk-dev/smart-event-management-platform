import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ParticipantDashboard from './pages/ParticipantDashboard.jsx';
import TeamFinder from './pages/TeamFinder.jsx';
import ProjectSubmission from './pages/ProjectSubmission.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard.jsx';
import JudgeDashboard from './pages/JudgeDashboard.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import { Award, Shield } from 'lucide-react';

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
            <p style={{ fontFamily: 'var(--font-mono)' }}>System Baseline: Hackathon Verified</p>
          </div>
        </footer>
      </div>
    );
  }

  // Shared Leaderboard View (accessible across all roles)
  if (activePage === 'leaderboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main className="container" style={{ flex: 1, padding: '2rem 1.25rem' }}>
          <Leaderboard />
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
            <p>© 2026 PromptWars × AbhiyantriX. Official Hackathon Leaderboard.</p>
            <p style={{ fontFamily: 'var(--font-mono)' }}>Leaderboard: Active</p>
          </div>
        </footer>
      </div>
    );
  }

  // Judge Portal View
  if (user.role === 'judge') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main className="container" style={{ flex: 1, padding: '2rem 1.25rem' }}>
          <JudgeDashboard />
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
            <p>© 2026 PromptWars × AbhiyantriX. Built with WCAG 2.1 AA Accessibility.</p>
            <p style={{ fontFamily: 'var(--font-mono)' }}>Judging Portal: Live</p>
          </div>
        </footer>
      </div>
    );
  }

  // Organizer Dashboard View
  if (user.role === 'organizer') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main className="container" style={{ flex: 1, padding: '2rem 1.25rem' }}>
          <OrganizerDashboard />
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
            <p>© 2026 PromptWars × AbhiyantriX. Built with WCAG 2.1 AA Accessibility.</p>
            <p style={{ fontFamily: 'var(--font-mono)' }}>Organizer Operations: Live</p>
          </div>
        </footer>
      </div>
    );
  }

  // Default Participant Views
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="container" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {activePage === 'teams' ? (
          <TeamFinder setActivePage={setActivePage} />
        ) : activePage === 'submissions' ? (
          <ProjectSubmission setActivePage={setActivePage} />
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
