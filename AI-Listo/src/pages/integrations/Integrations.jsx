export default function Integrations() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Integrations</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* WhatsApp API */}
        <div className="crm-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>WhatsApp API</h2>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #86efac'
            }}>
              Connected
            </span>
          </div>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
            WhatsApp Business API integration status (UI only)
          </p>
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            Status: Active
          </div>
        </div>

        {/* Email Provider */}
        <div className="crm-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Email Provider</h2>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1'
            }}>
              Not Connected
            </span>
          </div>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
            Connect your email provider for automated email sequences
          </p>
          <button className="crm-btn crm-btn-primary" style={{ width: '100%' }}>
            Connect Email Provider
          </button>
        </div>

        {/* Zapier */}
        <div className="crm-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Zapier</h2>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1'
            }}>
              Not Connected
            </span>
          </div>
          <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
            Connect Zapier for custom automation workflows
          </p>
          <button className="crm-btn crm-btn-secondary" style={{ width: '100%' }}>
            Connect Zapier
          </button>
        </div>
      </div>

      <div style={{ 
        padding: '16px', 
        background: '#f8fafc', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#64748b'
      }}>
        <p style={{ margin: 0 }}>
          💡 <strong>Note:</strong> Integration connections will be implemented in a future phase.
          This is the UI structure only.
        </p>
      </div>
    </div>
  );
}
