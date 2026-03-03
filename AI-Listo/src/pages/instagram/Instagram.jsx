import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Instagram() {
  const { t } = useTranslation();

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  const handleConnectInstagram = () => {
    // Modal logic to be added in future phase
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>
        {t('instagram.title')}
      </h1>

      <div className="crm-section" style={{
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '16px',
        maxWidth: '520px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i data-lucide="instagram" style={{ width: '22px', height: '22px', stroke: '#fff', strokeWidth: 2 }}></i>
          </div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {t('instagram.dmHeader')}
          </h2>
        </div>

        <p style={{
          color: '#64748b',
          fontSize: '14px',
          lineHeight: 1.5,
          margin: 0
        }}>
          {t('instagram.dmSubtext')}
        </p>

        <button
          type="button"
          onClick={handleConnectInstagram}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            minHeight: '44px'
          }}
        >
          {t('instagram.connectInstagram')}
        </button>
      </div>
    </div>
  );
}
