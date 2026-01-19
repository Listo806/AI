import { useState } from 'react';

export default function Instagram() {
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected' | 'not_connected'

  const getStatusBadge = (status) => {
    const styles = {
      connected: {
        background: '#f0fdf4',
        color: '#16a34a',
        border: '1px solid #86efac',
        text: 'Connected'
      },
      not_connected: {
        background: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fecaca',
        text: 'Not Connected'
      }
    };

    const style = styles[status] || styles.not_connected;

    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.background,
        color: style.color,
        border: style.border
      }}>
        {style.text}
      </span>
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Instagram</h1>

      {/* Status Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Instagram Connection Status */}
        <div className="crm-section">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Instagram Connection
            </h2>
            {getStatusBadge(connectionStatus)}
          </div>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
            Connection status with Instagram Business Account
          </p>
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            {connectionStatus === 'connected' 
              ? 'Successfully connected to Instagram Business Account'
              : 'Not connected. Please connect your Instagram account.'}
          </div>
        </div>

        {/* Account Name / Handle */}
        <div className="crm-section">
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Account Information
          </h2>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
            Your connected Instagram account details
          </p>
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Account Name:</strong> Your Business Name
            </div>
            <div>
              <strong>Handle:</strong> @yourbusiness
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="instagram-main-layout" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Left Column: Instagram DM Inbox */}
        <div className="crm-section">
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Direct Messages Inbox
          </h2>
          <div style={{
            height: '500px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Inbox Header */}
            <div style={{
              padding: '16px',
              background: '#fff',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                📸
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Instagram DMs</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Manage your direct messages</div>
              </div>
            </div>

            {/* Messages List / Conversation Area */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#64748b',
              fontSize: '14px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
                <div style={{ fontWeight: '500', marginBottom: '8px' }}>Instagram Direct Messages</div>
                <div>DM inbox interface placeholder</div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                  Your Instagram messages will appear here
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div style={{
              padding: '16px',
              background: '#fff',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  disabled
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '20px',
                    fontSize: '14px',
                    background: '#f8fafc'
                  }}
                />
                <button
                  disabled
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'not-allowed',
                    opacity: 0.5
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Info & Settings */}
        <div>
          {/* Instagram Notes */}
          <div className="crm-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              About Instagram
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                padding: '12px',
                background: '#fef3f2',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#dc2626' }}>
                  📱 Instagram Leads
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Capture and respond to leads from Instagram
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: '#fef3f2',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#dc2626' }}>
                  💬 Direct Messages
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Manage all Instagram direct messages in one place
                </div>
              </div>
            </div>
          </div>

          {/* DM Automation */}
          <div className="crm-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              DM Automation
            </h2>
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#64748b',
              textAlign: 'center',
              border: '1px dashed #cbd5e1'
            }}>
              DM automation configuration placeholder
            </div>
          </div>

          {/* Response Templates */}
          <div className="crm-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Response Templates
            </h2>
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#64748b',
              textAlign: 'center',
              border: '1px dashed #cbd5e1'
            }}>
              Response templates placeholder
            </div>
          </div>

          {/* Engagement Notes */}
          <div className="crm-section">
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Engagement Notes
            </h2>
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#64748b',
              textAlign: 'center',
              border: '1px dashed #cbd5e1'
            }}>
              Engagement tracking placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
