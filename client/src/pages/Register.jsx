import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { User, Mail, Lock, Code, Briefcase, Heart, FileText, ArrowRight } from 'lucide-react';

const SUGGESTED_SKILLS = ['React', 'TypeScript', 'Node.js', 'Python', 'PyTorch', 'FastAPI', 'UI/UX', 'Figma', 'Solidity', 'TailwindCSS', 'Go', 'Docker'];
const SUGGESTED_ROLES = ['Frontend Developer', 'Backend Developer', 'Fullstack Engineer', 'ML Engineer', 'Product Designer', 'Mobile Developer', 'DevOps'];
const SUGGESTED_INTERESTS = ['AI/ML', 'Healthcare', 'FinTech', 'Web3', 'EdTech', 'Sustainability', 'Security', 'Open Innovation'];

export default function Register({ setActivePage }) {
  const { register } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState(['React', 'TypeScript']);
  const [preferredRoles, setPreferredRoles] = useState(['Frontend Developer']);
  const [interests, setInterests] = useState(['AI/ML', 'Healthcare']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        bio,
        skills,
        preferred_roles: preferredRoles,
        interests,
      });
      success('Registration successful! Welcome to the event.');
      setActivePage('dashboard');
    } catch (err) {
      error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>Participant Registration</span>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, marginBottom: '0.4rem' }}>Create Attendee Profile</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Join the hackathon, generate your Digital QR Pass, and discover matched teammates.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* BASIC INFORMATION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label htmlFor="reg-name" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Patel"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label htmlFor="reg-email" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Email Address *
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@hackathon.dev"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="reg-password" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Password (min. 8 characters) *
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="reg-bio" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Bio & Project Vision (Optional)
            </label>
            <textarea
              id="reg-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell potential teammates about your interests and past projects..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
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

          {/* SKILLS SELECTION */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Technical Skills (Select applicable)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SUGGESTED_SKILLS.map((skill) => {
                const isSelected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleItem(skills, setSkills, skill)}
                    className="btn"
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)',
                    }}
                  >
                    {skill} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREFERRED ROLES */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Preferred Team Roles
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SUGGESTED_ROLES.map((role) => {
                const isSelected = preferredRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleItem(preferredRoles, setPreferredRoles, role)}
                    className="btn"
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isSelected ? '#0891b2' : 'var(--bg-surface-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      borderColor: isSelected ? '#0891b2' : 'var(--border-subtle)',
                    }}
                  >
                    {role} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INTERESTS */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Project Domain Interests (Used for Smart Match Scoring)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SUGGESTED_INTERESTS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleItem(interests, setInterests, interest)}
                    className="btn"
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isSelected ? '#4338ca' : 'var(--bg-surface-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      borderColor: isSelected ? '#6366f1' : 'var(--border-subtle)',
                    }}
                  >
                    {interest} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
          >
            {isSubmitting ? 'Creating Attendee Profile...' : 'Complete Registration & View Pass'}{' '}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <button
            onClick={() => setActivePage('login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-cyan)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
