import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function Integrations() {
  const { t } = useTranslation();
  
  // Initialize Lucide icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
  
  const integrations = [
    {
      name: t('integrations.emailProvider'),
      nameKey: 'integrations.emailProvider',
      status: 'not_connected',
      description: t('integrations.emailProviderDesc'),
      icon: 'mail'
    },
    {
      name: t('integrations.zapier'),
      nameKey: 'integrations.zapier',
      status: 'not_connected',
      description: t('integrations.zapierDesc'),
      icon: 'zap'
    },
    {
      name: t('integrations.crmIntegration'),
      nameKey: 'integrations.crmIntegration',
      status: 'not_connected',
      description: t('integrations.crmIntegrationDesc'),
      icon: 'link'
    },
    {
      name: t('integrations.webhooks'),
      nameKey: 'integrations.webhooks',
      status: 'not_connected',
      description: t('integrations.webhooksDesc'),
      icon: 'plug'
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
          {t('common.connected')}
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
        {t('common.notConnected')}
      </span>
    );
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>{t('integrations.title')}</h1>
      
      <p style={{ 
        marginBottom: '24px', 
        fontSize: '16px', 
        color: '#64748b',
        lineHeight: '1.6'
      }}>
        {t('integrations.description')}
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
                  <i data-lucide={integration.icon} style={{ width: '24px', height: '24px', stroke: '#64748b', strokeWidth: 2 }}></i>
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
              {integration.status === 'connected' ? t('common.connected') : `${t('integrations.connect')} ${integration.name}`}
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
          💡 <strong>{t('common.name')}:</strong> {t('integrations.note')}
        </p>
      </div>
    </div>
  );
}
