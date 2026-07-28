import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show the same confirmation, whether or not the email exists.
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">Cortexa AI OS</div>
        <h1 className="auth-title">Reset your password</h1>
        <p className="auth-subtitle">
          Enter your email and we will send you a link to reset your password.
        </p>

        {sent ? (
          <>
            <div
              className="auth-error"
              style={{ background: '#f0fdf4', color: '#16a34a' }}
            >
              If an account exists for that email, a reset link is on its way.
              Check your inbox and spam folder.
            </div>
            <p className="auth-footer" style={{ marginTop: '20px' }}>
              <Link to="/sign-in">Back to sign in</Link>
            </p>
          </>
        ) : (
          <>
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="auth-footer" style={{ marginTop: '20px' }}>
              <Link to="/sign-in">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
