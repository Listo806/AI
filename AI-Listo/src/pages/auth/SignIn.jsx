import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useSearchParams } from "react-router-dom";

// Only allow redirecting back to an INTERNAL path (starts with a single "/"),
// never to an external URL — prevents an open-redirect via ?next=.
function safeNext(raw) {
  const v = String(raw || '');
  if (/^\/[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(v)) return v;
  return '/dashboard/home';
}
import './Auth.css';
import { Eye, EyeOff } from 'lucide-react';
import { trackEvent } from '../../utils/track';
import { useTranslation } from "react-i18next";

export default function SignIn({ variant = 'crm' }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  // Where to land after login. Used by email CTAs (e.g. the $257 promo checkout)
  // so a logged-out customer returns to the offer instead of the dashboard.
  const nextPath = safeNext(searchParams.get('next'));

  if (loading) return null;

  if (isAuthenticated()) {
    return <Navigate to={nextPath} replace />;
  }
  // NOTE: Sign-in page ALWAYS shows the form, even if user is already authenticated
  // This is correct SaaS behavior - clicking "Sign In" should always show the form

  // Branding configuration based on variant
  const branding = {
    crm: {
      badge: t('auth.crmBadge'),
      title: t('auth.crmTitle'),
      subtitle: t('auth.crmSubtitle'),
    },
    internal: {
      badge: t('auth.internalBadge'),
      title: t('auth.internalTitle'),
      subtitle: t('auth.internalSubtitle'),
    },
  };

  const currentBranding = branding[variant] || branding.crm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Normalize so a capitalized/spaced email still matches the stored one.
      await login(email.trim().toLowerCase(), password);
      // Funnel: successful login. Fire first_login once per device so the first
      // login after signup is distinguishable from repeat logins.
      if (!localStorage.getItem('listo_has_logged_in')) {
        localStorage.setItem('listo_has_logged_in', '1');
        trackEvent('first_login');
      }
      trackEvent('login');
    } catch (err) {
      setError(err.message || t('auth.loginFailed'));
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
            <label htmlFor="email">{t('auth.emailLabel')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
              disabled={loading}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">{t('auth.passwordLabel')}</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                required
                disabled={loading}
                style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t('auth.btnSigningIn') : t('auth.btnSignIn')}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '12px' }}>
          <Link to="/forgot-password">{t('auth.forgotLink')}</Link>
        </p>

        <p className="auth-footer" style={{ marginTop: '8px' }}>
          {t('auth.footerText')} <Link to="/sign-up">{t('auth.footerLink')}</Link>
        </p>
      </div>
    </div>
  );
}
