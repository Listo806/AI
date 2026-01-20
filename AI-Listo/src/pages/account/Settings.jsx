import { useState } from 'react';
import './account.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="account-title">Settings</h1>
        <p className="account-description">
          Manage your preferences, notifications, and security settings.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
        >
          Preferences
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
        >
          Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-tab-content">
        {activeTab === 'notifications' && (
          <div>
            <h2 className="settings-section-title">Notifications</h2>
            <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px' }}>
              Notification preferences UI will be implemented in a future phase.
            </p>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div>
            <h2 className="settings-section-title">Preferences</h2>
            <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px' }}>
              User preferences UI will be implemented in a future phase.
            </p>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h2 className="settings-section-title">Security</h2>
            <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px' }}>
              Security settings (password change, 2FA, etc.) UI will be implemented in a future phase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
