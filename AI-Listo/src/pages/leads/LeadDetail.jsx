import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import './Leads.css';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [lead, setLead] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
    propertyId: '',
    notes: '',
  });

  // WhatsApp phone number
  const whatsappPhone = user?.phone || 
                        import.meta.env.VITE_WHATSAPP_PHONE || 
                        '+1234567890';

  useEffect(() => {
    if (isAuthenticated() && user && !authLoading) {
      loadLead();
      loadProperties();
    }
  }, [id, isAuthenticated, user, authLoading]);

  const loadLead = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.request(`/leads/${id}`);
      // Normalize field names (backend returns camelCase)
      const normalizedLead = {
        ...data,
        propertyId: data.propertyId || data.property_id,
        property: data.property || null,
        aiScore: data.aiScore !== undefined ? data.aiScore : (data.ai_score !== undefined ? data.ai_score : null),
        aiTier: data.aiTier || data.ai_tier || 'COLD',
        urgencyState: data.urgencyState || data.urgency_state || 'COOLING',
        aiScoreLabel: data.aiScoreLabel || data.ai_score_label || '',
        aiReasonBullets: data.aiReasonBullets || data.ai_reason_bullets || [],
        recommendedAction: data.recommendedAction || data.recommended_action || 'FOLLOW_UP',
        recommendedActionReason: data.recommendedActionReason || data.recommended_action_reason || '',
        followUpRecommended: data.followUpRecommended || data.follow_up_recommended || false,
        cooldownActive: data.cooldownActive || data.cooldown_active || false,
        lastContactedAt: data.lastContactedAt || data.last_contacted_at || null,
        hasResponded: data.hasResponded || data.has_responded || false,
        lastActivityAt: data.lastActivityAt || data.last_activity_at || null,
        lastActionType: data.lastActionType || data.last_action_type || null,
        lastActionAt: data.lastActionAt || data.last_action_at || null,
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
      };
      setLead(normalizedLead);
      setFormData({
        name: normalizedLead.name || '',
        email: normalizedLead.email || '',
        phone: normalizedLead.phone || '',
        status: normalizedLead.status || 'new',
        propertyId: normalizedLead.propertyId || '',
        notes: normalizedLead.notes || '',
      });
    } catch (err) {
      setError('Failed to load lead: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await apiClient.request('/crm/owner/properties');
      const propertiesData = Array.isArray(response) ? response : (response.data || []);
      setProperties(propertiesData);
    } catch (err) {
      console.error('Failed to load properties:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        status: formData.status,
        propertyId: formData.propertyId || null,
        notes: formData.notes || null,
      };

      await apiClient.request(`/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      setIsEditing(false);
      loadLead(); // Reload to get updated data
    } catch (err) {
      setError(err.message || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this lead? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiClient.request(`/leads/${id}`, {
        method: 'DELETE',
      });
      navigate('/leads');
    } catch (err) {
      setError(err.message || 'Failed to delete lead');
      setSaving(false);
    }
  };

  const handleEmailClick = () => {
    if (formData.email) {
      window.location.href = `mailto:${formData.email}`;
    }
  };

  const handleWhatsAppClick = (isFollowUp = false) => {
    if (formData.phone) {
      let message;
      if (isFollowUp) {
        // AI follow-up message template
        const agentName = user?.name || 'our team';
        message = `Hi ${formData.name}, this is ${agentName} regarding the property you inquired about. Just following up to see if you're still interested or have any questions. Happy to help.`;
      } else {
        message = `Hi ${formData.name}, I'm following up on your interest in our property. How can I help you?`;
      }
      window.open(buildWhatsAppLink(whatsappPhone, { phone: formData.phone, message }), '_blank');
      logContactAction('whatsapp');
    }
  };

  // Log contact action to backend
  const logContactAction = async (actionType) => {
    if (!id) return;
    try {
      await apiClient.request(`/leads/${id}/contact`, {
        method: 'POST',
        body: JSON.stringify({ actionType }),
      });
      // Reload lead to get updated data
      loadLead();
    } catch (err) {
      console.error('Failed to log contact action:', err);
    }
  };

  const handleCallClick = () => {
    if (formData.phone) {
      window.location.href = `tel:${formData.phone}`;
      logContactAction('call');
    }
  };

  const handleEmailAction = () => {
    if (formData.email) {
      window.location.href = `mailto:${formData.email}`;
      logContactAction('email');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate urgency level and get follow-up guidance
  const getUrgencyInfo = (lead) => {
    if (!lead) return { level: 'normal', badge: null, guidance: null };
    
    const now = new Date();
    const createdAt = lead.createdAt ? new Date(lead.createdAt) : null;
    const lastContactedAt = lead.lastContactedAt ? new Date(lead.lastContactedAt) : null;
    
    const daysSinceCreation = createdAt ? Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)) : null;
    const hoursSinceLastContact = lastContactedAt ? (now - lastContactedAt) / (1000 * 60 * 60) : null;
    const daysSinceLastContact = lastContactedAt ? Math.floor((now - lastContactedAt) / (1000 * 60 * 60 * 24)) : null;
    
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
      if (isUncontacted) {
        return {
          level: 'medium',
          badge: { text: 'Contact soon', color: '#3b82f6', bgColor: '#eff6ff' },
          guidance: 'Follow up if no response within 3 days.'
        };
      } else if (daysSinceLastContact > 3) {
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

  const formatAiScore = (score) => {
    if (!score && score !== 0) return 'N/A';
    return `${score.toFixed(0)}%`;
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
        return '#ef4444';
      case 'WARM':
        return '#f59e0b';
      case 'COLD':
        return '#64748b';
      default:
        return '#64748b';
    }
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

  const handleRecommendedAction = () => {
    if (!lead) return;
    
    switch (lead.recommendedAction) {
      case 'CALL':
        if (lead.phone) {
          window.location.href = `tel:${lead.phone}`;
        }
        break;
      case 'WHATSAPP':
        if (lead.phone) {
          const message = `Hi ${lead.name || ''}, I'm following up on your interest in our property. How can I help you?`;
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
  };

  const getAiScoreColor = (score) => {
    if (!score && score !== 0) return '#94a3b8';
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Lead Details">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated() || !user) {
    return null;
  }

  if (error && !lead) {
    return (
      <DashboardLayout title="Lead Details">
        <div className="crm-error">
          {error}
        </div>
        <Link to="/leads" className="crm-btn crm-btn-secondary" style={{ marginTop: '16px' }}>
          Back to Leads
        </Link>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout title="Lead Details">
        <div className="crm-error">
          Lead not found
        </div>
        <Link to="/leads" className="crm-btn crm-btn-secondary" style={{ marginTop: '16px' }}>
          Back to Leads
        </Link>
      </DashboardLayout>
    );
  }

  const associatedProperty = properties.find(p => p.id === lead.propertyId);

  return (
    <DashboardLayout title="Lead Details">
      <div style={{ maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>{lead.name || 'Unnamed Lead'}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {(() => {
              const urgencyInfo = getUrgencyInfo(lead);
              return urgencyInfo.badge && (
                <span 
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '12px', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    backgroundColor: urgencyInfo.badge.bgColor,
                    color: urgencyInfo.badge.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {urgencyInfo.badge.text}
                </span>
              );
            })()}
            {/* Urgency State Badge (separate from AI tier - distinct labels) */}
            {lead.urgencyState && (
              <span 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontWeight: '600',
                  ...getUrgencyStateStyle(lead.urgencyState),
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {getUrgencyStateStyle(lead.urgencyState).label}
              </span>
            )}
            {/* AI Tier Badge */}
            {lead.aiTier && (
              <span 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  fontWeight: '600',
                  backgroundColor: `${getAiTierColor(lead.aiTier)}20`,
                  color: getAiTierColor(lead.aiTier),
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {lead.aiTier}
              </span>
            )}
            {/* Status Badge (mapped) */}
            <span className={getStatusBadgeClass(lead.status)}>
              {getStatusDisplayLabel(lead.status, lead.hasResponded)}
            </span>
            {lead.aiScore !== undefined && lead.aiScore !== null && (
              <div 
                style={{ 
                  padding: '6px 16px', 
                  borderRadius: '12px', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  backgroundColor: `${getAiScoreColor(lead.aiScore)}20`,
                  color: getAiScoreColor(lead.aiScore),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <span>AI Score: {formatAiScore(lead.aiScore)}</span>
                {lead.aiScoreLabel && (
                  <span style={{ fontSize: '10px', fontWeight: '400', opacity: 0.8 }}>
                    {lead.aiScoreLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI-Recommended Action - Moved higher (right after header) */}
        {lead.recommendedAction && (
          <div className="crm-section" style={{ marginBottom: '24px', background: '#eff6ff', padding: '20px', borderRadius: '8px' }}>
            <h3 className="crm-section-title" style={{ marginBottom: '12px' }}>AI-Recommended Action</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {(lead.recommendedAction === 'CALL' || lead.recommendedAction === 'WHATSAPP' || lead.recommendedAction === 'EMAIL') ? (
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
                    
                    if (inCooldown && formatTimeAgo(lead.lastActionAt)) {
                      // Show "Attempted X minutes ago" and disable button
                      return (
                        <div style={{ 
                          padding: '12px 20px', 
                          background: '#f0fdf4', 
                          borderRadius: '8px',
                          fontSize: '16px',
                          color: '#16a34a',
                          border: '1px solid #86efac',
                          fontWeight: '500',
                          cursor: 'not-allowed',
                          opacity: 0.8
                        }}>
                          Attempted {formatTimeAgo(lead.lastActionAt)}
                        </div>
                      );
                    } else {
                      // Show active button
                      return (
                        <button
                          onClick={() => {
                            handleRecommendedAction();
                            // Log contact action
                            if (lead.recommendedAction === 'CALL') {
                              logContactAction('call');
                            } else if (lead.recommendedAction === 'WHATSAPP') {
                              logContactAction('whatsapp');
                            } else if (lead.recommendedAction === 'EMAIL') {
                              logContactAction('email');
                            }
                          }}
                          className="crm-btn crm-btn-primary"
                          disabled={lead.cooldownActive}
                          style={{ 
                            fontSize: '16px', 
                            padding: '12px 24px',
                            backgroundColor: lead.recommendedAction === 'WHATSAPP' 
                              ? '#25D366' // WhatsApp green
                              : (lead.aiTier === 'HOT' ? '#ef4444' : '#3b82f6'),
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
              ) : (
                <div style={{ 
                  padding: '12px 20px', 
                  background: '#f8fafc', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#64748b',
                  border: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>
                  {getActionLabel(lead.recommendedAction)}
                </div>
              )}
              {/* Secondary action buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {formData.phone && lead.recommendedAction !== 'CALL' && (
                  <button
                    onClick={() => {
                      handleCallClick();
                    }}
                    className="crm-btn crm-btn-secondary"
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}
                    title="Call (Primary)"
                  >
                    📞
                  </button>
                )}
                {formData.phone && lead.recommendedAction !== 'WHATSAPP' && (
                  <button
                    onClick={() => {
                      handleWhatsAppClick(lead.followUpRecommended);
                    }}
                    className="crm-btn crm-btn-secondary"
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}
                    title="Text (Fallback if call fails)"
                  >
                    💬
                  </button>
                )}
                {formData.email && lead.recommendedAction !== 'EMAIL' && (
                  <button
                    onClick={() => {
                      handleEmailAction();
                    }}
                    className="crm-btn crm-btn-secondary"
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}
                    title="Email (Last attempt)"
                  >
                    📧
                  </button>
                )}
              </div>
            </div>
            {lead.recommendedActionReason && (
              <div style={{ 
                marginTop: '12px', 
                color: lead.cooldownActive ? '#f59e0b' : '#64748b', 
                fontSize: '14px', 
                fontStyle: 'italic',
                fontWeight: lead.cooldownActive ? '500' : 'normal'
              }}>
                {lead.recommendedActionReason}
              </div>
            )}
            {/* Last Action Info */}
            {lead.lastActionType && lead.lastActionAt && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#94a3b8'
              }}>
                Last action: {lead.lastActionType.charAt(0).toUpperCase() + lead.lastActionType.slice(1)} attempt • {formatTimeAgo(lead.lastActionAt)}
              </div>
            )}
            {(() => {
              const urgencyInfo = getUrgencyInfo(lead);
              return urgencyInfo.guidance && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', color: '#475569', borderLeft: '3px solid #cbd5e1' }}>
                  💡 {urgencyInfo.guidance}
                </div>
              );
            })()}
          </div>
        )}

        {/* AI Reason Bullets */}
        {lead.aiReasonBullets && lead.aiReasonBullets.length > 0 && (
          <div className="crm-section" style={{ marginBottom: '24px', background: '#f8fafc', padding: '20px', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
            <h3 className="crm-section-title" style={{ color: '#3b82f6', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Why This Lead Matters
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {lead.aiReasonBullets.map((reason, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    background: '#fff', 
                    padding: '8px 14px', 
                    borderRadius: '6px', 
                    fontSize: '14px', 
                    color: '#334155',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Urgency Decay Warning for COOLING state */}
        {lead.urgencyState === 'COOLING' && (
          <div style={{ 
            marginBottom: '24px',
            padding: '12px 16px', 
            background: '#f1f5f9', 
            borderRadius: '8px',
            borderLeft: '3px dashed #64748b',
            border: '1px dashed #64748b',
            fontSize: '14px',
            color: '#475569'
          }}>
            Cooling — follow up recommended
          </div>
        )}

        {!isEditing ? (
          <>
            {/* View Mode */}
            <div className="crm-section" style={{ marginBottom: '24px' }}>
              <h3 className="crm-section-title">Contact Information</h3>
              <div className="crm-item-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div><strong>Name:</strong> {lead.name || 'N/A'}</div>
                <div><strong>Email:</strong> {lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : 'N/A'}</div>
                <div><strong>Phone:</strong> {lead.phone || 'N/A'}</div>
                <div><strong>Source:</strong> {lead.source || 'N/A'}</div>
              </div>
            </div>

            {associatedProperty && (
              <div className="crm-section" style={{ marginBottom: '24px' }}>
                <h3 className="crm-section-title">Associated Property</h3>
                <div className="crm-item-details">
                  <Link 
                    to={`/properties/${lead.propertyId}`} 
                    style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '16px', fontWeight: '500' }}
                  >
                    {associatedProperty.title || 'Untitled Property'}
                  </Link>
                  {associatedProperty.address && (
                    <div style={{ marginTop: '8px', color: '#64748b' }}>
                      {associatedProperty.address}
                      {associatedProperty.city && `, ${associatedProperty.city}`}
                      {associatedProperty.state && `, ${associatedProperty.state}`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {lead.notes && (
              <div className="crm-section" style={{ marginBottom: '24px' }}>
                <h3 className="crm-section-title">Notes</h3>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{lead.notes}</p>
              </div>
            )}

            <div className="crm-section" style={{ marginBottom: '24px' }}>
              <h3 className="crm-section-title">Metadata</h3>
              <div className="crm-item-details">
                <div><strong>Created:</strong> {formatDate(lead.createdAt)}</div>
                <div><strong>Updated:</strong> {formatDate(lead.updatedAt)}</div>
                {lead.assignedTo && <div><strong>Assigned To:</strong> {lead.assignedTo}</div>}
              </div>
            </div>

            {/* Secondary Actions */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsEditing(true)}
                className="crm-btn crm-btn-secondary"
              >
                Edit Lead
              </button>
              <button
                onClick={handleDelete}
                className="crm-btn crm-btn-danger"
                disabled={saving}
              >
                Delete
              </button>
              <Link to="/leads" className="crm-btn crm-btn-secondary">
                Back to List
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Edit Mode */}
            {error && (
              <div className="crm-error" style={{ marginBottom: '24px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="crm-form">
              <div className="crm-form-section">
                <h3 className="crm-form-section-title">Contact Information</h3>
                
                <div className="crm-form-field">
                  <label htmlFor="name">Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="crm-form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="crm-form-field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="crm-form-section">
                <h3 className="crm-form-section-title">Lead Details</h3>
                
                <div className="crm-form-field">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    disabled={saving}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="follow-up">Follow-Up</option>
                    <option value="closed-won">Closed-Won</option>
                    <option value="closed-lost">Closed-Lost</option>
                  </select>
                </div>

                <div className="crm-form-field">
                  <label htmlFor="propertyId">Associated Property</label>
                  <select
                    id="propertyId"
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">No Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.title || 'Untitled Property'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-field">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={6}
                    disabled={saving}
                    placeholder="Add any notes about this lead..."
                  />
                </div>
              </div>

              <div className="crm-form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: lead.name || '',
                      email: lead.email || '',
                      phone: lead.phone || '',
                      status: lead.status || 'new',
                      propertyId: lead.propertyId || '',
                      notes: lead.notes || '',
                    });
                    setError(null);
                  }}
                  className="crm-btn crm-btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="crm-btn crm-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
