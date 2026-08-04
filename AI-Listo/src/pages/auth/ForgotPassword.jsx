import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import './Auth.css';

export default function ForgotPassword() {
  const { t } = useTranslation();
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
      setError(err.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">Cortexa AI OS</div>
        <h1 className="auth-title">{t('auth.resetTitle')}</h1>
        <p className="auth-subtitle">
          {t('auth.resetSubtitle')}
        </p>

        {sent ? (
          <>
            <div
              className="auth-error"
              style={{ background: '#f0fdf4', color: '#16a34a' }}
            >
              {t('auth.resetSentMessage')}
            </div>
            <p className="auth-footer" style={{ marginTop: '20px' }}>
              <Link to="/sign-in">{t('auth.backToSignIn')}</Link>
            </p>
          </>
        ) : (
          <>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email">{t('common.email')}</label>
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
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>
            </form>
            <p className="auth-footer" style={{ marginTop: '20px' }}>
              <Link to="/sign-in">{t('auth.backToSignIn')}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
