import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { trackEvent } from '../../utils/track';
import './Auth.css';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User (submit marketplace listings)' },
  { value: 'agent', label: 'Agent' },
  { value: 'owner', label: 'Owner' },
  { value: 'va_uploader', label: 'VA Uploader' },
];

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      if (res.accessToken) {
        apiClient.setTokens(res.accessToken, res.refreshToken);
        localStorage.setItem('listo_user', JSON.stringify(res.user));
        // Funnel: account created via the marketplace signup form.
        trackEvent('account_created');
        // Google Ads sign-up conversion. The default below is the dedicated
        // "Sign-up" action created in Ads; VITE_ADS_SIGNUP_CONVERSION overrides.
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'conversion', {
            send_to:
              import.meta.env.VITE_ADS_SIGNUP_CONVERSION ||
              'AW-17836518151/G2jxCOX7mNccEIfWjrlC',
            value: 67.0,
            currency: 'USD',
          });
        }
        window.location.href = '/dashboard';
        return;
      } else {
        setError('Signup completed but no token received. Please sign in.');
      }
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">Marketplace</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Sign up to submit listings to the marketplace.</p>

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
              placeholder="Min 6 characters"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '20px' }}>
          Already have an account? <Link to="/sign-in">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
