import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  getCallbackUrl,
  getAppSettings,
  saveAppSettings,
  getInstagramAuthUrl,
  getInstagramStatus,
  disconnectInstagram,
  getInstagramConversations,
  getInstagramLeadMessages,
  sendInstagramDm,
} from '../../api/instagramApi';
import { useNotification } from '../../context/NotificationContext';

export default function Instagram() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();

  const [status, setStatus] = useState(null);
  const [appSettings, setAppSettings] = useState({ hasCredentials: false });
  const [callbackUrl, setCallbackUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Meta app form (and "editing" when user already has credentials)
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);

  // Chat
  const [conversations, setConversations] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const data = await getInstagramStatus();
      setStatus(data);
    } catch (err) {
      setError(err?.message || t('common.error'));
      setStatus({ connected: false, instagramUsername: null });
    }
  }, [t]);

  const loadAppSettings = useCallback(async () => {
    try {
      const data = await getAppSettings();
      setAppSettings(data);
    } catch {
      setAppSettings({ hasCredentials: false });
    }
  }, []);

  const loadCallbackUrl = useCallback(async () => {
    try {
      const url = await getCallbackUrl();
      setCallbackUrl(url);
    } catch {
      setCallbackUrl('');
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const list = await getInstagramConversations();
      setConversations(list);
    } catch {
      setConversations([]);
    }
  }, []);

  const loadMessages = useCallback(async (leadId) => {
    if (!leadId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    try {
      const list = await getInstagramLeadMessages(leadId);
      setMessages(list);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadStatus(), loadAppSettings(), loadCallbackUrl()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadStatus, loadAppSettings, loadCallbackUrl]);

  useEffect(() => {
    if (status?.connected) loadConversations();
  }, [status?.connected, loadConversations]);

  useEffect(() => {
    if (selectedLead?.leadId) loadMessages(selectedLead.leadId);
  }, [selectedLead?.leadId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // After OAuth redirect
  useEffect(() => {
    const fromConnect = searchParams.get('instagram') === 'connected';
    if (fromConnect) {
      setSearchParams({}, { replace: true });
      showSuccess(t('instagram.connectedSuccess'));
      loadStatus();
      loadConversations();
    }
  }, [searchParams, setSearchParams, showSuccess, t, loadStatus, loadConversations]);

  const handleSaveCredentials = async () => {
    if (!appId.trim() || !appSecret.trim()) {
      showError(t('instagram.appIdAppSecretRequired'));
      return;
    }
    setSavingCredentials(true);
    setError(null);
    try {
      await saveAppSettings(appId.trim(), appSecret.trim());
      showSuccess(editingCredentials ? t('instagram.credentialsUpdated') : t('instagram.credentialsSaved'));
      setAppId('');
      setAppSecret('');
      setEditingCredentials(false);
      await loadAppSettings();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleConnectInstagram = async () => {
    setConnecting(true);
    setError(null);
    try {
      const url = await getInstagramAuthUrl();
      if (url) {
        window.location.href = url;
        return;
      }
      showError(t('instagram.authUrlError'));
    } catch (err) {
      showError(err?.message || t('instagram.connectError'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(t('instagram.disconnectConfirm'))) return;
    setDisconnecting(true);
    setError(null);
    try {
      await disconnectInstagram();
      showSuccess(t('instagram.disconnected'));
      await loadStatus();
      setConversations([]);
      setSelectedLead(null);
      setMessages([]);
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendMessage = async () => {
    const text = draft.trim();
    if (!text || !selectedLead?.leadId || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendInstagramDm(selectedLead.leadId, text);
      setDraft('');
      await loadMessages(selectedLead.leadId);
      await loadConversations();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const d = new Date(dateString);
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return t('instagram.justNow');
    if (diff < 60) return `${diff}m`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [status, loading, selectedLead, conversations]);

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>
        {t('instagram.title')}
      </h1>

      <div
        className="crm-section"
        style={{
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '16px',
          maxWidth: appSettings.hasCredentials && status?.connected ? 'none' : '520px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i data-lucide="instagram" style={{ width: '22px', height: '22px', stroke: '#fff', strokeWidth: 2 }}></i>
          </div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{t('instagram.dmHeader')}</h2>
        </div>

        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
          {t('instagram.dmSubtext')}
        </p>

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              fontSize: '14px',
              width: '100%',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: '#64748b', margin: 0 }}>{t('common.loading')}</p>
        ) : !appSettings.hasCredentials || editingCredentials ? (
          /* Step 1 or Update: Meta app credentials */
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {editingCredentials && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{t('instagram.updateMetaCredentials')}</span>
                <button
                  type="button"
                  onClick={() => { setEditingCredentials(false); setAppId(''); setAppSecret(''); setError(null); }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              {t('instagram.metaAppHint')}
            </p>
            {callbackUrl && (
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  {t('instagram.callbackUrlLabel')}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={callbackUrl}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                      background: '#f8fafc',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(callbackUrl); showSuccess(t('common.copied')); }}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: '#fff',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {t('common.copy')}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('instagram.metaAppId')}</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1234567890123456"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('instagram.metaAppSecret')}</label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleSaveCredentials}
              disabled={savingCredentials}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: savingCredentials ? 'wait' : 'pointer',
              }}
            >
              {savingCredentials ? t('common.loading') : (appSettings.hasCredentials ? t('instagram.updateCredentials') : t('instagram.saveCredentials'))}
            </button>
          </div>
        ) : !status?.connected ? (
          /* Step 2: Connect Instagram */
          <>
            {callbackUrl && (
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                {t('instagram.addCallbackInMeta')} <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{callbackUrl}</code>
              </p>
            )}
            <button
              type="button"
              onClick={() => setEditingCredentials(true)}
              style={{
                padding: '8px 0',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {t('instagram.updateMetaCredentials')}
            </button>
            <button
              type="button"
              onClick={handleConnectInstagram}
              disabled={connecting}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: connecting ? 'wait' : 'pointer',
                minHeight: '44px',
                opacity: connecting ? 0.8 : 1,
              }}
            >
              {connecting ? t('common.loading') : t('instagram.connectInstagram')}
            </button>
          </>
        ) : (
          /* Step 3: Connected + Chat */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'var(--card, #f8fafc)',
                  border: '1px solid var(--border, #e5e7eb)',
                  flex: '1 1 200px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  {t('instagram.connectedAccount')}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text, #1e293b)' }}>
                  @{status.instagramUsername || t('instagram.connected')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCredentials(true)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: '#64748b',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {t('instagram.updateMetaCredentials')}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: disconnecting ? 'not-allowed' : 'pointer',
                  opacity: disconnecting ? 0.7 : 1,
                }}
              >
                {disconnecting ? t('common.loading') : t('instagram.disconnect')}
              </button>
            </div>

            {/* Chat panel */}
            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#fff',
                display: 'flex',
                flexDirection: 'row',
                height: '480px',
              }}
            >
              <div
                style={{
                  width: '260px',
                  minWidth: '260px',
                  borderRight: '1px solid #e5e7eb',
                  overflowY: 'auto',
                  flexShrink: 0,
                }}
              >
                <div style={{ padding: '12px', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #f1f5f9' }}>
                  {t('instagram.conversations')}
                </div>
                {conversations.length === 0 ? (
                  <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
                    {t('instagram.noConversations')}
                  </div>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.leadId}
                      onClick={() => setSelectedLead(c)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        background: selectedLead?.leadId === c.leadId ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {c.lastMessage ? (c.lastMessage.slice(0, 40) + (c.lastMessage.length > 40 ? '…' : '')) : '—'}
                      </div>
                      {c.lastMessageAt && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{formatTimeAgo(c.lastMessageAt)}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {selectedLead ? (
                  <>
                    <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600' }}>
                      {selectedLead.name}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {messagesLoading ? (
                        <p style={{ color: '#64748b', margin: 0 }}>{t('common.loading')}</p>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            style={{
                              alignSelf: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                              maxWidth: '80%',
                              padding: '8px 12px',
                              borderRadius: '12px',
                              background: msg.direction === 'outbound' ? 'linear-gradient(135deg, #e6683c 0%, #dc2743 100%)' : '#f1f5f9',
                              color: msg.direction === 'outbound' ? '#fff' : '#1e293b',
                              fontSize: '14px',
                            }}
                          >
                            <div>{msg.body || '—'}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{formatTime(msg.createdAt)}</div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                        placeholder={t('instagram.typeMessage')}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '14px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!draft.trim() || sending}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: draft.trim() && !sending ? 'pointer' : 'not-allowed',
                          opacity: draft.trim() && !sending ? 1 : 0.6,
                        }}
                      >
                        {sending ? t('common.loading') : t('instagram.send')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
                    {t('instagram.selectConversation')}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
