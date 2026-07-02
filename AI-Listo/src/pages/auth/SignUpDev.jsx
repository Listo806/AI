import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, EyeOff, Code2, ChevronDown } from 'lucide-react';
import apiClient from '../../api/apiClient';
import './Auth.css';
import logo from "../../assets/cortexa/logo-dev.png";

export default function SignUpDev() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const role = 'developer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          role
        }),
      });

      if (res.accessToken) {
        apiClient.setTokens(res.accessToken, res.refreshToken);
        localStorage.setItem('listo_user', JSON.stringify(res.user));
        window.location.href = '/dashboard';
        return;
      }

      setError('Signup completed but no token received. Please sign in.');
    } catch (err) {
      setError(err.message || 'Dev sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dev-auth-page">
      <div className="dev-auth-dots dev-auth-dots-left" />
      <div className="dev-auth-dots dev-auth-dots-right" />

      <div className="dev-auth-card">
        <div className="dev-auth-logo">
          <img src={logo} alt="Cortexa" />
        </div>

        <h1 className="dev-auth-title">Create Account</h1>

        <p className="dev-auth-subtitle">
          This page is for internal use only.
          <br />
          Create a Dev Team account to access the platform.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="dev-auth-form">
          <div className="dev-auth-field">
            <label>Email</label>
            <div className="dev-auth-input-wrap">
              <Mail size={22} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="dev-auth-field">
            <label>Password</label>
            <div className="dev-auth-input-wrap">
              <Lock size={22} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                className="dev-auth-icon-btn"
                onClick={() => setShowPassword((v) => !v)}
              >
                <EyeOff size={22} />
              </button>
            </div>
          </div>

          <div className="dev-auth-field">
            <label>Role</label>
            <div className="dev-auth-input-wrap dev-role-box">
              <Code2 size={22} className="dev-role-icon" />
              <span>Dev Team</span>
              <ChevronDown size={22} className="dev-role-chevron" />
            </div>

            <p className="dev-role-note">
              Dev Team accounts are for developers and internal team members
              to build, test and manage the platform.
            </p>
          </div>

          <button type="submit" className="dev-auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="dev-auth-divider">
          <span /> OR <span />
        </div>

        <p className="dev-auth-footer">
          Already have an account? <Link to="/sign-in">Sign In</Link>
        </p>
      </div>
    </div>
  );
}