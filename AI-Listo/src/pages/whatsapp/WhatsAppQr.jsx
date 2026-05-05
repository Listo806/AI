import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { FiSmile, FiMic } from 'react-icons/fi';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

function normalizePhoneForMatch(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length > 0 ? `+${digits}` : '';
}

const EMOJI_LIST = ['😀','😊','😂','🥲','😍','🥰','😘','👍','👋','❤️','🙏','🎉','🔥','✨','💯','😅','🤔','👀','🙌','💪','😎','🤝','📌','✅','❌','⚠️','💬','📱','🏠','📞'];

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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [reconnecting, setReconnecting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const socketRef = useRef(null);
  const statusLoadAtRef = useRef(0);
  const pendingQrIntervalRef = useRef(null);
  const prevUserIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedPhoneRef = useRef(null);
  const chatInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const selectedConv = conversations.find((c) => c.contact_phone === selectedPhone);

  useEffect(() => {
    selectedPhoneRef.current = selectedPhone;
  }, [selectedPhone]);

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

  // Open conversation from URL (e.g. from Leads page "Open in WhatsApp Inbox")
  const contactPhoneParam = searchParams.get('contactPhone');
  useEffect(() => {
    if (!contactPhoneParam || conversations.length === 0) return;
    const normalized = normalizePhoneForMatch(contactPhoneParam);
    if (!normalized) return;
    const match = conversations.find(
      (c) => normalizePhoneForMatch(c.contact_phone) === normalized
    );
    if (match) {
      setSelectedPhone(match.contact_phone);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('contactPhone');
        return next;
      }, { replace: true });
    }
  }, [contactPhoneParam, conversations]);

  // Auto-scroll message box to bottom when messages change (like common chat apps)
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      const current = selectedPhoneRef.current;
      if (payload.contactPhone !== current || !current) return;
      // Only append inbound (received) messages; our own sent messages are added optimistically
      if (payload.direction === 'inbound') {
        setMessages((prev) => [
          ...prev,
          {
            id: `rcvd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            direction: payload.direction,
            sender_type: payload.senderType,
            body: payload.body,
            message_type: payload.messageType || 'text',
            created_at: payload.createdAt,
          },
        ]);
      }
    });

    socketRef.current = socket;
    return new Promise((resolve) => {
      if (socket.connected) resolve();
      else socket.once('connect', resolve);
    });
  }, [loadStatus, loadConversations]);

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

  const handleReconnect = async () => {
    setReconnecting(true);
    setQrPayload(null);
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      await apiClient.request('/whatsapp-qr/disconnect', { method: 'POST' });
      await openSocket();
      await apiClient.request('/whatsapp-qr/connect', { method: 'POST' });
      await loadStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setReconnecting(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    setDraft((prev) => prev + emoji);
    chatInputRef.current?.focus();
  };

  const handleVoiceStart = useCallback(async () => {
    if (!selectedPhone || sendingVoice || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = reader.result?.split(',')[1];
          if (!base64) return;
          setSendingVoice(true);
          try {
            await apiClient.request('/whatsapp-qr/send-voice', {
              method: 'POST',
              body: JSON.stringify({ contactPhone: selectedPhone, audioBase64: base64 }),
            });
            setMessages((prev) => [
              ...prev,
              {
                id: `voice-${Date.now()}`,
                direction: 'outbound',
                sender_type: 'agent',
                body: '[Voice message]',
                message_type: 'audio',
                created_at: new Date().toISOString(),
              },
            ]);
            loadConversations();
          } catch (e) {
            console.error(e);
          } finally {
            setSendingVoice(false);
          }
        };
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (e) {
      console.error('Voice recording not available:', e);
    }
  }, [selectedPhone, sendingVoice, recording]);

  const handleVoiceStop = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
    }
  }, [recording]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedPhone || sending) return;
    const tempId = `send-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const optimisticMsg = {
      id: tempId,
      direction: 'outbound',
      sender_type: 'agent',
      body: text,
      message_type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft('');
    setSending(true);
    try {
      await apiClient.request('/whatsapp-qr/send', {
        method: 'POST',
        body: JSON.stringify({ contactPhone: selectedPhone, message: text }),
      });
      loadConversations();
    } catch (e) {
      console.error(e);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString();
  };

  const lastSyncLabel = () => {
    const at = status?.connected_at || status?.updated_at;
    if (!at) return '—';
    const ms = Date.now() - new Date(at).getTime();
    if (ms < 60000) return t('whatsappQr.justNow');
    if (ms < 3600000)
      return t('whatsappQr.minAgo', { count: Math.floor(ms / 60000) });
    return formatTime(at);
  };

  const enabled = status?.enabled !== false;
  const connected = status?.connected === true;

  return (
    <div style={{ width: '100%', maxWidth: '900px', overflowX: 'hidden', boxSizing: 'border-box', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '12px', fontSize: '28px', fontWeight: 700 }}>
        {t('whatsappQr.pageTitle')}
      </h1>
      <p style={{ marginBottom: '28px', fontSize: '15px', color: '#475569', lineHeight: 1.6 }}>
        {t('whatsappQr.descriptionLine1')}
        <br />
        <br />
        {t('whatsappQr.descriptionLine2')}
      </p>

      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
          {t('whatsappQr.howToConnect')}
        </h2>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: 1.8 }}>
          <li>{t('whatsappQr.howStep1')}</li>
          <li>{t('whatsappQr.howStep2')}</li>
          <li>{t('whatsappQr.howStep3')}</li>
          <li>{t('whatsappQr.howStep4')}</li>
          <li>{t('whatsappQr.howStep5')}</li>
        </ol>
      </section>

      <div
        className="crm-section"
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          background: '#fff',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
          {t('whatsappQr.connectionTitle')}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              background: connected ? '#dcfce7' : '#fee2e2',
              color: connected ? '#166534' : '#b91c1c',
            }}
          >
            {t('whatsappQr.statusLabel')}: {connected ? t('whatsappQr.connected') : t('whatsappQr.disconnected')}
          </span>
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
              {connecting ? t('whatsappQr.starting') : t('whatsappQr.connectShowQr')}
            </button>
          )}
        </div>
        {!enabled && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#fffbeb',
              borderLeft: '4px solid #f59e0b',
              fontSize: '14px',
              color: '#92400e',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ display: 'block', marginBottom: '4px' }}>
              {t('whatsappQr.setupRequired')}
            </strong>
            <span style={{ display: 'block', marginTop: '6px' }}>
              {t('whatsappQr.setupHint')}
            </span>
          </div>
        )}
      </div>

      {qrPayload && (
        <div
          style={{
            marginBottom: '24px',
            padding: '28px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 500, color: '#334155' }}>
            {t('whatsappQr.scanQrTitle')}
          </p>
          <QRCodeSVG value={qrPayload} size={260} level="M" />
          <p style={{ margin: '16px 0 0', fontSize: '13px', color: '#64748b' }}>
            {t('whatsappQr.scanQrHint')}
          </p>
        </div>
      )}

      {connected && (
        <div
          style={{
            marginBottom: '24px',
            padding: '20px',
            background: '#f0fdf4',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                {t('whatsappQr.connectedDevice')}
              </span>
              <div style={{ fontSize: '15px', color: '#14532d' }}>
                {status?.phone ? `+${status.phone}` : '—'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                {t('whatsappQr.lastSync')}
              </span>
              <div style={{ fontSize: '15px', color: '#14532d' }}>{lastSyncLabel()}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleReconnect}
              disabled={reconnecting}
              style={{
                padding: '10px 18px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #16a34a',
                background: '#fff',
                color: '#16a34a',
                cursor: reconnecting ? 'not-allowed' : 'pointer',
                opacity: reconnecting ? 0.7 : 1,
              }}
            >
              {reconnecting ? t('whatsappQr.generating') : t('whatsappQr.reconnectDevice')}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              style={{
                padding: '10px 18px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #dc2626',
                background: '#fff',
                color: '#dc2626',
                cursor: 'pointer',
              }}
            >
              {t('whatsappQr.disconnectWhatsApp')}
            </button>
          </div>
        </div>
      )}

      {(qrPayload || connected) && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            border: '1px solid #93c5fd',
            boxSizing: 'border-box',
            fontSize: '14px',
            color: '#1e40af',
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {t('whatsappQr.inboxNote')}
        </div>
      )}

      <div
        className="crm-section"
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#fff',
          marginTop: '28px',
        }}
      >
        <h2 style={{ margin: '16px', fontSize: '18px', fontWeight: 600 }}>
          {t('whatsappQr.inboxTitle')}
        </h2>
        <div
          style={{
            margin: '0 16px 16px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            fontSize: '13px',
            color: '#166534',
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: '0 0 8px' }}>{t('whatsappQr.aiAutoReplyIntro')}</p>
          <p style={{ margin: '0 0 6px' }}>{t('whatsappQr.aiAutoReplyTurnOn')}</p>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li>{t('whatsappQr.aiAutoReplyBullet1')}</li>
            <li>{t('whatsappQr.aiAutoReplyBullet2')}</li>
            <li>{t('whatsappQr.aiAutoReplyBullet3')}</li>
            <li>{t('whatsappQr.aiAutoReplyBullet4')}</li>
          </ul>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', height: '480px' }}>
          <div style={{ width: '280px', borderRight: '1px solid #e5e7eb', overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
                {connected ? t('whatsappQr.noConversations') : t('whatsappQr.connectFirst')}
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
                    {c.owner_type === 'human' && (
                      <span style={{ display: 'block', marginTop: '4px', color: '#94a3b8', fontSize: '11px' }}>
                        {t('whatsappQr.agentThread')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              {messagesLoading ? (
                <div style={{ color: '#64748b' }}>{t('whatsappQr.loading')}</div>
              ) : !selectedPhone ? (
                <div style={{ color: '#64748b' }}>{t('whatsappQr.selectConversation')}</div>
              ) : (
                <>
                  {messages.map((m) => (
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
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            {selectedPhone && connected && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                {showEmojiPicker && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      padding: '10px',
                      marginBottom: '10px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      maxHeight: '140px',
                      overflowY: 'auto',
                    }}
                  >
                    {EMOJI_LIST.map((emoji, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleEmojiClick(emoji)}
                        style={{
                          padding: '4px',
                          fontSize: '20px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          lineHeight: 1,
                        }}
                        aria-label={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((p) => !p)}
                    style={{
                      padding: '10px',
                      background: showEmojiPicker ? '#e2e8f0' : 'transparent',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Insert emoji"
                  >
                    <FiSmile size={20} color="#64748b" />
                  </button>
                  {recording ? (
                    <button
                      type="button"
                      onClick={handleVoiceStop}
                      style={{
                        padding: '10px 16px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {t('whatsappQr.stopAndSend')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVoiceStart}
                      disabled={sendingVoice}
                      style={{
                        padding: '10px',
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: sendingVoice ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: sendingVoice ? 0.6 : 1,
                      }}
                      aria-label="Record voice message"
                    >
                      <FiMic size={20} color="#64748b" />
                    </button>
                  )}
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={t('whatsappQr.typeMessage')}
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
                    {t('whatsappQr.send')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '32px',
          padding: '20px 24px',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600, color: '#334155' }}>
          {t('whatsappQr.securityTitle')}
        </h3>
        <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
          {t('whatsappQr.securityLine1')}
        </p>
        <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
          {t('whatsappQr.securityLine2')}
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: '18px',
            fontSize: '14px',
            color: '#475569',
            lineHeight: 1.65,
          }}
        >
          <li>{t('whatsappQr.securityBullet1')}</li>
          <li>{t('whatsappQr.securityBullet2')}</li>
          <li>{t('whatsappQr.securityBullet3')}</li>
        </ul>
      </div>
    </div>
  );
}
