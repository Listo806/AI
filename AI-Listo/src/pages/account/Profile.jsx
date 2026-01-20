import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import './account.css';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Placeholder - will be connected to backend in future phase
    setTimeout(() => {
      setIsSaving(false);
      alert(t('common.success'));
    }, 500);
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="account-title">{t('account.profile.title')}</h1>
        <p className="account-description">
          {t('account.profile.description')}
        </p>
      </div>

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
