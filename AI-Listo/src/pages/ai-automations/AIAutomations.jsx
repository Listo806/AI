import { useState } from 'react';

export default function AIAutomations() {
  const [activeTab, setActiveTab] = useState('whatsapp');

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>AI Automations</h1>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('whatsapp')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'whatsapp' ? '3px solid #3b82f6' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'whatsapp' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'whatsapp' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          WhatsApp Automation
        </button>
        <button
          onClick={() => setActiveTab('email')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'email' ? '3px solid #3b82f6' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'email' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'email' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Email Automation
        </button>
        <button
          onClick={() => setActiveTab('instagram')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'instagram' ? '3px solid #3b82f6' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'instagram' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'instagram' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Instagram Automation
        </button>
      </div>

      {/* Tab Content */}
      <div className="crm-section">
        {activeTab === 'whatsapp' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
              WhatsApp Automation Configuration
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Configure automated WhatsApp messaging rules and responses.
            </p>
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1'
            }}>
              <p style={{ color: '#64748b', margin: 0 }}>
                Configuration UI will be implemented in a future phase.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
              Email Automation Configuration
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Configure automated email sequences and follow-ups.
            </p>
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1'
            }}>
              <p style={{ color: '#64748b', margin: 0 }}>
                Configuration UI will be implemented in a future phase.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'instagram' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
              Instagram Automation
            </h2>
            <div style={{
              padding: '24px',
              background: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fbbf24'
            }}>
              <p style={{ color: '#92400e', margin: 0, fontWeight: '500' }}>
                🚧 Coming Soon
              </p>
              <p style={{ color: '#92400e', margin: '8px 0 0 0' }}>
                Instagram automation features will be available in a future release.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
