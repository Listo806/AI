import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import './Leads.css';

export default function LeadsList() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { handleError } = useApiErrorHandler();
  const [allHotLeads, setAllHotLeads] = useState([]);
  const [allOtherLeads, setAllOtherLeads] = useState([]);
  const [filteredHotLeads, setFilteredHotLeads] = useState([]);
  const [filteredOtherLeads, setFilteredOtherLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Filters (secondary)
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  // WhatsApp phone number
  const whatsappPhone = user?.phone || 
                        import.meta.env.VITE_WHATSAPP_PHONE || 
                        '+1234567890';

  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadLeads();
    }
  }, [isAuthenticated, user, authLoading]);

  // Apply client-side filtering (secondary)
  useEffect(() => {
    let filteredHot = [...allHotLeads];
    let filteredOther = [...allOtherLeads];

    if (filters.status) {
      filteredHot = filteredHot.filter(l => l.status === filters.status);
      filteredOther = filteredOther.filter(l => l.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredHot = filteredHot.filter(l => 
        (l.name && l.name.toLowerCase().includes(searchLower)) ||
        (l.email && l.email.toLowerCase().includes(searchLower)) ||
        (l.phone && l.phone.toLowerCase().includes(searchLower)) ||
        (l.property?.title && l.property.title.toLowerCase().includes(searchLower))
      );
      filteredOther = filteredOther.filter(l => 
        (l.name && l.name.toLowerCase().includes(searchLower)) ||
        (l.email && l.email.toLowerCase().includes(searchLower)) ||
        (l.phone && l.phone.toLowerCase().includes(searchLower)) ||
        (l.property?.title && l.property.title.toLowerCase().includes(searchLower))
      );
    }

    setFilteredHotLeads(filteredHot);
    setFilteredOtherLeads(filteredOther);
  }, [allHotLeads, allOtherLeads, filters]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request('/crm/owner/leads');
      const leadsData = Array.isArray(response) ? response : (response.data || []);
      
      // Normalize field names (backend returns camelCase)
      const normalizedLeads = leadsData.map(lead => ({
        ...lead,
        propertyId: lead.property?.id || lead.property_id || null,
        property: lead.property || null,
        aiScore: lead.aiScore !== undefined ? lead.aiScore : (lead.ai_score !== undefined ? lead.ai_score : null),
        aiTier: lead.aiTier || lead.ai_tier || 'COLD',
        urgencyState: lead.urgencyState || lead.urgency_state || 'COOLING',
        aiScoreLabel: lead.aiScoreLabel || lead.ai_score_label || '',
        aiReasonBullets: lead.aiReasonBullets || lead.ai_reason_bullets || [],
        recommendedAction: lead.recommendedAction || lead.recommended_action || 'FOLLOW_UP',
        recommendedActionReason: lead.recommendedActionReason || lead.recommended_action_reason || '',
        followUpRecommended: lead.followUpRecommended || lead.follow_up_recommended || false,
        cooldownActive: lead.cooldownActive || lead.cooldown_active || false,
        lastContactedAt: lead.lastContactedAt || lead.last_contacted_at || null,
        hasResponded: lead.hasResponded || lead.has_responded || false,
        lastActivityAt: lead.lastActivityAt || lead.last_activity_at || null,
        lastActionType: lead.lastActionType || lead.last_action_type || null,
        lastActionAt: lead.lastActionAt || lead.last_action_at || null,
        createdAt: lead.createdAt || lead.created_at,
        updatedAt: lead.updatedAt || lead.updated_at,
      }));

      // Backend already sorts by aiTier desc, aiScore desc, createdAt desc
      // Separate HOT leads from others
      const hot = normalizedLeads.filter(l => l.aiTier === 'HOT');
      const other = normalizedLeads.filter(l => l.aiTier !== 'HOT');

      setAllHotLeads(hot);
      setAllOtherLeads(other);
    } catch (err) {
      console.error('Failed to load leads:', err);
      handleError(err, 'Failed to load leads');
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAiScore = (score) => {
    if (!score && score !== 0) return 'N/A';
    return `${Math.round(score)}%`;
  };

  // Format time ago (e.g., "5 minutes ago", "2 hours ago")
  const formatTimeAgo = (dateString) => {
    if (!dateString) return null;
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  // Get status display label (mapping logic)
  const getStatusDisplayLabel = (status, hasResponded) => {
    if (hasResponded) return 'Engaged';
    if (status === 'new') return 'Not Contacted';
    if (status === 'contacted') return 'Attempted';
    return getStatusLabel(status);
  };

  // Get urgency state color and style (distinct from AI tier)
  const getUrgencyStateStyle = (urgencyState) => {
    switch (urgencyState) {
      case 'ACTIVE':
        return { 
          color: '#10b981', 
          bgColor: '#f0fdf4', 
          border: '1px solid #10b981',
          label: 'Active'
        };
      case 'NEEDS_ATTENTION':
        return { 
          color: '#f59e0b', 
          bgColor: '#fffbeb', 
          border: '1px solid #f59e0b',
          label: 'Needs Attention'
        };
      case 'COOLING':
        return { 
          color: '#64748b', 
          bgColor: '#f1f5f9', 
          border: '1px dashed #64748b',
          label: 'Cooling'
        };
      default:
        return { 
          color: '#64748b', 
          bgColor: '#f1f5f9', 
          border: '1px solid #64748b',
          label: 'Unknown'
        };
    }
  };

  // Calculate urgency level and get follow-up guidance
  const getUrgencyInfo = (lead) => {
    if (!lead) return { level: 'normal', badge: null, guidance: null };
    
    const now = new Date();
    const createdAt = lead.createdAt ? new Date(lead.createdAt) : null;
    const lastContactedAt = lead.lastContactedAt ? new Date(lead.lastContactedAt) : null;
    
    const hoursSinceLastContact = lastContactedAt ? (now - lastContactedAt) / (1000 * 60 * 60) : null;
    const daysSinceLastContact = lastContactedAt ? Math.floor((now - lastContactedAt) / (1000 * 60 * 60 * 24)) : null;
    const daysSinceCreation = createdAt ? Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)) : null;
    
    const isUncontacted = !lastContactedAt;
    const aiTier = lead.aiTier || 'COLD';
    
    // Urgency rules - all leads get a badge for consistency
    if (aiTier === 'HOT') {
      if (isUncontacted) {
        return {
          level: 'urgent',
          badge: { text: 'Urgent — Contact now', color: '#ef4444', bgColor: '#fef2f2' },
          guidance: 'Follow up if no response within 24 hours.'
        };
      } else if (hoursSinceLastContact > 24) {
        return {
          level: 'high',
          badge: { text: 'Follow up needed', color: '#f59e0b', bgColor: '#fffbeb' },
          guidance: 'Follow up if no response within 48 hours.'
        };
      } else {
        // HOT lead contacted recently - still show badge but less urgent
        return {
          level: 'normal',
          badge: { text: 'Active', color: '#10b981', bgColor: '#f0fdf4' },
          guidance: 'Follow up if no response within 48 hours.'
        };
      }
    } else if (aiTier === 'WARM') {
      // Warm lead urgency decay: show warning if no contact after 3 days
      if (isUncontacted) {
        // Uncontacted warm lead - check days since creation
        if (daysSinceCreation > 3) {
          return {
            level: 'medium',
            badge: { text: 'Contact soon', color: '#3b82f6', bgColor: '#eff6ff' },
            guidance: 'Follow up if no response within 3 days.'
          };
        }
        return {
          level: 'medium',
          badge: { text: 'Contact soon', color: '#3b82f6', bgColor: '#eff6ff' },
          guidance: 'Follow up if no response within 3 days.'
        };
      } else if (daysSinceLastContact > 3) {
        // Warm lead with no contact for 3+ days - show decay warning
        return {
          level: 'medium',
          badge: { text: 'Re-engagement needed', color: '#3b82f6', bgColor: '#eff6ff' },
          guidance: 'Follow up if no response within 7 days.'
        };
      } else {
        // WARM lead contacted recently - still show badge
        return {
          level: 'normal',
          badge: { text: 'Active', color: '#10b981', bgColor: '#f0fdf4' },
          guidance: 'Follow up if no response within 7 days.'
        };
      }
    } else {
      return {
        level: 'low',
        badge: { text: 'Low priority', color: '#64748b', bgColor: '#f1f5f9' },
        guidance: 'Follow up when convenient.'
      };
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'new': 'New',
      'contacted': 'Contacted',
      'qualified': 'Qualified',
      'follow-up': 'Follow-Up',
      'closed-won': 'Closed-Won',
      'closed-lost': 'Closed-Lost',
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    return `crm-item-badge badge-${status || 'new'}`;
  };

  const getAiTierColor = (aiTier) => {
    switch (aiTier) {
      case 'HOT':
        return '#ef4444'; // red
      case 'WARM':
        return '#f59e0b'; // orange
      case 'COLD':
        return '#64748b'; // gray
      default:
        return '#64748b';
    }
  };

  const getAiTierLabel = (aiTier) => {
    return aiTier || 'COLD';
  };

  const getActionLabel = (action) => {
    const labels = {
      'CALL': 'Call Now',
      'WHATSAPP': 'WhatsApp',
      'EMAIL': 'Send Email',
      'FOLLOW_UP': 'Follow Up',
    };
    return labels[action] || action;
  };

  const handleAction = (lead) => {
    switch (lead.recommendedAction) {
      case 'CALL':
        if (lead.phone) {
          window.location.href = `tel:${lead.phone}`;
        }
        break;
      case 'WHATSAPP':
        if (lead.phone) {
          const message = `Hi ${lead.name || ''}, I'm following up on your interest. How can I help you?`.trim();
          window.open(buildWhatsAppLink(whatsappPhone, { phone: lead.phone, message }), '_blank');
        }
        break;
      case 'EMAIL':
        if (lead.email) {
          window.location.href = `mailto:${lead.email}`;
        }
        break;
      case 'FOLLOW_UP':
        // Could mark as contacted or show reminder
        break;
      default:
        break;
    }
    // Note: Contact logging is handled in the onClick handler
  };

  const handleEmailClick = (lead) => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
    }
  };

  const handleWhatsAppClick = (lead, isFollowUp = false) => {
    if (lead.phone) {
      let message;
      if (isFollowUp) {
        // AI follow-up message template
        const agentName = user?.name || 'our team';
        message = `Hi ${lead.name || ''}, this is ${agentName} regarding the property you inquired about. Just following up to see if you're still interested or have any questions. Happy to help.`;
      } else {
        message = `Hi ${lead.name || ''}, I'm following up on your interest. How can I help you?`.trim();
      }
      window.open(buildWhatsAppLink(whatsappPhone, { phone: lead.phone, message }), '_blank');
      logContactAction(lead.id, 'whatsapp');
    }
  };

  // Log contact action to backend
  const logContactAction = async (leadId, actionType) => {
    try {
      await apiClient.request(`/leads/${leadId}/contact`, {
        method: 'POST',
        body: JSON.stringify({ actionType }),
      });
      // Reload leads to get updated data
      loadLeads();
    } catch (err) {
      console.error('Failed to log contact action:', err);
      // Show notification for subscription errors, but don't block the action
      if (err.isSubscriptionError || err.status === 403) {
        handleError(err);
      }
    }
  };

  const handleCallClick = (lead) => {
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
      logContactAction(lead.id, 'call');
    }
  };

  const handleEmailAction = (lead) => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
      logContactAction(lead.id, 'email');
    }
  };

  const renderLeadCard = (lead) => {
    const aiTier = lead.aiTier || 'COLD';
    const urgencyState = lead.urgencyState || 'COOLING';
    const showPrimaryAction = lead.recommendedAction === 'CALL' || lead.recommendedAction === 'WHATSAPP' || lead.recommendedAction === 'EMAIL';
    const urgencyInfo = getUrgencyInfo(lead);
    const urgencyStyle = getUrgencyStateStyle(urgencyState);
    const lastActionTimeAgo = lead.lastActionAt ? formatTimeAgo(lead.lastActionAt) : null;
    const statusDisplayLabel = getStatusDisplayLabel(lead.status, lead.hasResponded);
    
    return (
    <div key={lead.id} className="crm-lead-card" data-priority={aiTier.toLowerCase()}>
      <div className="crm-lead-card-header">
        <div className="crm-lead-card-main">
          <div className="crm-lead-card-title-row">
            <h3 className="crm-lead-card-name">{lead.name || 'Unnamed Lead'}</h3>
            <div className="crm-lead-card-badges">
              {/* Urgency State Badge (separate from AI tier - distinct labels) */}
              <span 
                style={{ 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontSize: '10px', 
                  fontWeight: '600',
                  backgroundColor: urgencyStyle.bgColor,
                  color: urgencyStyle.color,
                  border: urgencyStyle.border,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {urgencyStyle.label}
              </span>
              {/* AI Tier Badge */}
              <span 
                className="crm-lead-priority-badge"
                style={{ backgroundColor: `${getAiTierColor(aiTier)}20`, color: getAiTierColor(aiTier) }}
              >
                {getAiTierLabel(aiTier)}
              </span>
              {/* Status Badge (mapped) */}
              <span className={getStatusBadgeClass(lead.status)}>
                {statusDisplayLabel}
              </span>
            </div>
          </div>
          
          <div className="crm-lead-card-contact">
            {lead.email && <span>📧 {lead.email}</span>}
            {lead.phone && <span>📞 {lead.phone}</span>}
            {!lead.email && !lead.phone && <span style={{ color: '#94a3b8' }}>No contact information</span>}
          </div>
        </div>

        <div className="crm-lead-card-ai">
          <div className="crm-lead-ai-score" style={{ color: lead.aiScore >= 80 ? '#10b981' : lead.aiScore >= 60 ? '#3b82f6' : '#f59e0b' }}>
            {formatAiScore(lead.aiScore)}
          </div>
          <div className="crm-lead-ai-label">AI Score</div>
          {lead.aiScoreLabel && (
            <div className="crm-lead-ai-score-label" style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.3' }}>
              {lead.aiScoreLabel}
            </div>
          )}
        </div>
      </div>

      {/* AI-Recommended Action - Moved higher (right after AI score) */}
      {lead.recommendedAction && (
        <div className="crm-lead-action-section">
          <div className="crm-lead-action-label">AI-Recommended Action:</div>
          {showPrimaryAction && (
            <>
              {(() => {
                // Check if this specific action was recently attempted
                const actionWasAttempted = lead.lastActionType && 
                  lead.lastActionAt && 
                  lead.lastActionType === lead.recommendedAction.toLowerCase();
                
                // Check if in cooldown period (< 2 hours)
                const now = new Date();
                const lastActionDate = lead.lastActionAt ? new Date(lead.lastActionAt) : null;
                const hoursSinceLastAction = lastActionDate ? (now - lastActionDate) / (1000 * 60 * 60) : null;
                const inCooldown = actionWasAttempted && hoursSinceLastAction !== null && hoursSinceLastAction < 2;
                
                if (inCooldown && lastActionTimeAgo) {
                  // Show "Attempted X minutes ago" and disable button
                  return (
                    <div style={{ 
                      flex: 1, 
                      padding: '12px 16px', 
                      background: '#f0fdf4', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#16a34a',
                      border: '1px solid #86efac',
                      fontWeight: '500',
                      cursor: 'not-allowed',
                      opacity: 0.8
                    }}>
                      Attempted {lastActionTimeAgo}
                    </div>
                  );
                } else {
                  // Show active button
                  return (
                    <button
                      onClick={() => {
                        handleAction(lead);
                        // Log contact action
                        if (lead.recommendedAction === 'CALL') {
                          logContactAction(lead.id, 'call');
                        } else if (lead.recommendedAction === 'WHATSAPP') {
                          logContactAction(lead.id, 'whatsapp');
                        } else if (lead.recommendedAction === 'EMAIL') {
                          logContactAction(lead.id, 'email');
                        }
                      }}
                      className="crm-lead-action-button"
                      disabled={lead.cooldownActive}
                      style={{
                        backgroundColor: lead.recommendedAction === 'WHATSAPP' 
                          ? '#25D366' // WhatsApp green
                          : (aiTier === 'HOT' ? '#ef4444' : '#3b82f6'),
                        opacity: lead.cooldownActive ? 0.6 : 1,
                        cursor: lead.cooldownActive ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {lead.followUpRecommended && lead.recommendedAction === 'WHATSAPP' 
                        ? 'Send AI Follow-Up SMS'
                        : getActionLabel(lead.recommendedAction)}
                    </button>
                  );
                }
              })()}
            </>
          )}
          {!showPrimaryAction && (
            <div style={{ 
              flex: 1, 
              padding: '12px 16px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#64748b',
              border: '1px solid #e5e7eb'
            }}>
              {getActionLabel(lead.recommendedAction)}
            </div>
          )}
          <div className="crm-lead-action-quick">
            {lead.phone && lead.recommendedAction !== 'CALL' && (
              <button
                onClick={() => {
                  handleCallClick(lead);
                }}
                className="crm-lead-action-quick-btn"
                title="Call (Primary)"
              >
                📞
              </button>
            )}
            {lead.phone && lead.recommendedAction !== 'WHATSAPP' && (
              <button
                onClick={() => {
                  handleWhatsAppClick(lead, lead.followUpRecommended);
                }}
                className="crm-lead-action-quick-btn"
                title="Text (Fallback if call fails)"
              >
                💬
              </button>
            )}
            {lead.email && lead.recommendedAction !== 'EMAIL' && (
              <button
                onClick={() => {
                  handleEmailAction(lead);
                }}
                className="crm-lead-action-quick-btn"
                title="Email (Last attempt)"
              >
                📧
              </button>
            )}
          </div>
          {lead.recommendedActionReason && (
            <div style={{ 
              width: '100%', 
              marginTop: '8px', 
              fontSize: '12px', 
              color: lead.cooldownActive ? '#f59e0b' : '#64748b',
              fontStyle: 'italic',
              fontWeight: lead.cooldownActive ? '500' : 'normal'
            }}>
              {lead.recommendedActionReason}
            </div>
          )}
          {/* Last Action Info */}
          {lead.lastActionType && lead.lastActionAt && (
            <div style={{ 
              width: '100%', 
              marginTop: '8px', 
              fontSize: '11px', 
              color: '#94a3b8'
            }}>
              Last action: {lead.lastActionType.charAt(0).toUpperCase() + lead.lastActionType.slice(1)} attempt • {formatTimeAgo(lead.lastActionAt)}
            </div>
          )}
          {urgencyInfo.guidance && (
            <div style={{ 
              width: '100%', 
              marginTop: '8px', 
              padding: '8px 12px', 
              background: '#f8fafc', 
              borderRadius: '6px',
              fontSize: '12px', 
              color: '#475569',
              borderLeft: '3px solid #cbd5e1'
            }}>
              💡 {urgencyInfo.guidance}
            </div>
          )}
        </div>
      )}

      {/* AI Reason Bullets */}
      {lead.aiReasonBullets && lead.aiReasonBullets.length > 0 && (
        <div className="crm-lead-ai-explanation">
          <div className="crm-lead-ai-explanation-title">Why this lead matters:</div>
          <div className="crm-lead-ai-explanation-items">
            {lead.aiReasonBullets.map((reason, idx) => (
              <span key={idx} className="crm-lead-ai-explanation-item">
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Property Association */}
      {lead.property && (
        <div className="crm-lead-property">
          <strong>Property:</strong>{' '}
          <Link to={`/properties/${lead.property.id}`} className="crm-lead-property-link">
            {lead.property.title || 'Untitled Property'}
          </Link>
          {lead.property.price && (
            <span className="crm-lead-property-price">
              {' • '}${lead.property.price.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Urgency Decay Warning for COOLING state */}
      {urgencyState === 'COOLING' && (
        <div style={{ 
          marginTop: '8px',
          marginBottom: '16px',
          padding: '10px 14px', 
          background: '#f1f5f9', 
          borderRadius: '6px',
          borderLeft: '3px dashed #64748b',
          fontSize: '13px',
          color: '#475569',
          border: '1px dashed #64748b'
        }}>
          Cooling — follow up recommended
        </div>
      )}

      <div className="crm-lead-card-footer">
        {lead.lastContactedAt && (
          <span>Last contact: {formatDate(lead.lastContactedAt)}</span>
        )}
        <span>Created: {formatDate(lead.createdAt)}</span>
        <Link to={`/dashboard/leads/${lead.id}`} className="crm-lead-view-details">
          View Details →
        </Link>
      </div>
    </div>
    );
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated() || !user) {
    return null;
  }

  // Get all leads for list
  const allLeads = [...filteredHotLeads, ...filteredOtherLeads];

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Leads</h1>
      
      {error && (
        <div className="crm-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* 3-COLUMN LAYOUT */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '450px 1fr 320px', 
        gap: '24px', 
        height: 'calc(100vh - 200px)',
        overflow: 'hidden' // Prevent page-level scrolling
      }}>
        {/* LEFT COLUMN: Lead List + Filters */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '1px solid #e5e7eb',
          paddingRight: '24px',
          height: '100%',
          overflow: 'hidden' // Prevent column from expanding
        }}>
          <div style={{ marginBottom: '16px', flexShrink: 0 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="crm-btn crm-btn-secondary"
              style={{ width: '100%', fontSize: '14px', padding: '8px 16px', marginBottom: '16px' }}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>

            {/* Filters */}
            {showFilters && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="crm-input"
                  style={{ width: '100%', marginBottom: '8px' }}
                />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="crm-select"
                  style={{ width: '100%' }}
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="follow-up">Follow-Up</option>
                  <option value="closed-won">Closed-Won</option>
                  <option value="closed-lost">Closed-Lost</option>
                </select>
              </div>
            )}
          </div>

          {/* Lead List - Using EXACT same renderLeadCard style - Scrollable */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0 // Important for flex scrolling
          }}>
            {loading ? (
              <div className="crm-loading">
                <div className="crm-skeleton"></div>
                <div className="crm-skeleton"></div>
              </div>
            ) : allLeads.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                No leads found
              </div>
            ) : (
              <div>
                {filteredHotLeads.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#ef4444' }}>
                      🔥 Hot ({filteredHotLeads.length})
                    </h3>
                    {filteredHotLeads.map(lead => (
                      <div 
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        style={{
                          marginBottom: '12px',
                          opacity: selectedLead?.id === lead.id ? 1 : 0.95,
                          transform: selectedLead?.id === lead.id ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {renderLeadCard(lead)}
                      </div>
                    ))}
                  </div>
                )}
                {filteredOtherLeads.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      All Leads ({filteredOtherLeads.length})
                    </h3>
                    {filteredOtherLeads.map(lead => (
                      <div 
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        style={{
                          marginBottom: '12px',
                          opacity: selectedLead?.id === lead.id ? 1 : 0.95,
                          transform: selectedLead?.id === lead.id ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {renderLeadCard(lead)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Lead Details + Timeline + Notes */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0 // Important for flex scrolling
        }}>
          {selectedLead ? (
            <>
              <div className="crm-section" style={{ marginBottom: '16px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
                  {selectedLead.name || 'Unnamed Lead'}
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div><strong>Email:</strong> {selectedLead.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {selectedLead.phone || 'N/A'}</div>
                  <div><strong>Status:</strong> {selectedLead.status || 'new'}</div>
                  <div><strong>AI Score:</strong> {formatAiScore(selectedLead.aiScore)}</div>
                  {selectedLead.property && (
                    <div><strong>Property:</strong> {selectedLead.property.title || 'N/A'}</div>
                  )}
                </div>
              </div>

              <div className="crm-section" style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Timeline</h3>
                <div style={{
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  Timeline placeholder - activity history will appear here
                </div>
              </div>

              <div className="crm-section">
                <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Notes</h3>
                <textarea
                  placeholder="Add notes about this lead..."
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
                <button className="crm-btn crm-btn-primary" style={{ marginTop: '12px' }}>
                  Save Notes
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#64748b'
            }}>
              Select a lead to view details
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Panel + WhatsApp Placeholder */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          borderLeft: '1px solid #e5e7eb',
          paddingLeft: '24px',
          height: '100%',
          overflow: 'hidden' // Prevent column from expanding
        }}>
          {/* AI Panel Placeholder */}
          <div className="crm-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>AI Panel</h3>
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#64748b',
              minHeight: '200px'
            }}>
              AI recommendations and insights will appear here
            </div>
          </div>

          {/* WhatsApp Chat Placeholder */}
          <div className="crm-section" style={{ 
            flex: 1,
            minHeight: 0, // Important for flex scrolling
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', flexShrink: 0 }}>WhatsApp</h3>
            <div style={{
              flex: 1,
              padding: '16px',
              background: '#f0fdf4',
              borderRadius: '6px',
              border: '1px solid #86efac',
              fontSize: '14px',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
              minHeight: 0
            }}>
              WhatsApp chat placeholder
              <br />
              Messages will appear here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
