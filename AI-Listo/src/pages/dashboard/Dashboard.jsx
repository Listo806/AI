import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useApiErrorHandler } from '../../utils/useApiErrorHandler';

// Chart data - will be replaced with real API data
const chartData = [
  { name: 'Jan 1', blue: 8, green: 6 },
  { name: 'Jan 8', blue: 14, green: 11 },
  { name: 'Jan 15', blue: 12, green: 10 },
  { name: 'Jan 22', blue: 18, green: 13 },
  { name: 'Jan 29', blue: 16, green: 14 },
  { name: 'Feb 5', blue: 20, green: 15 },
  { name: 'Feb 12', blue: 19, green: 16 },
];

function KpiCard({ icon, value, label, sub, isEmphasized = false, isDeemphasized = false }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      borderRadius: '12px',
      background: isEmphasized ? '#f0f9ff' : '#fff',
      padding: '12px 16px',
      boxShadow: isEmphasized 
        ? '0 2px 8px 0 rgba(59, 130, 246, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.05)' 
        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      border: isEmphasized 
        ? '1px solid #3b82f6' 
        : isDeemphasized 
        ? '1px solid #e2e8f0' 
        : '1px solid #e2e8f0',
      opacity: isDeemphasized ? 0.6 : 1,
      transition: 'all 0.2s'
    }}>
      <div style={{
        display: 'grid',
        placeItems: 'center',
        height: '36px',
        width: '36px',
        borderRadius: '8px',
        background: isEmphasized ? '#dbeafe' : '#f1f5f9',
        color: isEmphasized ? '#3b82f6' : '#334155',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div style={{ 
            fontSize: isEmphasized ? '22px' : '20px', 
            fontWeight: isEmphasized ? '700' : '600', 
            color: isEmphasized ? '#1e40af' : '#0f172a' 
          }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: '12px', fontWeight: '500', color: '#10b981' }}>{sub}</div>}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: isEmphasized ? '#1e40af' : '#64748b',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: isEmphasized ? '500' : '400'
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

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
        dealsInPipeline: 1, // Placeholder - would come from pipeline endpoint
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
      {/* <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Dashboard</h1> */}
      {error && (
        <div className="crm-error">
          {error}
        </div>
      )}

      {/* TOP SECTION — METRIC CARDS (6 required) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px',
        marginBottom: '24px'
      }}>
        <KpiCard 
          icon="📊" 
          value={stats.totalLeads || 0} 
          label="Total Leads" 
        />
        <KpiCard 
          icon="✨" 
          value={stats.newLeadsToday || 0} 
          label="New Leads" 
          sub={`+${stats.newLeadsToday || 0} Today`}
          isEmphasized={true}
        />
        <KpiCard 
          icon="📈" 
          value={stats.newLeads7d || 0} 
          label="New Leads (7d)" 
        />
        <KpiCard 
          icon="🔄" 
          value={stats.dealsInPipeline || 0} 
          label="Deals in Pipeline"
          isEmphasized={stats.dealsInPipeline > 0}
        />
        <KpiCard 
          icon="✅" 
          value={stats.closedDeals || 0} 
          label="Closed Deals" 
        />
        <KpiCard 
          icon="💰" 
          value={`$${stats.revenueClosed.toLocaleString() || 0}`} 
          label="Revenue (Closed)"
          isDeemphasized={stats.revenueClosed === 0}
        />
      </div>

      {/* HERO CHART — Leads Over Time (Full Width, Top Priority) */}
      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              Leads Growth Over Time
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
              Track your lead acquisition trends
            </p>
          </div>
        </div>
        <div style={{
          height: '400px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '20px'
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
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MAIN LAYOUT: Secondary Charts + Right Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* CENTER SECTION — SECONDARY GRAPHS */}
        <div>
          {/* SECONDARY GRAPHS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="crm-section">
              <h2 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                Lead Source Breakdown
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                Where your leads come from
              </p>
              <div style={{
                height: '250px',
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
                      outerRadius={70}
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
              <h2 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                Conversion Funnel
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                Lead progression through stages
              </p>
              <div style={{
                height: '250px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '16px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionFunnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis 
                      dataKey="stage" 
                      type="category" 
                      stroke="#64748b"
                      style={{ fontSize: '11px' }}
                      width={90}
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
              <h2 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                Activity Distribution
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                Communication touchpoints with leads
              </p>
              <div style={{
                height: '250px',
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
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '11px' }}
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

          <div className="crm-section" style={{ marginBottom: '16px', opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#94a3b8' }}>
                Deals Closing Soon
              </h2>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '2px 8px',
                background: '#f1f5f9',
                borderRadius: '4px'
              }}>
                Coming Soon
              </span>
            </div>
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#94a3b8',
              textAlign: 'center',
              border: '1px dashed #cbd5e1'
            }}>
              This feature will show deals closing in the next 7 days
            </div>
          </div>

          <div className="crm-section" style={{ opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#94a3b8' }}>
                Priority / Alerts
              </h2>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '2px 8px',
                background: '#f1f5f9',
                borderRadius: '4px'
              }}>
                Coming Soon
              </span>
            </div>
            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#94a3b8',
              textAlign: 'center',
              border: '1px dashed #cbd5e1'
            }}>
              Priority alerts and notifications will appear here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
