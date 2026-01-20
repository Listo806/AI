import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './account.css';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('notifications');

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
            <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px' }}>
              {t('account.settings.securityPlaceholder')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
