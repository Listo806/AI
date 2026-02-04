import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://ai-2-7ikc.onrender.com/api';
const AUTH_TOKEN_KEY = 'listo_access_token';

/**
 * Reusable WhatsApp chat component.
 * Fetches messages from GET /api/leads/:id/messages and sends via POST /api/whatsapp/send.
 * @param {string} leadId - Lead UUID
 * @param {string} leadPhone - Lead phone (E.164 or normalized). Required for send.
 * @param {string} leadName - Lead name (for display)
 * @param {function} onSendSuccess - Callback after successful send (e.g. refresh lead)
 */
export default function WhatsAppChat({ leadId, leadPhone, leadName, onSendSuccess }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const messagesEndRef = useRef(null);

  const canSend = Boolean(leadId && leadPhone && draft.trim() && !sending);

  const loadMessages = async () => {
    if (!leadId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request(`/leads/${leadId}/messages`);
      const data = Array.isArray(res?.data) ? res.data : [];
      setMessages(data);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [leadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!canSend) return;
    const text = draft.trim();
    setSending(true);
    setError(null);
    try {
      await apiClient.request('/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ leadId, message: text }),
      });
      setDraft('');
      await loadMessages();
      onSendSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to send message');
      // Keep draft for retry
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChannelLabel = (msg) => {
    const ch = msg.channel || 'whatsapp';
    if (ch === 'email') return 'Email';
    if (ch === 'instagram_dm') return 'Instagram DM';
    const st = msg.sender_type || 'platform';
    return st === 'agent' ? 'WhatsApp (Agent)' : 'WhatsApp (Platform)';
  };

  const isAiMessage = (msg) => msg.sender_type === 'ai';

  const isVoiceMessage = (msg) =>
    msg.message_type === 'audio' || (msg.meta && typeof msg.meta === 'object' && msg.meta.from_voice);

  const hasOriginalVoice = (msg) => isVoiceMessage(msg) && (msg.media_url || (msg.metadata && msg.metadata.MediaUrl0));

  const handlePlayOriginal = async (msg) => {
    if (!hasOriginalVoice(msg)) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const url = `${API_BASE}/whatsapp/messages/${msg.id}/audio`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load audio');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(blobUrl);
      setPlayingAudioId(msg.id);
    } catch (err) {
      console.error('Play original voice failed', err);
    }
  };

  const stopPlayingOriginal = () => {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    setPlayingAudioId(null);
  };

  useEffect(() => {
    return () => {
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    };
  }, [audioBlobUrl]);

  if (!leadId) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px',
        padding: '24px',
      }}>
        Select a lead to start messaging
      </div>
    );
  }

  if (!leadPhone) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: '14px',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '8px' }}>This lead has no phone number.</div>
        <div style={{ fontSize: '13px' }}>Add a phone number in lead details to send WhatsApp messages.</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      {/* Chat header — channel label (text) mandatory for clarity */}
      <div style={{
        padding: '12px 16px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}>
          <img src="/assets/WhatsApp-Logo.svg" alt="" style={{ width: '20px', height: '20px' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '600', fontSize: '14px' }}>{leadName || 'Lead'}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            <span style={{ fontWeight: '500', color: '#0f172a' }}>WhatsApp</span>
            {' · '}
            {leadPhone}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>Loading messages...</div>
        ) : error && messages.length === 0 ? (
          <div style={{ color: '#dc2626', padding: '16px', fontSize: '14px' }}>{error}</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '24px', fontSize: '14px' }}>
            No messages yet. Send a message to start the conversation.
          </div>
        ) : (
          messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isOutbound ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isOutbound ? '#25D366' : '#f1f5f9',
                  color: isOutbound ? '#fff' : '#0f172a',
                  fontSize: '14px',
                  borderBottomRightRadius: isOutbound ? '4px' : '12px',
                  borderBottomLeftRadius: isOutbound ? '12px' : '4px',
                }}
              >
                <div style={{ marginBottom: '4px', fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>{getChannelLabel(msg)}</span>
                  <span>·</span>
                  <span>{formatTime(msg.created_at)}</span>
                  {isAiMessage(msg) && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isOutbound ? 'rgba(255,255,255,0.25)' : '#e0e7ff',
                        color: isOutbound ? '#fff' : '#4338ca',
                      }}
                    >
                      AI
                    </span>
                  )}
                  {isVoiceMessage(msg) && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '500',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isOutbound ? 'rgba(255,255,255,0.2)' : '#e0f2fe',
                        color: isOutbound ? '#fff' : '#0369a1',
                      }}
                      title="Transcribed from voice message"
                    >
                      Voice
                    </span>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.body || '(no content)'}
                </div>
                {hasOriginalVoice(msg) && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => (playingAudioId === msg.id ? stopPlayingOriginal() : handlePlayOriginal(msg))}
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        border: `1px solid ${isOutbound ? 'rgba(255,255,255,0.5)' : '#94a3b8'}`,
                        borderRadius: '6px',
                        background: isOutbound ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
                        color: isOutbound ? '#fff' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {playingAudioId === msg.id ? 'Stop' : 'Play original'}
                    </button>
                    {playingAudioId === msg.id && audioBlobUrl && (
                      <audio
                        src={audioBlobUrl}
                        controls
                        autoPlay
                        onEnded={stopPlayingOriginal}
                        style={{ maxWidth: '200px', height: '28px' }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && messages.length > 0 && (
        <div style={{
          padding: '8px 16px',
          background: '#fef2f2',
          color: '#dc2626',
          fontSize: '13px',
          flexShrink: 0,
        }}>
          {error}
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding: '12px 16px',
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={sending}
            aria-busy={sending}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-busy={sending}
            aria-disabled={!canSend}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              padding: '10px 20px',
              background: canSend ? '#25D366' : '#cbd5e1',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              cursor: canSend ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
