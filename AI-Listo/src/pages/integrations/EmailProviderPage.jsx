import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';
import webhooksApi from '../../api/webhooksApi';

export default function EmailProviderPage() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [maskedKey, setMaskedKey] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const config = await webhooksApi.getEmailConfig();
        if (config) {
          setHasExisting(true);
          setFromEmail(config.fromEmail || '');
          setMaskedKey(config.apiKeyMasked || '');
        }
      } catch (err) {
        // No config yet — that's fine
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return () => clearTimeout(t);
  }, [hasExisting, loading]);

  const handleSave = async () => {
    if (!apiKey.trim() && !hasExisting) {
      showError(t('integrations.email.apiKeyRequired'));
      return;
    }
    if (!fromEmail.trim()) {
      showError(t('integrations.email.fromEmailRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sendgrid_api_key: apiKey.trim() || undefined,
        from_email: fromEmail.trim(),
      };

      // If updating and no new key provided, we need to send the key
      if (!apiKey.trim() && hasExisting) {
        showError(t('integrations.email.enterKeyToUpdate'));
        setSaving(false);
        return;
      }

      const result = await webhooksApi.saveEmailConfig(payload);
      setHasExisting(true);
      setMaskedKey(result.apiKeyMasked || '');
      setApiKey(''); // Clear the plaintext key
      showSuccess(t('integrations.email.configSaved'));
    } catch (err) {
      showError(err.message || t('integrations.email.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      await webhooksApi.sendTestEmail();
      showSuccess(t('integrations.email.testSent'));
    } catch (err) {
      showError(err.message || t('integrations.email.testFailed'));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>{t('integrations.emailProvider')}</h1>
      <p style={{ marginBottom: '32px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
        {t('integrations.email.subtitle')}
      </p>

      <div className="crm-section" style={{ padding: '28px', maxWidth: '560px' }}>
        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <i data-lucide="mail" style={{ width: '20px', height: '20px', stroke: '#64748b' }}></i>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text, #1e293b)' }}>SendGrid</span>
          {hasExisting && (
            <span style={{
              padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
              background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac',
            }}>
              {t('integrations.email.configured')}
            </span>
          )}
        </div>

        {/* API Key */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text, #334155)' }}>
            {t('integrations.email.apiKeyLabel')}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasExisting ? maskedKey : 'SG.xxxxxxxxxxxxxxxxxxxxxxxx'}
            className="crm-input"
            style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
          />
          {hasExisting && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {t('integrations.email.currentKey')} <code>{maskedKey}</code> {t('integrations.email.enterNewKey')}
            </p>
          )}
        </div>

        {/* From Email */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text, #334155)' }}>
            {t('integrations.email.fromEmailLabel')}
          </label>
          <input
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="noreply@yourdomain.com"
            className="crm-input"
            style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
          />
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {t('integrations.email.verifiedSenderHint')}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="crm-btn crm-btn-primary" onClick={handleSave} disabled={saving}
            style={{ padding: '10px 24px' }}>
            {saving ? t('integrations.email.saving') : t('integrations.email.saveConfiguration')}
          </button>
          {hasExisting && (
            <button className="crm-btn crm-btn-secondary" onClick={handleTestEmail} disabled={testing}
              style={{ padding: '10px 24px' }}>
              {testing ? t('integrations.email.sending') : t('integrations.email.sendTestEmail')}
            </button>
          )}
        </div>
      </div>

      {/* Help Info */}
      <div className="crm-section" style={{ padding: '20px', maxWidth: '560px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--text, #334155)' }}>
          {t('integrations.email.setupInstructions')}
        </h3>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#64748b', lineHeight: 1.8 }}>
          <li>{t('integrations.email.step1')} <strong>sendgrid.com</strong></li>
          <li>{t('integrations.email.step2')}</li>
          <li>{t('integrations.email.step3')}</li>
          <li>{t('integrations.email.step4')}</li>
          <li>{t('integrations.email.step5')}</li>
          <li>{t('integrations.email.step6')}</li>
        </ol>
      </div>
    </div>
  );
}
