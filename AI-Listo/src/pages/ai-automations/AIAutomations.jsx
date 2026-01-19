import { useState } from 'react';
import '../shared/ai-pages.css';

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
        borderBottom: '2px solid #e5e7eb',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`automation-tab ${activeTab === 'whatsapp' ? 'active' : ''}`}
        >
          WhatsApp Automation
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`automation-tab ${activeTab === 'email' ? 'active' : ''}`}
        >
          Email Automation
        </button>
        <button
          onClick={() => setActiveTab('instagram')}
          className={`automation-tab ${activeTab === 'instagram' ? 'active' : ''}`}
        >
          Instagram Automation
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'whatsapp' && (
          <div className="automation-card">
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>
              WhatsApp Automation Configuration
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
              Configure automated WhatsApp messaging rules and responses.
            </p>
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              textAlign: 'center'
            }}>
              <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                Configuration UI will be implemented in a future phase.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="automation-card">
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>
              Email Automation Configuration
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
              Configure automated email sequences and follow-ups.
            </p>
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              textAlign: 'center'
            }}>
              <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                Configuration UI will be implemented in a future phase.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'instagram' && (
          <div className="automation-card automation-locked">
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>
              Instagram Automation
            </h2>
            <div style={{
              padding: '24px',
              background: 'rgba(245, 158, 11, 0.15)',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ color: '#d97706', margin: 0, fontWeight: '500', fontSize: '14px' }}>
                🚧 Coming Soon
              </p>
              <p style={{ color: '#92400e', margin: '8px 0 0 0', fontSize: '13px' }}>
                Instagram automation features will be available in a future release.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
