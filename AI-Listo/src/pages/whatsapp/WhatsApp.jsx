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
  const [apiStatus, setApiStatus] = useState('unknown'); // 'connected' | 'not_connected' | 'unknown'
  const [agentStatus, setAgentStatus] = useState(null); // { connected: true, whatsappNumber?: string } | null

  // Initialize Lucide icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  // Load leads
  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadLeads();
      loadStatus();
    }
  }, [isAuthenticated, user, authLoading]);

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
            <WhatsAppChat
              leadId={selectedLead?.id}
              leadPhone={selectedLead?.phone}
              leadName={selectedLead?.name}
              onSendSuccess={loadLeads}
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
