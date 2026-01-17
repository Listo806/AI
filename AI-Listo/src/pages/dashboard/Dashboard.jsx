import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { handleError } = useApiErrorHandler();
  const navigate = useNavigate();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      navigate('/sign-in');
    }
  }, [loading, isAuthenticated, navigate]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    publishedProperties: 0,
    totalLeads: 0,
    newLeads: 0,
  });
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated() && user) {
      loadDashboard();
    }
  }, [isAuthenticated, user]);

  const loadDashboard = async () => {
    setDashboardLoading(true);
    setError(null);

    try {
      // Dashboard summary is available to all authenticated users (FREE/PRO/PRO PLUS+)
      const summary = await apiClient.request('/crm/dashboard/summary');

      // Update stats (available to all plans)
      setStats({
        totalProperties: summary.properties?.total || 0,
        publishedProperties: summary.properties?.published || 0,
        totalLeads: summary.leads?.total || 0,
        newLeads: summary.leads?.new || 0,
      });

      // Load detailed lists (requires CRM access - PRO PLUS+)
      // These will fail for FREE/PRO users, so we handle gracefully
      try {
        const leadsResponse = await apiClient.request('/crm/owner/leads');
        const leadsData = Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse.data || []);
        setLeads(leadsData);
      } catch (leadsErr) {
        // If CRM access is required, just show empty list (don't show error)
        if (leadsErr.status === 403 && leadsErr.isSubscriptionError) {
          setLeads([]);
          // Don't show error notification - this is expected for FREE/PRO users
        } else {
          console.error('Failed to load leads:', leadsErr);
        }
      }

      try {
        const propertiesResponse = await apiClient.request('/crm/owner/properties');
        const propertiesData = Array.isArray(propertiesResponse) ? propertiesResponse : (propertiesResponse.data || []);
        setProperties(propertiesData);
      } catch (propertiesErr) {
        // If CRM access is required, just show empty list (don't show error)
        if (propertiesErr.status === 403 && propertiesErr.isSubscriptionError) {
          setProperties([]);
          // Don't show error notification - this is expected for FREE/PRO users
        } else {
          console.error('Failed to load properties:', propertiesErr);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Only show error if it's not a subscription error (subscription errors are handled above)
      if (!err.isSubscriptionError) {
        handleError(err, 'Failed to load dashboard');
        setError(err.message || 'Failed to load dashboard');
      }
    } finally {
      setDashboardLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status) => {
    return `crm-item-badge badge-${status || 'new'}`;
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated() || !user) {
    return null;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Dashboard</h1>
      {error && (
        <div className="crm-error">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="crm-stats-grid">
        <div className="crm-stat-card">
          <p className="crm-stat-label">Total Properties</p>
          <h3 className="crm-stat-value">{stats.totalProperties}</h3>
        </div>
        <div className="crm-stat-card">
          <p className="crm-stat-label">Published Properties</p>
          <h3 className="crm-stat-value">{stats.publishedProperties}</h3>
        </div>
        <div className="crm-stat-card">
          <p className="crm-stat-label">Total Leads</p>
          <h3 className="crm-stat-value">{stats.totalLeads}</h3>
        </div>
        <div className="crm-stat-card">
          <p className="crm-stat-label">New Leads (7d)</p>
          <h3 className="crm-stat-value">{stats.newLeads}</h3>
        </div>
      </div>

      {/* Properties Section */}
      <div className="crm-section">
        <div className="crm-section-header">
          <h2 className="crm-section-title">My Properties</h2>
        </div>
        {dashboardLoading ? (
          <div className="crm-loading">
            <div className="crm-skeleton"></div>
            <div className="crm-skeleton"></div>
            <div className="crm-skeleton"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="crm-empty-state">
            <div className="crm-empty-icon">🏠</div>
            <h3 className="crm-empty-title">No properties yet</h3>
            <p className="crm-empty-text">Upload your first property to start receiving AI-matched leads.</p>
          </div>
        ) : (
          <ul className="crm-list">
            {properties.map((property) => (
              <li key={property.id} className="crm-list-item">
                <div className="crm-item-header">
                  <div className="crm-item-title">{property.title || 'Untitled Property'}</div>
                  <span className={getStatusBadgeClass(property.status)}>
                    {(property.status || 'draft').charAt(0).toUpperCase() + (property.status || 'draft').slice(1)}
                  </span>
                </div>
                <div className="crm-item-details">
                  {property.location ? (
                    <div><strong>Location:</strong> {property.location}</div>
                  ) : (
                    <div><em>No location specified</em></div>
                  )}
                </div>
                <div className="crm-item-meta">Created: {formatDate(property.created_at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leads Section */}
      <div className="crm-section">
        <div className="crm-section-header">
          <h2 className="crm-section-title">My Leads</h2>
        </div>
        {dashboardLoading ? (
          <div className="crm-loading">
            <div className="crm-skeleton"></div>
            <div className="crm-skeleton"></div>
            <div className="crm-skeleton"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="crm-empty-state">
            <div className="crm-empty-icon">📋</div>
            <h3 className="crm-empty-title">No leads yet</h3>
            <p className="crm-empty-text">No leads yet. AI matching is active.</p>
          </div>
        ) : (
          <ul className="crm-list">
            {leads.map((lead) => {
              const aiScore = lead.ai_score || 0;
              const aiScoreDisplay = aiScore > 0 ? `${(aiScore * 100).toFixed(0)}%` : 'Pending';
              const contact = lead.contact || lead.email || lead.phone || 'No contact';

              return (
                <li key={lead.id} className="crm-list-item">
                  <div className="crm-item-header">
                    <div className="crm-item-title">{lead.name || 'Unnamed Lead'}</div>
                    <span className={getStatusBadgeClass(lead.status)}>
                      {lead.status || 'new'}
                    </span>
                  </div>
                  <div className="crm-item-details">
                    <div><strong>Contact:</strong> {contact}</div>
                    {lead.property_title ? (
                      <div><strong>Property:</strong> {lead.property_title}</div>
                    ) : (
                      <div><em>No associated property</em></div>
                    )}
                    <div><strong>AI Score:</strong> {aiScoreDisplay}</div>
                  </div>
                  <div className="crm-item-meta">Created: {formatDate(lead.created_at)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
