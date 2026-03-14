import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

const STORAGE_PREFIX = 'listo_';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://ai-2-7ikc.onrender.com/api';

function apiOrigin() {
  const u = API_BASE_URL.replace(/\/api\/?$/, '');
  try {
    return new URL(u).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

/**
 * WhatsApp QR flow only — Baileys + Redis + Socket.IO.
 * Original Twilio WhatsApp page remains at /dashboard/whatsapp (WhatsApp.jsx).
 */
export default function WhatsAppQr() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [status, setStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [qrPayload, setQrPayload] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const socketRef = useRef(null);
  const statusLoadAtRef = useRef(0);
  const pendingQrIntervalRef = useRef(null);
  const prevUserIdRef = useRef(null);

  const selectedConv = conversations.find((c) => c.contact_phone === selectedPhone);

  const loadStatus = useCallback(async (options = {}) => {
    const { throttleMs = 0 } = options;
    const now = Date.now();
    if (throttleMs && now - statusLoadAtRef.current < throttleMs) return;
    statusLoadAtRef.current = now;
    try {
      const res = await apiClient.request('/whatsapp-qr/status');
      setStatus(res?.data || res);
    } catch {
      setStatus({ enabled: false, connected: false, status: 'disconnected' });
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiClient.request('/whatsapp-qr/conversations');
      const data = Array.isArray(res?.data) ? res.data : [];
      setConversations(data);
    } catch {
      setConversations([]);
    }
  }, []);

  const loadMessages = useCallback(async (contactPhone) => {
    if (!contactPhone) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    try {
      const encoded = encodeURIComponent(contactPhone);
      const res = await apiClient.request(
        `/whatsapp-qr/conversations/${encoded}/messages`,
      );
      const data = Array.isArray(res?.data) ? res.data : [];
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, []);

  // Reset QR state when user identity changes (e.g. logout then login as different user)
  // so we never show another user's status/conversations or stale "connected" state.
  useEffect(() => {
    const userId = user?.id ?? null;
    if (userId === prevUserIdRef.current) return;
    prevUserIdRef.current = userId;

    if (pendingQrIntervalRef.current) {
      clearInterval(pendingQrIntervalRef.current);
      pendingQrIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setStatus(null);
    setQrPayload(null);
    setSocketConnected(false);
    setConversations([]);
    setSelectedPhone(null);
    setMessages([]);

    if (!isAuthenticated() || authLoading) return;
    loadStatus();
    loadConversations();
  }, [user?.id, isAuthenticated, authLoading, loadStatus, loadConversations]);

  useEffect(() => {
    if (selectedPhone) loadMessages(selectedPhone);
  }, [selectedPhone, loadMessages]);

  // Poll for pending QR when socket is live but no QR yet (fallback if socket event missed)
  useEffect(() => {
    const isConnecting =
      status?.status === 'connecting' &&
      socketConnected &&
      !qrPayload &&
      status?.enabled;
    if (!isConnecting) {
      if (pendingQrIntervalRef.current) {
        clearInterval(pendingQrIntervalRef.current);
        pendingQrIntervalRef.current = null;
      }
      return;
    }
    const fetchPendingQr = async () => {
      try {
        const res = await apiClient.request('/whatsapp-qr/pending-qr');
        const qr = res?.data?.qr;
        if (qr && typeof qr === 'string') setQrPayload(qr);
      } catch {
        // ignore
      }
    };
    fetchPendingQr();
    const interval = setInterval(fetchPendingQr, 2000);
    pendingQrIntervalRef.current = interval;
    return () => {
      clearInterval(interval);
      pendingQrIntervalRef.current = null;
    };
  }, [status?.status, status?.enabled, socketConnected, qrPayload]);

  const openSocket = useCallback(() => {
    const token =
      apiClient.accessToken ||
      localStorage.getItem(STORAGE_PREFIX + 'access_token');
    if (!token || socketRef.current) return Promise.resolve();

    const origin = apiOrigin();
    const socket = io(`${origin}/whatsapp-qr`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('qr', ({ qr }) => setQrPayload(qr));
    socket.on('connected', () => {
      setQrPayload(null);
      loadStatus();
      loadConversations();
    });
    socket.on('disconnected', () => {
      loadStatus({ throttleMs: 3000 });
    });
    socket.on('message', (payload) => {
      loadConversations();
      if (payload.contactPhone === selectedPhone) {
        loadMessages(selectedPhone);
      }
    });

    socketRef.current = socket;
    return new Promise((resolve) => {
      if (socket.connected) resolve();
      else socket.once('connect', resolve);
    });
  }, [loadStatus, loadConversations, loadMessages, selectedPhone]);

  const handleConnect = async () => {
    setConnecting(true);
    setQrPayload(null);
    try {
      // Connect socket first so we're in the room before backend emits QR
      await openSocket();
      await apiClient.request('/whatsapp-qr/connect', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      setQrPayload(null);
      await apiClient.request('/whatsapp-qr/disconnect', { method: 'POST' });
      await loadStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedPhone || sending) return;
    setSending(true);
    try {
      await apiClient.request('/whatsapp-qr/send', {
        method: 'POST',
        body: JSON.stringify({ contactPhone: selectedPhone, message: text }),
      });
      setDraft('');
      await loadMessages(selectedPhone);
      await loadConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleToggleAi = async () => {
    if (!selectedPhone || !selectedConv || toggleLoading) return;
    const next = !(selectedConv.ai_enabled && selectedConv.owner_type === 'ai');
    setToggleLoading(true);
    try {
      const encoded = encodeURIComponent(selectedPhone);
      await apiClient.request(
        `/whatsapp-qr/conversations/${encoded}/toggle-ai`,
        {
          method: 'POST',
          body: JSON.stringify({ aiEnabled: next }),
        },
      );
      await loadConversations();
    } catch (e) {
      console.error(e);
    } finally {
      setToggleLoading(false);
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString();
  };

  const enabled = status?.enabled !== false;
  const connected = status?.connected === true;

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>
        {t('whatsapp.title', 'WhatsApp')} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>(QR)</span>
      </h1>

      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>QR connection</h2>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              background: connected ? '#f0fdf4' : '#fef2f2',
              color: connected ? '#16a34a' : '#dc2626',
            }}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {!enabled && (
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
            Set <code>WHATSAPP_QR_ENABLED=true</code> and <code>REDIS_URL</code> on the backend.
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {!connected && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting || !enabled}
              style={{
                padding: '10px 20px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                background: '#25D366',
                color: '#fff',
                cursor: connecting ? 'not-allowed' : 'pointer',
                opacity: connecting ? 0.7 : 1,
              }}
            >
              {connecting ? 'Starting…' : 'Connect & show QR'}
            </button>
          )}
          {connected && (
            <button
              type="button"
              onClick={handleDisconnect}
              style={{
                padding: '10px 20px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Disconnect
            </button>
          )}
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Socket: {socketConnected ? 'live' : '—'} · {status?.phone && `Device: ${status.phone}`}
          </span>
        </div>

        {qrPayload && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'inline-block' }}>
            <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64748b' }}>Scan with WhatsApp</div>
            <QRCodeSVG value={qrPayload} size={220} level="M" />
          </div>
        )}
      </div>

      <div
        className="crm-section"
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <h2 style={{ margin: '16px', fontSize: '18px', fontWeight: 600 }}>QR inbox</h2>
        <div style={{ display: 'flex', flexDirection: 'row', height: '520px' }}>
          <div style={{ width: '280px', borderRight: '1px solid #e5e7eb', overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
                {connected ? 'No conversations yet.' : 'Connect first.'}
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedPhone(c.contact_phone)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    background: selectedPhone === c.contact_phone ? '#eff6ff' : 'transparent',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.lead_name || c.contact_phone}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {c.contact_phone}
                    {c.unread_count > 0 && (
                      <span style={{ marginLeft: '8px', color: '#2563eb' }}>({c.unread_count})</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {selectedConv && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedConv.owner_type === 'human' && !selectedConv.ai_enabled
                    ? 'AI off / agent thread'
                    : selectedConv.ai_enabled
                      ? 'AI on'
                      : 'AI off'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleAi}
                  disabled={toggleLoading}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: selectedConv.ai_enabled ? '#f1f5f9' : '#25D366',
                    color: selectedConv.ai_enabled ? '#475569' : '#fff',
                    cursor: toggleLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {toggleLoading ? '…' : selectedConv.ai_enabled ? 'Turn AI off' : 'Turn AI on'}
                </button>
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {messagesLoading ? (
                <div style={{ color: '#64748b' }}>Loading…</div>
              ) : !selectedPhone ? (
                <div style={{ color: '#64748b' }}>Select a conversation</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      marginBottom: '12px',
                      textAlign: m.direction === 'outbound' ? 'right' : 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        maxWidth: '85%',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        background: m.direction === 'outbound' ? '#dcf8c6' : '#f1f5f9',
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {m.body || `[${m.message_type}]`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      {m.sender_type} · {formatTime(m.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedPhone && connected && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message…"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  style={{
                    padding: '10px 18px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    background: '#25D366',
                    color: '#fff',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    opacity: sending ? 0.7 : 1,
                  }}
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="crm-section" style={{ marginTop: '24px' }}>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Classic Twilio WhatsApp (leads + property cards) stays on <strong>/dashboard/whatsapp</strong>. This page is QR-only.
        </p>
      </div>
    </div>
  );
}
