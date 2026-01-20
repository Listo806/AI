export default function Integrations() {
  const integrations = [
    {
      name: 'Email Provider',
      status: 'not_connected',
      description: 'Connect your email provider for automated email sequences and campaigns',
      icon: '📧'
    },
    {
      name: 'Zapier',
      status: 'not_connected',
      description: 'Connect Zapier for custom automation workflows and integrations',
      icon: '⚡'
    },
    {
      name: 'CRM Integration',
      status: 'not_connected',
      description: 'Sync data with external CRM systems (coming soon)',
      icon: '🔗'
    },
    {
      name: 'Webhooks',
      status: 'not_connected',
      description: 'Configure webhooks for real-time data synchronization (coming soon)',
      icon: '🔌'
    }
  ];

  const getStatusBadge = (status) => {
    if (status === 'connected') {
      return (
        <span style={{
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          background: '#f0fdf4',
          color: '#16a34a',
          border: '1px solid #86efac'
        }}>
          Connected
        </span>
      );
    }
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: '#f1f5f9',
        color: '#64748b',
        border: '1px solid #cbd5e1'
      }}>
        Not Connected
      </span>
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Integrations</h1>
      
      <p style={{ 
        marginBottom: '24px', 
        fontSize: '16px', 
        color: '#64748b',
        lineHeight: '1.6'
      }}>
        Connect third-party services to extend your CRM functionality. 
        For messaging integrations, visit <strong>WhatsApp</strong> or <strong>Instagram</strong> pages.
      </p>

      <div 
        className="integrations-grid"
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {integrations.map((integration, index) => (
          <div key={index} className="crm-section">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '16px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f1f5f9',
                  borderRadius: '8px'
                }}>
                  {integration.icon}
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                  {integration.name}
                </h2>
              </div>
              {getStatusBadge(integration.status)}
            </div>
            
            <p style={{ 
              color: '#64748b', 
              marginBottom: '20px', 
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {integration.description}
            </p>
            
            <button 
              className={`crm-btn ${integration.status === 'connected' ? 'crm-btn-secondary' : 'crm-btn-primary'} integration-connect-btn`}
              style={{ 
                width: '100%',
                padding: '14px 20px',
                fontSize: '16px',
                minHeight: '48px'
              }}
              disabled={integration.status === 'connected'}
            >
              {integration.status === 'connected' ? 'Connected' : `Connect ${integration.name}`}
            </button>
          </div>
        ))}
      </div>

      <div style={{ 
        padding: '16px', 
        background: '#f8fafc', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#64748b',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ margin: 0 }}>
          💡 <strong>Note:</strong> Integration connections will be implemented in a future phase.
          This is the UI structure only.
        </p>
      </div>
    </div>
  );
}
