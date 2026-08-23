import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import { trackEvent, trackSignupConversion } from '../../utils/track';
import './Auth.css';

const ROLE_OPTIONS = [
  { value: 'user', labelKey: 'auth.roleUser' },
  { value: 'agent', labelKey: 'auth.roleAgent' },
  { value: 'owner', labelKey: 'auth.roleOwner' },
  { value: 'va_uploader', labelKey: 'auth.roleVaUploader' },
];

export default function SignUp() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Funnel: the visitor reached / opened the registration form.
  useEffect(() => {
    trackEvent('sign_up_started', { source: 'marketplace' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send the current UI language so the backend stores it for localized
      // lifecycle emails (welcome / abandoned-signup). Only en/es/pt are valid;
      // anything else is dropped and the backend defaults to English.
      const lang = (i18n.language || 'en').slice(0, 2).toLowerCase();
      const language = ['en', 'es', 'pt'].includes(lang) ? lang : 'en';
      let res;
      try {
        res = await apiClient.request('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, role, language }),
        });
      } catch (err) {
        // Resilience: an older backend that predates the `language` field
        // rejects unknown properties with a 400. Retry once without it so
        // signup can never break while the backend is being updated; the
        // language just isn't captured until then. Any other error is real.
        if (err && err.status === 400) {
          res = await apiClient.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, role }),
          });
        } else {
          throw err;
        }
      }

      if (res.accessToken) {
        apiClient.setTokens(res.accessToken, res.refreshToken);
        localStorage.setItem('listo_user', JSON.stringify(res.user));
        // Funnel: account successfully created via the marketplace signup form.
        trackEvent('sign_up_completed');
        // NEW FLOW: send new signups to plan selection ($0 / $7 / $14 / $21)
        // BEFORE the CRM — not straight into the dashboard. Google Ads sign-up
        // conversion fires first; the hard-navigate waits for the beacon so the
        // page unload does not cancel it (which made Ads report "wasn't detected").
        trackSignupConversion({
          onSent: () => {
            window.location.href = '/pricing';
          },
        });
        return;
      } else {
        setError(t('auth.signupNoToken'));
      }
    } catch (err) {
      setError(err.message || t('auth.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">{t('auth.badge')}</div>
        <h1 className="auth-title">{t('auth.title')}</h1>
        <p className="auth-subtitle">{t('auth.subtitle')}</p>

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
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">{t('auth.passwordLabel')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="role">{t('auth.roleLabel')}</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t('auth.creatingAccount') : t('auth.signUp')}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '20px' }}>
          {t('auth.alreadyHaveAccount')} <Link to="/sign-in">{t('auth.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
