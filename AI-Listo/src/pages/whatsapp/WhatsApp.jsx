import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import WhatsAppChat from '../../components/WhatsAppChat';

export default function WhatsApp() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [toggleAiLoading, setToggleAiLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [sendCardLoading, setSendCardLoading] = useState(false);
  const [messageRefreshKey, setMessageRefreshKey] = useState(0);
  const [apiStatus, setApiStatus] = useState('unknown'); // 'connected' | 'not_connected' | 'unknown'
  const [agentStatus, setAgentStatus] = useState(null); // { connected: true, whatsappNumber?: string } | null

  const selectedConversation = conversations.find((c) => c.lead_id === selectedLead?.id) ?? null;

  // Initialize Lucide icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  // Load leads, conversations, and properties
  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadLeads();
      loadConversations();
      loadProperties();
      loadStatus();
    }
  }, [isAuthenticated, user, authLoading]);

  const loadProperties = async () => {
    try {
      const res = await apiClient.request('/crm/owner/properties');
      const data = Array.isArray(res) ? res : (res?.data || []);
      setProperties(data);
      if (data.length && !selectedPropertyId) setSelectedPropertyId(data[0].id);
    } catch (err) {
      console.error('Failed to load properties', err);
      setProperties([]);
    }
  };

  // When switching lead, pre-select that lead's property in the dropdown if available
  useEffect(() => {
    const leadPropId = selectedLead?.propertyId ?? selectedLead?.property_id;
    if (leadPropId && properties.some((p) => p.id === leadPropId)) {
      setSelectedPropertyId(leadPropId);
    }
  }, [selectedLead?.id, properties]);

  const loadConversations = async () => {
    setConversationsLoading(true);
    try {
      const res = await apiClient.request('/whatsapp/conversations');
      const data = Array.isArray(res?.data) ? res.data : res?.data ?? [];
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  const handleToggleAi = async () => {
    if (!selectedConversation || toggleAiLoading) return;
    const willAiReply = selectedConversation.ownership === 'ai' && selectedConversation.ai_enabled;
    const nextEnabled = !willAiReply;
    setToggleAiLoading(true);
    try {
      await apiClient.request(`/whatsapp/conversations/${selectedConversation.id}/toggle-ai`, {
        method: 'POST',
        body: JSON.stringify({ aiEnabled: nextEnabled }),
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, ai_enabled: nextEnabled, ownership: nextEnabled ? 'ai' : c.ownership }
            : c
        )
      );
    } catch (err) {
      console.error('Toggle AI failed', err);
    } finally {
      setToggleAiLoading(false);
    }
  };

  const handleSendPropertyCard = async () => {
    if (!selectedConversation || !selectedPropertyId || sendCardLoading) return;
    setSendCardLoading(true);
    try {
      await apiClient.request('/whatsapp/send/property-card', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          propertyId: selectedPropertyId,
          senderType: 'agent',
        }),
      });
      loadConversations();
      setMessageRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Send property card failed', err);
    } finally {
      setSendCardLoading(false);
    }
  };

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const response = await apiClient.request('/crm/owner/leads');
      const data = Array.isArray(response) ? response : (response.data || []);
      const normalized = data.map((l) => ({
        ...l,
        id: l.id,
        name: l.name || 'Unnamed',
        phone: l.phone || l.phone_number || null,
        lastActivityAt: l.lastActivityAt || l.last_activity_at || l.lastContactedAt || l.last_contacted_at,
      }));
      setLeads(normalized);
      if (!selectedLead && normalized.length > 0) {
        setSelectedLead(normalized[0]);
      }
    } catch (err) {
      console.error('Failed to load leads', err);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const res = await apiClient.request('/agent/whatsapp');
      setAgentStatus(res);
      setApiStatus(res?.connected ? 'connected' : 'not_connected');
    } catch {
      // Platform WhatsApp: no dedicated status endpoint; assume configured if we get here
      setAgentStatus({ connected: false });
      setApiStatus('unknown');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      connected: { bg: '#f0fdf4', color: '#16a34a', text: t('common.connected') },
      not_connected: { bg: '#fef2f2', color: '#dc2626', text: t('common.notConnected') },
      unknown: { bg: '#f1f5f9', color: '#64748b', text: 'Configured' },
    };
    const s = styles[status] || styles.unknown;
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}40`,
      }}>
        {s.text}
      </span>
    );
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const d = new Date(dateString);
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>{t('whatsapp.title')}</h1>

      {/* Status cards - compact row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div className="crm-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>WhatsApp Business API</h2>
            {getStatusBadge(apiStatus)}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {apiStatus === 'connected'
              ? (agentStatus?.whatsappNumber ? `Connected: ${agentStatus.whatsappNumber}` : 'Successfully connected')
              : apiStatus === 'not_connected'
              ? 'Not connected. Configure Twilio in backend or connect via Agent WhatsApp.'
              : 'Platform uses Twilio. Configure TWILIO_* env vars in backend.'}
          </div>
        </div>

        {agentStatus?.connected && agentStatus?.whatsappNumber && (
          <div className="crm-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Agent WhatsApp</h2>
              {getStatusBadge('connected')}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
              Your number: {agentStatus.whatsappNumber}
            </div>
          </div>
        )}
      </div>

      {/* Main: Lead list + Chat */}
      <div className="crm-section whatsapp-messaging-panel">
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>{t('whatsapp.messagingPanel')}</h2>
        <div className="whatsapp-chat-layout" style={{
          display: 'flex',
          flexDirection: 'row',
          height: '520px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#fff',
        }}>
          {/* Lead list - left or top */}
          <div className="whatsapp-lead-list" style={{
            width: '280px',
            minWidth: '280px',
            borderRight: '1px solid #e5e7eb',
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            {leadsLoading ? (
              <div style={{ padding: '24px', color: '#64748b' }}>Loading leads...</div>
            ) : leads.length === 0 ? (
              <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>No leads yet. Create leads in the Leads section.</div>
            ) : (
              leads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    background: selectedLead?.id === lead.id ? '#eff6ff' : 'transparent',
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{lead.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {lead.phone || 'No phone'}
                    {lead.lastActivityAt && ` · ${formatTimeAgo(lead.lastActivityAt)}`}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Toggle AI bar – shown when this lead has a conversation */}
            {selectedLead && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e5e7eb',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedConversation
                    ? selectedConversation.ownership === 'human'
                      ? 'Agent has taken over (AI won\'t reply until you turn AI on).'
                      : selectedConversation.ai_enabled
                        ? 'AI replies are on'
                        : 'AI replies are off'
                    : 'No conversation yet — send a message from the lead\'s phone to create one'}
                </span>
                {selectedConversation && (
                  <button
                    type="button"
                    onClick={handleToggleAi}
                    disabled={toggleAiLoading}
                    aria-pressed={selectedConversation.ownership === 'ai' && selectedConversation.ai_enabled}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: '600',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background:
                        selectedConversation.ownership === 'ai' && selectedConversation.ai_enabled ? '#f1f5f9' : '#25D366',
                      color:
                        selectedConversation.ownership === 'ai' && selectedConversation.ai_enabled ? '#475569' : '#fff',
                      cursor: toggleAiLoading ? 'not-allowed' : 'pointer',
                      opacity: toggleAiLoading ? 0.7 : 1,
                    }}
                  >
                    {toggleAiLoading
                      ? '…'
                      : selectedConversation.ownership === 'ai' && selectedConversation.ai_enabled
                        ? 'Turn AI off'
                        : 'Turn AI on'}
                  </button>
                )}
              </div>
            )}
            {/* Send property card – shown when this lead has a conversation */}
            {selectedLead && selectedConversation && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  background: '#fff',
                  borderBottom: '1px solid #e5e7eb',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>Send property card:</span>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  disabled={sendCardLoading || properties.length === 0}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '6px 10px',
                    fontSize: '13px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    background: '#fff',
                  }}
                >
                  {properties.length === 0 ? (
                    <option value="">No properties</option>
                  ) : (
                    properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.address || p.id?.slice(0, 8)}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={handleSendPropertyCard}
                  disabled={sendCardLoading || !selectedPropertyId || properties.length === 0}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: sendCardLoading || !selectedPropertyId ? '#f1f5f9' : '#25D366',
                    color: sendCardLoading || !selectedPropertyId ? '#94a3b8' : '#fff',
                    cursor: sendCardLoading || !selectedPropertyId ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sendCardLoading ? 'Sending…' : 'Send card'}
                </button>
              </div>
            )}
            <WhatsAppChat
              key={`chat-${selectedLead?.id}-${messageRefreshKey}`}
              leadId={selectedLead?.id}
              leadPhone={selectedLead?.phone}
              leadName={selectedLead?.name}
              conversationId={selectedConversation?.id}
              onSendSuccess={() => {
                loadLeads();
                loadConversations();
              }}
            />
          </div>
        </div>
      </div>

      {/* Info section - keep About WhatsApp, remove dead placeholders */}
      <div className="crm-section" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>{t('whatsapp.aboutWhatsApp')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1e40af' }}>⚡ {t('whatsapp.fastestResponse')}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{t('whatsapp.fastestResponse')}</div>
          </div>
          <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1e40af' }}>📞 {t('whatsapp.primaryChannel')}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{t('whatsapp.primaryChannel')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
