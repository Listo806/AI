import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Settings</h1>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '3px solid #3b82f6' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'profile' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'profile' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'notifications' ? '3px solid #3b82f6' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'notifications' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'notifications' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'preferences' ? '3px solid #3b82f6' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'preferences' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'preferences' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Preferences
        </button>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'security' ? '3px solid #3b82f6' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'security' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'security' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="crm-section">
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Profile</h2>
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1'
            }}>
              <p style={{ color: '#64748b', margin: '0 0 16px 0' }}>
                Email: {user?.email || 'N/A'}
              </p>
              <p style={{ color: '#64748b', margin: 0 }}>
                Profile settings UI will be implemented in a future phase.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Notifications</h2>
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1'
            }}>
              <p style={{ color: '#64748b', margin: 0 }}>
                Notification preferences UI will be implemented in a future phase.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Preferences</h2>
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1'
            }}>
              <p style={{ color: '#64748b', margin: 0 }}>
                User preferences UI will be implemented in a future phase.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Security</h2>
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1'
            }}>
              <p style={{ color: '#64748b', margin: 0 }}>
                Security settings (password change, 2FA, etc.) UI will be implemented in a future phase.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
