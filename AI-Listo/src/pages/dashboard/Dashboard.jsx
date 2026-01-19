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

// Funnel Visualization Component - Using clip-path for funnel shape
function FunnelVisualization({ data }) {
  const { newLeads, contacted, showings, offers } = data;
  
  // Calculate percentages based on previous stage (not total)
  const contactedPercent = newLeads > 0 ? Math.round((contacted / newLeads) * 100) : 0;
  const showingsPercent = newLeads > 0 ? Math.round((showings / newLeads) * 100) : 0;
  
  // Blue shades getting progressively darker (matching the image)
  const segments = [
    { 
      label: 'New Leads', 
      value: newLeads, 
      clipPath: 'polygon(0% 0%, 100% 0%, 94% 100%, 6% 100%)', // Top segment - narrows slightly
      bg: '#bfdbfe', // Lightest blue
      text: '#1e40af', // Dark blue text
      showPercent: false
    },
    { 
      label: 'Contacted', 
      value: contacted, 
      clipPath: 'polygon(6% 0%, 94% 0%, 88% 100%, 12% 100%)', // Second segment - narrower
      bg: '#93c5fd', // Medium blue
      text: '#1e40af', // Dark blue text
      showPercent: true, 
      percent: contactedPercent,
      percentBg: '#e5e7eb', // Light grey box
      percentText: '#374151' // Dark grey text
    },
    { 
      label: 'Showings', 
      value: showings, 
      clipPath: 'polygon(12% 0%, 88% 0%, 82% 100%, 18% 100%)', // Third segment - even narrower
      bg: '#60a5fa', // Darker blue
      text: '#1e40af', // Dark blue text
      showPercent: true, 
      percent: showingsPercent,
      percentBg: '#e5e7eb', // Light grey box
      percentText: '#374151' // Dark grey text
    },
    { 
      label: 'Offers', 
      value: offers, 
      clipPath: 'polygon(18% 0%, 82% 0%, 76% 100%, 24% 100%)', // Bottom segment - narrowest
      bg: '#3b82f6', // Darkest blue
      text: '#1e40af', // Dark blue text
      showPercent: true, 
      percent: offers,
      isNumber: true,
      percentBg: '#e5e7eb', // Light grey box
      percentText: '#374151' // Dark grey text
    },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      width: '100%',
      position: 'relative'
    }}>
      {segments.map((segment, index) => (
        <div
          key={index}
          style={{
            position: 'relative',
            width: '100%',
            // minHeight: '90px',
            background: segment.bg,
            clipPath: segment.clipPath,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '14px 18px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: index < segments.length - 1 ? '2px' : '0',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{
            fontSize: '16px',
            fontWeight: '400',
            color: segment.text,
            lineHeight: '1.2',
            textAlign: 'center',
            opacity: 0.9,
            marginBottom: '6px'
          }}>
            {segment.label}
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: segment.text,
            lineHeight: '1',
            textAlign: 'center'
          }}>
            {segment.value}
          </div>
          {segment.showPercent && (
            <div style={{
              position: 'absolute',
              right: '80px',
              bottom: '0%',
              transform: 'translateY(-50%)',
              background: segment.percentBg,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '500',
              color: segment.percentText,
              whiteSpace: 'nowrap'
            }}>
              {segment.isNumber ? segment.percent : `${segment.percent}%`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LeadsKpiCard({ stats, timeframe, onTimeframeChange }) {
  const getLeadsValue = () => {
    switch (timeframe) {
      case 'Today':
        return stats.newLeadsToday || 0;
      case '7d':
        return stats.newLeads7d || 0;
      case '30d':
        return stats.newLeads30d || 0;
      default:
        return stats.newLeadsToday || 0;
    }
  };

  const getLabel = () => {
    switch (timeframe) {
      case 'Today':
        return 'New Leads (Today)';
      case '7d':
        return 'New Leads (7d)';
      case '30d':
        return 'New Leads (30d)';
      default:
        return 'New Leads';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      borderRadius: '12px',
      background: '#f0f9ff',
      padding: '12px 16px',
      boxShadow: '0 2px 8px 0 rgba(59, 130, 246, 0.15), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      border: '1px solid #3b82f6',
      transition: 'all 0.2s',
      position: 'relative'
    }}>
      <div style={{
        display: 'grid',
        placeItems: 'center',
        height: '36px',
        width: '36px',
        borderRadius: '8px',
        background: '#dbeafe',
        color: '#3b82f6',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        📊
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', justifyContent: 'space-between' }}>
          <div style={{ 
            fontSize: '22px', 
            fontWeight: '700', 
            color: '#1e40af' 
          }}>
            {getLeadsValue()}
          </div>
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#1e40af',
              background: '#dbeafe',
              border: '1px solid #93c5fd',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '60px'
            }}
          >
            <option value="Today">Today</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
          </select>
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#1e40af',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: '500',
          marginTop: '4px'
        }}>
          {getLabel()}
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
    newLeads30d: 0,
    uncontactedLeads: 0,
    dealsInPipeline: 0,
    closedDeals: 0,
    revenueClosed: 0,
    pipelineValue: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leadsTimeframe, setLeadsTimeframe] = useState('Today'); // 'Today', '7d', '30d'
  const [leadsOverTimeRange, setLeadsOverTimeRange] = useState('7d'); // '7d', '1 month', '6 month'

  // Demo data for leads over time chart (with deals and revenue)
  const leadsOverTimeData = [
    { date: "Jan 1", leads: 2, deals: 0, revenue: 0 },
    { date: "Jan 8", leads: 5, deals: 1, revenue: 0 },
    { date: "Jan 15", leads: 8, deals: 2, revenue: 2500 },
    { date: "Jan 22", leads: 6, deals: 2, revenue: 5000 },
    { date: "Jan 29", leads: 10, deals: 3, revenue: 7500 },
    { date: "Feb 5", leads: 14, deals: 4, revenue: 12500 },
    { date: "Feb 12", leads: 18, deals: 5, revenue: 18000 },
    { date: "Feb 19", leads: 22, deals: 6, revenue: 24000 },
    { date: "Feb 26", leads: 26, deals: 7, revenue: 31000 },
    { date: "Mar 5", leads: 32, deals: 9, revenue: 42000 },
    { date: "Mar 12", leads: 38, deals: 11, revenue: 56000 },
    { date: "Mar 19", leads: 45, deals: 14, revenue: 72000 }
  ];

  // Demo data for funnel visualization
  const funnelData = {
    newLeads: 120,
    contacted: 85,
    showings: 42,
    offers: 18
  };

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
        newLeads30d: summary.leads?.total || 0, // Placeholder - would come from API
        uncontactedLeads: (summary.leads?.total || 0) - (summary.leads?.new || 0), // Placeholder calculation
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
      {error && (
        <div className="crm-error">
          {error}
        </div>
      )}

      {/* MAIN LAYOUT: Main Section (Left) + Right Section */}
      <div className="dashboard-layout">
        {/* MAIN SECTION (LEFT) */}
        <div className="dashboard-main-section">
          {/* FIRST ROW: 4 KPIs */}
          <div className="dashboard-kpi-row">
            <LeadsKpiCard 
              stats={stats}
              timeframe={leadsTimeframe}
              onTimeframeChange={setLeadsTimeframe}
            />
            <KpiCard 
              icon="📋" 
              value={stats.uncontactedLeads || 0} 
              label="Uncontacted Leads"
            />
            <KpiCard 
              icon="🔄" 
              value={stats.dealsInPipeline || 0} 
              label="Deals in Pipeline"
              isEmphasized={stats.dealsInPipeline > 0}
            />
            <KpiCard 
              icon="💰" 
              value={`$${stats.revenueClosed.toLocaleString() || 0}`} 
              label="Revenue"
              isDeemphasized={stats.revenueClosed === 0}
            />
          </div>

          {/* SECOND ROW: Leads Over Time with Ladder Rectangles and Graph */}
          <div className="dashboard-second-row">
            <div className="crm-section">
              {/* Header */}
              <div className="crm-section-header-wrapper" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#0f172a'
                }}>
                  Leads Over Time
                </h2>
                <select
                  value={leadsOverTimeRange}
                  onChange={(e) => setLeadsOverTimeRange(e.target.value)}
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0f172a',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 32px 8px 12px',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%230f172a\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center'
                  }}
                >
                  <option value="7d">7d</option>
                  <option value="1 month">1 month</option>
                  <option value="6 month">6 month</option>
                </select>
              </div>

              {/* Body: Two Columns */}
              <div className="dashboard-second-row-body">
                {/* Left Column: Funnel Visualization */}
                <div className="dashboard-ladder-column">
                  <FunnelVisualization data={funnelData} />
                </div>

                {/* Right Column: Big Graph */}
                <div className="dashboard-graph-column">
                  <div style={{
                    width: '100%',
                    height: '360px',
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '12px',
                      flexShrink: 0
                    }}>
                      Growth Performance Overview
                    </h3>
                    <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={leadsOverTimeData}>
                        <defs>
                          <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: "#6b7280", fontSize: 12 }} 
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          tickFormatter={(v) => `$${v / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb"
                          }}
                          formatter={(value, name) => {
                            if (name === "Revenue") {
                              return [`$${value.toLocaleString()}`, name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        {/* LEADS — GREEN */}
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="leads"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                          fill="url(#leadsGradient)"
                          name="New Leads"
                        />
                        {/* DEALS — RED */}
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="deals"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                          name="Deals in Pipeline"
                        />
                        {/* REVENUE — BLUE */}
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                          name="Revenue"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* THIRD ROW: 4 Charts (3 charts + Revenue Summary) */}
          <div className="dashboard-charts-row">
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

            {/* Revenue Summary - 4th column */}
            <div className="crm-section">
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
          </div>

          {/* FOURTH ROW: 4 Columns (Deals Closing Soon, Priority/Alerts, 2 Placeholders) */}
          <div className="dashboard-fourth-row">
            <div className="crm-section" style={{ opacity: 0.7 }}>
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

            {/* Placeholder 1 */}
            <div className="crm-section" style={{ opacity: 0.5 }}>
              <h2 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#94a3b8' }}>
                Placeholder
              </h2>
              <div style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#94a3b8',
                textAlign: 'center',
                border: '1px dashed #cbd5e1',
                minHeight: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                Content placeholder
              </div>
            </div>

            {/* Placeholder 2 */}
            <div className="crm-section" style={{ opacity: 0.5 }}>
              <h2 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#94a3b8' }}>
                Placeholder
              </h2>
              <div style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#94a3b8',
                textAlign: 'center',
                border: '1px dashed #cbd5e1',
                minHeight: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                Content placeholder
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
