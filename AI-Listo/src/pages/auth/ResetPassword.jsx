import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import { Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError(t('auth.tokenMissing'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    try {
      await apiClient.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => navigate('/sign-in', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || t('auth.resetLinkInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">Cortexa AI OS</div>
        <h1 className="auth-title">{t('auth.setNewPasswordTitle')}</h1>
        <p className="auth-subtitle">{t('auth.setNewPasswordSubtitle')}</p>

        {done ? (
          <>
            <div
              className="auth-error"
              style={{ background: '#f0fdf4', color: '#16a34a' }}
            >
              {t('auth.passwordResetSuccess')}
            </div>
            <p className="auth-footer" style={{ marginTop: '20px' }}>
              <Link to="/sign-in">{t('auth.goToSignIn')}</Link>
            </p>
          </>
        ) : (
          <>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="password">{t('auth.newPassword')}</label>
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
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirm">{t('auth.confirmNewPassword')}</label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? t('auth.resetting') : t('auth.resetPassword')}
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
