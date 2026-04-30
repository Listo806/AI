import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/userApi';
import './account.css';

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim() || null });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="account-title">{t('account.profile.title')}</h1>
        <p className="account-description">
          {t('account.profile.description')}
        </p>
      </div>

      {error && (
        <div className="account-message account-message-error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="account-message account-message-success" role="status">
          {t('common.success')}
        </div>
      )}
      <form onSubmit={handleSave} className="account-form">
        <div className="account-form-section">
          <label className="account-label">
            {t('account.profile.name')}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="account-input"
              placeholder={t('account.profile.name')}
            />
          </label>

          <label className="account-label">
            {t('account.profile.email')}
            <input
              type="email"
              value={user?.email || ''}
              className="account-input"
              readOnly
              disabled
            />
            <span className="account-help-text">{t('account.profile.emailReadOnly')}</span>
          </label>
        </div>

        <div className="account-form-actions">
          <button 
            type="submit" 
            className="account-btn-primary"
            disabled={isSaving}
          >
            {isSaving ? t('account.profile.saving') : t('account.profile.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
