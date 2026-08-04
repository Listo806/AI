import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';
import webhooksApi from '../../api/webhooksApi';

const SUPPORTED_EVENTS = [
  { value: 'lead.created', labelKey: 'eventLeadCreated' },
  { value: 'lead.status.changed', labelKey: 'eventLeadStatusChanged' },
  { value: 'lead.qualified', labelKey: 'eventLeadQualified' },
  { value: 'property.created', labelKey: 'eventPropertyCreated' },
];

export default function WebhooksPage() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();

  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('endpoints');
  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [testingId, setTestingId] = useState(null);

  // Modal form state
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState([]);
  const [formActive, setFormActive] = useState(true);
  const [formSecret, setFormSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const data = await webhooksApi.getWebhooks();
      setWebhooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
      setWebhooks([]);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await webhooksApi.getWebhookLogs(100);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load webhook logs:', err);
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchWebhooks(), fetchLogs()]);
      setLoading(false);
    };
    load();
  }, []);

  // ── Modal ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingWebhook(null);
    setFormUrl('');
    setFormEvents([]);
    setFormActive(true);
    setFormSecret('');
    setShowModal(true);
  };

  const openEditModal = (webhook) => {
    setEditingWebhook(webhook);
    setFormUrl(webhook.url);
    setFormEvents(Array.isArray(webhook.events) ? [...webhook.events] : []);
    setFormActive(webhook.isActive);
    setFormSecret(webhook.secretToken || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWebhook(null);
  };

  const toggleEventCheckbox = (event) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleSave = async () => {
    if (!formUrl.trim()) { showError(t('integrations.webhooksPage.urlRequired')); return; }
    if (formEvents.length === 0) { showError(t('integrations.webhooksPage.selectEvent')); return; }

    setSaving(true);
    try {
      const payload = {
        url: formUrl.trim(),
        events: formEvents,
        is_active: formActive,
        secret_token: formSecret.trim() || undefined,
      };

      if (editingWebhook) {
        await webhooksApi.updateWebhook(editingWebhook.id, payload);
        showSuccess(t('integrations.webhooksPage.updated'));
      } else {
        await webhooksApi.createWebhook(payload);
        showSuccess(t('integrations.webhooksPage.created'));
      }

      closeModal();
      await fetchWebhooks();
    } catch (err) {
      showError(err.message || t('integrations.webhooksPage.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────

  const handleToggle = async (id) => {
    try {
      await webhooksApi.toggleWebhook(id);
      await fetchWebhooks();
    } catch (err) {
      showError(t('integrations.webhooksPage.toggleFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('integrations.webhooksPage.deleteConfirm'))) return;
    try {
      await webhooksApi.deleteWebhook(id);
      showSuccess(t('integrations.webhooksPage.deleted'));
      await fetchWebhooks();
    } catch (err) {
      showError(t('integrations.webhooksPage.deleteFailed'));
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const result = await webhooksApi.testWebhook(id);
      if (result.success) {
        showSuccess(t('integrations.webhooksPage.testSuccess', { statusCode: result.statusCode }));
      } else {
        showError(t('integrations.webhooksPage.testFailed', { message: result.errorMessage || t('integrations.webhooksPage.unknownError') }));
      }
      await fetchLogs();
    } catch (err) {
      showError(t('integrations.webhooksPage.testSendFailed'));
    } finally {
      setTestingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        {t('integrations.webhooksPage.loading')}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>{t('integrations.webhooks')}</h1>
        <button className="crm-btn crm-btn-primary" onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          + {t('integrations.webhooksPage.addWebhook')}
        </button>
      </div>

      <p style={{ marginBottom: '24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
        {t('integrations.webhooksPage.pageDescription')}
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        {['endpoints', 'logs'].map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'logs') fetchLogs(); }}
            style={{
              padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              border: 'none', background: 'none',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === tab ? '#2563eb' : '#64748b',
              marginBottom: '-2px',
            }}>
            {tab === 'endpoints' ? t('integrations.webhooksPage.tabEndpoints') : t('integrations.webhooksPage.tabLogs')}
          </button>
        ))}
      </div>

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div>
          {webhooks.length === 0 ? (
            <div className="crm-section" style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
              <div style={{
                width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '12px',
                background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', color: '#cbd5e1',
              }}>
                &#x26A1;
              </div>
              <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#64748b' }}>{t('integrations.webhooksPage.noWebhooks')}</p>
              <p style={{ fontSize: '14px' }}>{t('integrations.webhooksPage.noWebhooksHint')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {webhooks.map((wh) => (
                <div key={wh.id} className="crm-section" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Left: URL + Events */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: wh.isActive ? '#22c55e' : '#94a3b8',
                          flexShrink: 0,
                        }} />
                        <code style={{ fontSize: '14px', fontWeight: 500, wordBreak: 'break-all', color: 'var(--text, #1e293b)' }}>
                          {wh.url}
                        </code>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(Array.isArray(wh.events) ? wh.events : []).map((ev) => (
                          <span key={ev} style={{
                            padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500,
                            background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                          }}>
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      <button className="crm-btn crm-btn-secondary" onClick={() => handleTest(wh.id)}
                        disabled={testingId === wh.id}
                        style={{ padding: '6px 12px', fontSize: '13px' }}>
                        {testingId === wh.id ? t('integrations.webhooksPage.sending') : t('integrations.webhooksPage.test')}
                      </button>
                      <button className="crm-btn crm-btn-secondary" onClick={() => handleToggle(wh.id)}
                        style={{ padding: '6px 12px', fontSize: '13px' }}>
                        {wh.isActive ? t('integrations.webhooksPage.disable') : t('integrations.webhooksPage.enable')}
                      </button>
                      <button className="crm-btn crm-btn-secondary" onClick={() => openEditModal(wh)}
                        style={{ padding: '6px 12px', fontSize: '13px' }}>
                        {t('integrations.webhooksPage.edit')}
                      </button>
                      <button className="crm-btn crm-btn-secondary" onClick={() => handleDelete(wh.id)}
                        style={{ padding: '6px 12px', fontSize: '13px', color: '#ef4444' }}>
                        {t('integrations.webhooksPage.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          {logs.length === 0 ? (
            <div className="crm-section" style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#64748b' }}>{t('integrations.webhooksPage.noLogs')}</p>
              <p style={{ fontSize: '14px' }}>{t('integrations.webhooksPage.noLogsHint')}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>{t('integrations.webhooksPage.colTimestamp')}</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>{t('integrations.webhooksPage.colEvent')}</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>{t('integrations.webhooksPage.colUrl')}</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>{t('integrations.webhooksPage.colStatus')}</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>{t('integrations.webhooksPage.colTime')}</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>{t('integrations.webhooksPage.colError')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 500,
                          background: '#f1f5f9', color: '#334155',
                        }}>
                          {log.eventName}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {log.endpointUrl}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                          background: log.success ? '#f0fdf4' : '#fef2f2',
                          color: log.success ? '#16a34a' : '#dc2626',
                          border: `1px solid ${log.success ? '#86efac' : '#fca5a5'}`,
                        }}>
                          {log.statusCode || t('integrations.webhooksPage.statusErr')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {log.responseTimeMs != null ? `${log.responseTimeMs}ms` : '-'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#ef4444', fontSize: '13px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.errorMessage || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
          justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)',
        }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '32px',
            width: '100%', maxWidth: '520px', margin: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 600 }}>
              {editingWebhook ? t('integrations.webhooksPage.editWebhook') : t('integrations.webhooksPage.addWebhook')}
            </h2>

            {/* URL */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text, #334155)' }}>
                {t('integrations.webhooksPage.webhookUrl')}
              </label>
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="crm-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
              />
            </div>

            {/* Events */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '10px', color: 'var(--text, #334155)' }}>
                {t('integrations.webhooksPage.events')}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SUPPORTED_EVENTS.map((ev) => (
                  <label key={ev.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text, #334155)' }}>
                    <input
                      type="checkbox"
                      checked={formEvents.includes(ev.value)}
                      onChange={() => toggleEventCheckbox(ev.value)}
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                    />
                    <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>{ev.value}</code>
                    <span style={{ color: '#64748b' }}>- {t(`integrations.webhooksPage.${ev.labelKey}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Secret Token */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text, #334155)' }}>
                {t('integrations.webhooksPage.secretToken')} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{t('integrations.webhooksPage.optional')}</span>
              </label>
              <input
                type="text"
                value={formSecret}
                onChange={(e) => setFormSecret(e.target.value)}
                placeholder={t('integrations.webhooksPage.secretPlaceholder')}
                className="crm-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                {t('integrations.webhooksPage.sentAsPrefix')} <code>X-CORTEXA-Webhook-Secret</code> {t('integrations.webhooksPage.sentAsSuffix')}
              </p>
            </div>

            {/* Active Toggle */}
            <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text, #334155)' }}>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#22c55e' }}
                />
                {t('integrations.webhooksPage.active')}
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="crm-btn crm-btn-secondary" onClick={closeModal} style={{ padding: '10px 20px' }}>
                {t('integrations.webhooksPage.cancel')}
              </button>
              <button className="crm-btn crm-btn-primary" onClick={handleSave} disabled={saving}
                style={{ padding: '10px 24px' }}>
                {saving ? t('integrations.webhooksPage.saving') : editingWebhook ? t('integrations.webhooksPage.update') : t('integrations.webhooksPage.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
