import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../context/NotificationContext';
import webhooksApi from '../../api/webhooksApi';

const SUPPORTED_EVENTS = [
  { value: 'lead.created', label: 'Lead Created', desc: 'Fires when a new lead is added to the CRM' },
  { value: 'lead.status.changed', label: 'Lead Status Changed', desc: 'Fires when a lead status is updated' },
  { value: 'lead.qualified', label: 'Lead Qualified', desc: 'Fires when a lead becomes qualified' },
  { value: 'property.created', label: 'Property Created', desc: 'Fires when a new property is listed' },
];

export default function ZapierPage() {
  const { showSuccess, showError } = useNotification();

  const [zapierHooks, setZapierHooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHook, setEditingHook] = useState(null);
  const [testingId, setTestingId] = useState(null);

  // Form state
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState([]);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchHooks = useCallback(async () => {
    try {
      const all = await webhooksApi.getWebhooks();
      const arr = Array.isArray(all) ? all : [];
      // Filter to only show Zapier-looking URLs
      setZapierHooks(arr.filter((w) => w.url && w.url.includes('zapier.com')));
    } catch (err) {
      console.error('Failed to load Zapier connections:', err);
      setZapierHooks([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchHooks();
      setLoading(false);
    };
    load();
  }, []);

  // ── Form ───────────────────────────────────────────────────────────

  const openAddForm = () => {
    setEditingHook(null);
    setFormUrl('');
    setFormEvents([]);
    setFormActive(true);
    setShowForm(true);
  };

  const openEditForm = (hook) => {
    setEditingHook(hook);
    setFormUrl(hook.url);
    setFormEvents(Array.isArray(hook.events) ? [...hook.events] : []);
    setFormActive(hook.isActive);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingHook(null);
  };

  const toggleEvent = (event) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleSave = async () => {
    if (!formUrl.trim()) { showError('Zapier webhook URL is required'); return; }
    if (!formUrl.includes('zapier.com') && !formUrl.includes('hooks.zapier.com')) {
      showError('Please enter a valid Zapier webhook URL (from "Webhooks by Zapier")');
      return;
    }
    if (formEvents.length === 0) { showError('Select at least one event'); return; }

    setSaving(true);
    try {
      const payload = { url: formUrl.trim(), events: formEvents, is_active: formActive };

      if (editingHook) {
        await webhooksApi.updateWebhook(editingHook.id, payload);
        showSuccess('Zapier connection updated');
      } else {
        await webhooksApi.createWebhook(payload);
        showSuccess('Zapier connected');
      }

      closeForm();
      await fetchHooks();
    } catch (err) {
      showError(err.message || 'Failed to save Zapier connection');
    } finally {
      setSaving(false);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────

  const handleToggle = async (id) => {
    try {
      await webhooksApi.toggleWebhook(id);
      await fetchHooks();
    } catch (err) {
      showError('Failed to toggle connection');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Disconnect this Zapier integration?')) return;
    try {
      await webhooksApi.deleteWebhook(id);
      showSuccess('Zapier disconnected');
      await fetchHooks();
    } catch (err) {
      showError('Failed to disconnect');
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const result = await webhooksApi.testWebhook(id);
      if (result.success) {
        showSuccess('Test event sent to Zapier — check your Zap history');
      } else {
        showError(`Test failed: ${result.errorMessage || 'Unknown error'}`);
      }
    } catch (err) {
      showError('Failed to send test event');
    } finally {
      setTestingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>Zapier</h1>
      <p style={{ marginBottom: '32px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
        Connect your CRM to 5,000+ apps through Zapier. When events happen in your CRM,
        Zapier can automatically send data to Gmail, Slack, Google Sheets, and more.
      </p>

      {/* How It Works */}
      <div className="crm-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text, #1e293b)' }}>
          How to Connect
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { step: '1', text: 'Go to zapier.com and create a new Zap' },
            { step: '2', text: 'Choose "Webhooks by Zapier" as the trigger' },
            { step: '3', text: 'Select "Catch Hook" and copy the URL' },
            { step: '4', text: 'Paste the URL below and select your events' },
          ].map((s) => (
            <div key={s.step} style={{
              flex: '1 1 200px', padding: '16px', background: '#f8fafc',
              borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, flexShrink: 0,
              }}>
                {s.step}
              </span>
              <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connections */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text, #1e293b)' }}>
          Your Connections {zapierHooks.length > 0 && <span style={{ fontWeight: 400, color: '#94a3b8' }}>({zapierHooks.length})</span>}
        </h3>
        <button className="crm-btn crm-btn-primary" onClick={openAddForm}
          style={{ padding: '10px 20px' }}>
          + Connect Zapier
        </button>
      </div>

      {zapierHooks.length === 0 && !showForm ? (
        <div className="crm-section" style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '12px',
            background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
          }}>
            &#x26A1;
          </div>
          <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#64748b' }}>No Zapier connections yet</p>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>Click "Connect Zapier" to set up your first automation.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {zapierHooks.map((hook) => (
            <div key={hook.id} className="crm-section" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: hook.isActive ? '#22c55e' : '#94a3b8', flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text, #1e293b)' }}>
                      Zapier Webhook
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      background: hook.isActive ? '#f0fdf4' : '#f1f5f9',
                      color: hook.isActive ? '#16a34a' : '#94a3b8',
                    }}>
                      {hook.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px', wordBreak: 'break-all' }}>
                    {hook.url}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(Array.isArray(hook.events) ? hook.events : []).map((ev) => (
                      <span key={ev} style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500,
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                      }}>
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <button className="crm-btn crm-btn-secondary" onClick={() => handleTest(hook.id)}
                    disabled={testingId === hook.id}
                    style={{ padding: '6px 12px', fontSize: '13px' }}>
                    {testingId === hook.id ? 'Sending...' : 'Send Test'}
                  </button>
                  <button className="crm-btn crm-btn-secondary" onClick={() => handleToggle(hook.id)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}>
                    {hook.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button className="crm-btn crm-btn-secondary" onClick={() => openEditForm(hook)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}>
                    Edit
                  </button>
                  <button className="crm-btn crm-btn-secondary" onClick={() => handleDelete(hook.id)}
                    style={{ padding: '6px 12px', fontSize: '13px', color: '#ef4444' }}>
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
          justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)',
        }} onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '32px',
            width: '100%', maxWidth: '520px', margin: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>
              {editingHook ? 'Edit Zapier Connection' : 'Connect Zapier'}
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#94a3b8' }}>
              Paste the webhook URL from your Zapier "Catch Hook" trigger.
            </p>

            {/* URL */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text, #334155)' }}>
                Zapier Webhook URL
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
                Which events should trigger this Zap?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SUPPORTED_EVENTS.map((ev) => (
                  <label key={ev.value} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                    padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                    background: formEvents.includes(ev.value) ? '#eff6ff' : '#fff',
                    transition: 'background 0.15s',
                  }}>
                    <input
                      type="checkbox"
                      checked={formEvents.includes(ev.value)}
                      onChange={() => toggleEvent(ev.value)}
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text, #334155)' }}>{ev.label}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{ev.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
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
                Active
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="crm-btn crm-btn-secondary" onClick={closeForm} style={{ padding: '10px 20px' }}>
                Cancel
              </button>
              <button className="crm-btn crm-btn-primary" onClick={handleSave} disabled={saving}
                style={{ padding: '10px 24px' }}>
                {saving ? 'Saving...' : editingHook ? 'Update' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
