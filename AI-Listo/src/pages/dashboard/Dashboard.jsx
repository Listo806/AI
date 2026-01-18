import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    totalLeads: 0,
    newLeadsToday: 0,
    newLeads7d: 0,
    dealsInPipeline: 0,
    closedDeals: 0,
    revenueClosed: 0,
    pipelineValue: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);

  // Demo data for charts
  const leadsOverTimeData = [
    { date: 'Jan 1', leads: 12 },
    { date: 'Jan 8', leads: 19 },
    { date: 'Jan 15', leads: 15 },
    { date: 'Jan 22', leads: 23 },
    { date: 'Jan 29', leads: 18 },
    { date: 'Feb 5', leads: 27 },
    { date: 'Feb 12', leads: 31 },
    { date: 'Feb 19', leads: 24 },
    { date: 'Feb 26', leads: 29 },
    { date: 'Mar 5', leads: 35 },
    { date: 'Mar 12', leads: 28 },
    { date: 'Mar 19', leads: 42 },
  ];

  const leadSourceData = [
    { name: 'Website', value: 45, color: '#3b82f6' },
    { name: 'WhatsApp', value: 32, color: '#25D366' },
    { name: 'Email', value: 18, color: '#8b5cf6' },
    { name: 'Referral', value: 12, color: '#f59e0b' },
    { name: 'Social Media', value: 8, color: '#ec4899' },
  ];

  const conversionFunnelData = [
    { stage: 'New Leads', count: 150 },
    { stage: 'Contacted', count: 120 },
    { stage: 'Qualified', count: 85 },
    { stage: 'Proposal', count: 45 },
    { stage: 'Negotiation', count: 28 },
    { stage: 'Closed Won', count: 18 },
  ];

  const activityDistributionData = [
    { activity: 'Calls', count: 145 },
    { activity: 'WhatsApp', count: 98 },
    { activity: 'Emails', count: 67 },
    { activity: 'Meetings', count: 34 },
    { activity: 'Follow-ups', count: 52 },
  ];

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
      // Note: summary API returns: leads.total, leads.new (7 days), leads.qualified
      // Pipeline and revenue data would come from separate endpoints in future phases
      setStats({
        totalLeads: summary.leads?.total || 0,
        newLeadsToday: summary.leads?.new || 0, // Using 7d as today for now (API doesn't have separate today field)
        newLeads7d: summary.leads?.new || 0,
        dealsInPipeline: 0, // Placeholder - would come from pipeline endpoint
        closedDeals: 0, // Placeholder - would come from pipeline endpoint
        revenueClosed: 0, // Placeholder - would come from revenue endpoint
        pipelineValue: 0, // Placeholder - would come from pipeline endpoint
      });

      // Load detailed lists (requires CRM access - PRO PLUS+)
      // These will fail for FREE/PRO users, so we handle gracefully
      try {
        const leadsResponse = await apiClient.request('/crm/owner/leads');
        // Store leads if needed for future use
      } catch (leadsErr) {
        // If CRM access is required, just ignore (don't show error)
        if (leadsErr.status === 403 && leadsErr.isSubscriptionError) {
          // Don't show error notification - this is expected for FREE/PRO users
        } else {
          console.error('Failed to load leads:', leadsErr);
        }
      }

      try {
        const propertiesResponse = await apiClient.request('/crm/owner/properties');
        // Store properties if needed for future use
      } catch (propertiesErr) {
        // If CRM access is required, just ignore (don't show error)
        if (propertiesErr.status === 403 && propertiesErr.isSubscriptionError) {
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

      {/* TOP SECTION — METRIC CARDS (6 required) */}
      <div className="crm-stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="crm-stat-card">
          <p className="crm-stat-label">Total Leads</p>
          <h3 className="crm-stat-value">{stats.totalLeads}</h3>
        </div>
        <div className="crm-stat-card">
          <p className="crm-stat-label">New Leads (Today)</p>
          <h3 className="crm-stat-value">{stats.newLeadsToday}</h3>
        </div>
        <div className="crm-stat-card">
          <p className="crm-stat-label">New Leads (7d)</p>
          <h3 className="crm-stat-value">{stats.newLeads7d}</h3>
        </div>
        <div className="crm-stat-card">
          <p className="crm-stat-label">Deals in Pipeline</p>
          <h3 className="crm-stat-value">{stats.dealsInPipeline}</h3>
        </div>
        <div className="crm-stat-card">
          <p className="crm-stat-label">Closed Deals</p>
          <h3 className="crm-stat-value">{stats.closedDeals}</h3>
        </div>
        <div className="crm-stat-card">
          <p className="crm-stat-label">Revenue (Closed)</p>
          <h3 className="crm-stat-value">
            ${stats.revenueClosed.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* MAIN LAYOUT: Center (Graphs) + Right Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* CENTER SECTION — MAIN GRAPHS */}
        <div>
          {/* PRIMARY GRAPH — Time-series line chart */}
          <div className="crm-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Leads Over Time
            </h2>
            <div style={{
              height: '400px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '16px'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Leads"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECONDARY GRAPHS (2-3) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="crm-section">
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                Lead Source Breakdown
              </h2>
              <div style={{
                height: '300px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '16px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="crm-section">
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                Conversion Funnel
              </h2>
              <div style={{
                height: '300px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '16px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionFunnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis 
                      dataKey="stage" 
                      type="category" 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="crm-section">
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                Activity Distribution
              </h2>
              <div style={{
                height: '300px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '16px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="activity" 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE PANEL (DASHBOARD ONLY) */}
        <div>
          <div className="crm-section" style={{ marginBottom: '16px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Revenue Summary
            </h2>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Closed Revenue</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
                ${stats.revenueClosed.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Pipeline Value</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#3b82f6' }}>
                ${stats.pipelineValue.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="crm-section" style={{ marginBottom: '16px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Deals Closing Soon
            </h2>
            <div style={{
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              No deals closing soon (placeholder)
            </div>
          </div>

          <div className="crm-section">
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Priority / Alerts
            </h2>
            <div style={{
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#64748b'
            }}>
              No priority alerts (placeholder)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
