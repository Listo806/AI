import { useState } from 'react';

export default function WhatsApp() {
  const [apiStatus, setApiStatus] = useState('connected'); // 'connected' | 'not_connected'
  const [accountStatus, setAccountStatus] = useState('active'); // 'active' | 'pending' | 'error'

  const getStatusBadge = (status, type) => {
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
      },
      active: {
        background: '#f0fdf4',
        color: '#16a34a',
        border: '1px solid #86efac',
        text: 'Active'
      },
      pending: {
        background: '#fef3c7',
        color: '#d97706',
        border: '1px solid #fde68a',
        text: 'Pending'
      },
      error: {
        background: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fecaca',
        text: 'Error'
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
    <div style={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ 
        marginBottom: '24px', 
        fontSize: '28px', 
        fontWeight: 600,
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}>WhatsApp</h1>

      {/* Status Cards Row - Mobile First: Single Column */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '24px'
      }}
      className="whatsapp-status-cards"
      >
        {/* WhatsApp Business API Status */}
        <div className="crm-section">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              WhatsApp Business API
            </h2>
            {getStatusBadge(apiStatus)}
          </div>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
            Connection status with WhatsApp Business API
          </p>
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            {apiStatus === 'connected' 
              ? 'Successfully connected to WhatsApp Business API'
              : 'Not connected. Please configure your API credentials.'}
          </div>
        </div>

        {/* Account Status */}
        <div className="crm-section">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Account Status
            </h2>
            {getStatusBadge(accountStatus)}
          </div>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
            Current account status and health
          </p>
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            {accountStatus === 'active' && 'Account is active and ready to use'}
            {accountStatus === 'pending' && 'Account verification is pending'}
            {accountStatus === 'error' && 'Account has an error. Please check configuration.'}
          </div>
        </div>

        {/* WhatsApp Number Info */}
        <div className="crm-section">
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            WhatsApp Number
          </h2>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
            Your connected WhatsApp Business number
          </p>
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Number:</strong> +1 (555) 123-4567
            </div>
            <div>
              <strong>Display Name:</strong> Your Business Name
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Mobile First - Single Column Stack */}
      <div className="whatsapp-main-layout" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* PRIMARY: Messaging Panel (Full Width on Mobile) */}
        <div className="crm-section whatsapp-messaging-panel">
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Messaging Panel
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
            {/* Chat Header */}
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
                background: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                💬
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>WhatsApp Chat</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Select a conversation to start</div>
              </div>
            </div>

            {/* Chat Messages Area */}
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
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <div style={{ fontWeight: '500', marginBottom: '8px' }}>WhatsApp Messaging</div>
                <div>Chat interface placeholder</div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                  Select a contact to start messaging
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
                    background: '#25D366',
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

        {/* Secondary Content: Info & Settings (Below Messaging on Mobile) */}
        <div className="whatsapp-secondary-content" style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}>
          {/* WhatsApp Notes */}
          <div className="crm-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              About WhatsApp
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                padding: '12px',
                background: '#eff6ff',
                borderRadius: '6px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1e40af' }}>
                  ⚡ Used for fastest lead response
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Respond to leads instantly via WhatsApp
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: '#eff6ff',
                borderRadius: '6px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1e40af' }}>
                  📞 Primary contact channel
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Main communication channel for customer engagement
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Templates */}
          <div className="crm-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              WhatsApp Templates
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
              Template management placeholder
            </div>
          </div>

          {/* Auto-Reply Info */}
          <div className="crm-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Auto-Reply
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
              Auto-reply configuration placeholder
            </div>
          </div>

          {/* Business Hours */}
          <div className="crm-section">
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Business Hours
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
              Business hours configuration placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
