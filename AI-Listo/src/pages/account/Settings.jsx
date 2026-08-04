import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import './account.css';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('notifications');

  // Change-password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (newPassword.length < 8) {
      setError(t('account.settings.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('account.settings.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      // The backend re-issues a fresh session so THIS session stays valid.
      if (response && response.accessToken) {
        apiClient.setTokens(response.accessToken, response.refreshToken);
      }

      setSuccess((response && response.message) || t('account.settings.passwordUpdated'));
      resetFields();
    } catch (err) {
      setError(err.message || t('account.settings.passwordUpdateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !submitting;

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="account-title">{t('account.settings.title')}</h1>
        <p className="account-description">
          {t('account.settings.description')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          {t('account.settings.notifications')}
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
        >
          {t('account.settings.preferences')}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
        >
          {t('account.settings.security')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-tab-content">
        {activeTab === 'notifications' && (
          <div>
            <h2 className="settings-section-title">{t('account.settings.notifications')}</h2>
            <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px' }}>
              {t('account.settings.notificationsPlaceholder')}
            </p>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div>
            <h2 className="settings-section-title">{t('account.settings.preferences')}</h2>
            <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px' }}>
              {t('account.settings.preferencesPlaceholder')}
            </p>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h2 className="settings-section-title">{t('account.settings.security')}</h2>
            <p style={{ color: '#94A3B8', margin: '0 0 20px 0', fontSize: '14px' }}>
              {t('account.settings.securityDescription')}
            </p>

            <form
              onSubmit={handleChangePassword}
              style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label style={labelStyle} htmlFor="currentPassword">
                  {t('account.settings.currentPassword')}
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="newPassword">
                  {t('account.settings.newPassword')}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
                <p style={{ color: '#94A3B8', margin: '6px 0 0 0', fontSize: '12px' }}>
                  {t('account.settings.passwordMinHint')}
                </p>
              </div>

              <div>
                <label style={labelStyle} htmlFor="confirmPassword">
                  {t('account.settings.confirmNewPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {error && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '13px',
                  }}
                >
                  {success}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    background: canSubmit ? '#7c3aed' : '#f8fafc',
                    color: canSubmit ? '#ffffff' : '#94a3b8',
                    border: `1px solid ${canSubmit ? '#7c3aed' : '#e2e8f0'}`,
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? t('account.settings.updating') : t('account.settings.updatePassword')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
