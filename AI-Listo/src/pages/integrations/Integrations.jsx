import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Integrations() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Initialize Lucide icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  const integrations = [
    {
      name: t('integrations.emailProvider'),
      status: 'available',
      description: t('integrations.emailProviderDesc'),
      icon: 'mail',
      path: '/dashboard/integrations/email',
    },
    {
      name: t('integrations.zapier'),
      status: 'available',
      description: t('integrations.zapierDescUpdated'),
      icon: 'zap',
      path: '/dashboard/integrations/zapier',
    },
    {
      name: t('integrations.webhooks'),
      status: 'available',
      description: t('integrations.webhooksDescUpdated'),
      icon: 'plug',
      path: '/dashboard/integrations/webhooks',
    }
  ];

  const getStatusBadge = (status) => {
    if (status === 'available') {
      return (
        <span style={{
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          background: '#eff6ff',
          color: '#2563eb',
          border: '1px solid #bfdbfe'
        }}>
          {t('integrations.available')}
        </span>
      );
    }
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
    if (status === 'coming_soon') {
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
          {t('integrations.comingSoon')}
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
          <div key={index} className="crm-section"
            style={{ cursor: integration.path ? 'pointer' : 'default' }}
            onClick={() => { if (integration.path) navigate(integration.path); }}
          >
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

            {integration.path && (
              <button
                className="crm-btn crm-btn-primary integration-connect-btn"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  fontSize: '16px',
                  minHeight: '48px'
                }}
                onClick={(e) => { e.stopPropagation(); navigate(integration.path); }}
              >
                {t('integrations.configure')} {integration.name}
              </button>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
        {t('integrations.messagingHint')}
      </p>
    </div>
  );
}
