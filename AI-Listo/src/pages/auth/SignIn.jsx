import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function SignIn({ variant = 'crm' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // NOTE: Sign-in page ALWAYS shows the form, even if user is already authenticated
  // This is correct SaaS behavior - clicking "Sign In" should always show the form

  // Branding configuration based on variant
  const branding = {
    crm: {
      badge: 'Listo Qasa AI CRM',
      title: 'Sign In to Your CRM',
      subtitle: 'Access your dashboard and manage leads in real time.',
    },
    internal: {
      badge: 'Internal Access',
      title: 'Team Login',
      subtitle: 'Sign in to access your workspace.',
    },
  };

  const currentBranding = branding[variant] || branding.crm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">{currentBranding.badge}</div>
        <h1 className="auth-title">{currentBranding.title}</h1>
        <p className="auth-subtitle">{currentBranding.subtitle}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}
