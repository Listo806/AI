import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

// New KPI Card with dark theme and accent colors
function KpiCard({ icon, value, label, accentColor = '#2563EB', sub }) {
  return (
    <div className="dashboard-kpi-card" style={{
      background: '#0F172A',
      border: `1px solid #1E293B`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: '12px',
      padding: '16px',
      transition: 'all 0.2s',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{
          display: 'grid',
          placeItems: 'center',
          height: '40px',
          width: '40px',
          borderRadius: '8px',
          background: `${accentColor}15`,
          color: accentColor,
          fontSize: '20px',
          flexShrink: 0
        }}>
          {icon}
        </div>
        {sub && (
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: accentColor,
            padding: '2px 8px',
            background: `${accentColor}15`,
            borderRadius: '4px'
          }}>
            {sub}
          </div>
        )}
      </div>
      <div style={{ 
        fontSize: '28px', 
        fontWeight: '700', 
        color: '#E5E7EB',
        marginBottom: '4px',
        lineHeight: '1.2'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '13px', 
        color: '#94A3B8',
        fontWeight: '500'
      }}>
        {label}
      </div>
    </div>
  );
}

// Funnel Visualization Component - Using clip-path for funnel shape
function FunnelVisualization({ data }) {
  const { t } = useTranslation();
  const { newLeads, contacted, showings, offers } = data;
  
  // Calculate percentages based on previous stage (not total)
  const contactedPercent = newLeads > 0 ? Math.round((contacted / newLeads) * 100) : 0;
  const showingsPercent = newLeads > 0 ? Math.round((showings / newLeads) * 100) : 0;
  
  // Blue shades getting progressively darker (matching the image)
  const segments = [
    { 
      label: t('dashboard.newLeadsLabel'), 
      value: newLeads, 
      clipPath: 'polygon(0% 0%, 100% 0%, 94% 100%, 6% 100%)', // Top segment - narrows slightly
      bg: 'rgba(37, 99, 235, 0.2)', // Blue with opacity for dark theme
      text: '#E5E7EB', // Light text
      showPercent: false
    },
    { 
      label: t('dashboard.contactedLabel'), 
      value: contacted, 
      clipPath: 'polygon(6% 0%, 94% 0%, 88% 100%, 12% 100%)', // Second segment - narrower
      bg: 'rgba(37, 99, 235, 0.25)', // Medium blue
      text: '#E5E7EB', // Light text
      showPercent: true, 
      percent: contactedPercent,
      percentBg: '#1E293B', // Dark box
      percentText: '#E5E7EB' // Light text
    },
    { 
      label: t('dashboard.showingsLabel'), 
      value: showings, 
      clipPath: 'polygon(12% 0%, 88% 0%, 82% 100%, 18% 100%)', // Third segment - even narrower
      bg: 'rgba(37, 99, 235, 0.3)', // Darker blue
      text: '#E5E7EB', // Light text
      showPercent: true, 
      percent: showingsPercent,
      percentBg: '#1E293B', // Dark box
      percentText: '#E5E7EB' // Light text
    },
    { 
      label: t('dashboard.offersLabel'), 
      value: offers, 
      clipPath: 'polygon(18% 0%, 82% 0%, 76% 100%, 24% 100%)', // Bottom segment - narrowest
      bg: 'rgba(37, 99, 235, 0.35)', // Darkest blue
      text: '#E5E7EB', // Light text
      showPercent: true, 
      percent: offers,
      isNumber: true,
      percentBg: '#1E293B', // Dark box
      percentText: '#E5E7EB' // Light text
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
  const { t } = useTranslation();
  
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
    const baseLabel = t('dashboard.newLeads');
    switch (timeframe) {
      case 'Today':
        return `${baseLabel} (${t('common.today')})`;
      case '7d':
        return `${baseLabel} (7d)`;
      case '30d':
        return `${baseLabel} (30d)`;
      default:
        return baseLabel;
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
            <option value="Today">{t('common.today')}</option>
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
  const { t } = useTranslation();
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
    contactedLeads: 0,
    dealsInPipeline: 0,
    closedDeals: 0,
    revenueClosed: 0,
    pipelineValue: 0,
    dealsClosingSoon: 0,
    priorityAlerts: 0,
    whatsappLeadsToday: 0,
    instagramLeadsToday: 0,
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
        contactedLeads: summary.leads?.new || 0, // Placeholder - would come from API
        dealsInPipeline: 1, // Placeholder - would come from pipeline endpoint
        closedDeals: 0, // Placeholder - would come from pipeline endpoint
        revenueClosed: 0, // Placeholder - would come from revenue endpoint
        pipelineValue: 0, // Placeholder - would come from pipeline endpoint
        dealsClosingSoon: 3, // Placeholder - deals closing in next 7 days
        priorityAlerts: 2, // Placeholder - critical alerts count
        whatsappLeadsToday: 5, // Placeholder - WhatsApp leads today
        instagramLeadsToday: 3, // Placeholder - Instagram leads today
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
    <div style={{ background: '#020617', minHeight: '100vh', color: '#E5E7EB' }}>
      {error && (
        <div className="crm-error">
          {error}
        </div>
      )}

      {/* MAIN LAYOUT: Main Section (Full Width) */}
      <div className="dashboard-layout" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* MAIN SECTION */}
        <div className="dashboard-main-section" style={{ width: '100%' }}>
          {/* FIRST ROW: 4 KPIs */}
          <div className="dashboard-kpi-row">
            <LeadsKpiCard 
              stats={stats}
              timeframe={leadsTimeframe}
              onTimeframeChange={setLeadsTimeframe}
            />
            <KpiCard 
              icon="📞" 
              value={stats.contactedLeads || 0} 
              label={t('dashboard.contactedLabel')}
              accentColor="#14B8A6"
            />
            <KpiCard 
              icon="🔄" 
              value={stats.dealsInPipeline || 0} 
              label={t('dashboard.dealsInPipeline')}
              accentColor="#6366F1"
            />
            <KpiCard 
              icon="💰" 
              value={`$${stats.revenueClosed.toLocaleString() || 0}`} 
              label={t('dashboard.revenue')}
              accentColor="#22C55E"
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
                  color: '#E5E7EB'
                }}>
                  {t('dashboard.leadsOverTime')}
                </h2>
                <select
                  value={leadsOverTimeRange}
                  onChange={(e) => setLeadsOverTimeRange(e.target.value)}
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#E5E7EB',
                    background: '#020617',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    padding: '8px 32px 8px 12px',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23E5E7EB\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
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
                      {t('dashboard.leadsOverTime')}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: "#94A3B8", fontSize: 12 }} 
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: "#94A3B8", fontSize: 12 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: "#94A3B8", fontSize: 12 }}
                          tickFormatter={(v) => `$${v / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            borderRadius: "10px",
                            border: "1px solid #1E293B",
                            color: "#E5E7EB"
                          }}
                          formatter={(value, name) => {
                            if (name === t('dashboard.revenue')) {
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
                          name={t('dashboard.newLeads')}
                        />
                        {/* DEALS — RED */}
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="deals"
                          stroke="#EF4444"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                          name={t('dashboard.dealsInPipeline')}
                        />
                        {/* REVENUE — BLUE */}
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#2563EB"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                          name={t('dashboard.revenue')}
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
              <h2 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600', color: '#E5E7EB' }}>
                {t('dashboard.conversionFunnel')}
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94A3B8' }}>
                Lead progression through stages
              </p>
              <div style={{
                height: '250px',
                background: '#020617',
                borderRadius: '8px',
                border: '1px solid #1E293B',
                padding: '16px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionFunnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis type="number" stroke="#94A3B8" style={{ fontSize: '11px' }} />
                    <YAxis 
                      dataKey="stage" 
                      type="category" 
                      stroke="#94A3B8"
                      style={{ fontSize: '11px' }}
                      width={90}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0F172A', 
                        border: '1px solid #1E293B',
                        borderRadius: '6px',
                        color: '#E5E7EB'
                      }}
                    />
                    <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="crm-section">
              <h2 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                Lead Source Breakdown
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94A3B8' }}>
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
                {t('dashboard.activityDistribution')}
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94A3B8' }}>
                Communication touchpoints with leads
              </p>
              <div style={{
                height: '250px',
                background: '#020617',
                borderRadius: '8px',
                border: '1px solid #1E293B',
                padding: '16px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis 
                      dataKey="activity" 
                      stroke="#94A3B8"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="#94A3B8"
                      style={{ fontSize: '11px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0F172A', 
                        border: '1px solid #1E293B',
                        borderRadius: '6px',
                        color: '#E5E7EB'
                      }}
                    />
                    <Bar dataKey="count" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Summary - 4th column */}
            <div className="crm-section">
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#E5E7EB' }}>
                {t('dashboard.revenueSummary')}
              </h2>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>{t('dashboard.revenue')}</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#22C55E' }}>
                  ${stats.revenueClosed.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>Pipeline Value</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#2563EB' }}>
                  ${(stats.pipelineValue || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: ACTION SIGNAL GRID */}
          <div className="dashboard-action-grid">
            {/* Card 1: Deals Closing Soon */}
            <Link to="/dashboard/pipeline" className="dashboard-action-card" style={{
              background: '#0F172A',
              border: '1px solid #1E293B',
              borderLeft: '4px solid #F59E0B',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  display: 'grid',
                  placeItems: 'center',
                  height: '36px',
                  width: '36px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  fontSize: '20px'
                }}>
                  ⏰
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#E5E7EB' }}>
                  {t('dashboard.dealsClosingSoon')}
                </h3>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#E5E7EB', marginBottom: '4px' }}>
                {stats.dealsClosingSoon || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                {t('dashboard.next7Days')}
              </div>
            </Link>

            {/* Card 2: Priority Alerts */}
            <div className="dashboard-action-card" style={{
              background: '#0F172A',
              border: '1px solid #1E293B',
              borderLeft: '4px solid #EF4444',
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  display: 'grid',
                  placeItems: 'center',
                  height: '36px',
                  width: '36px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  fontSize: '20px'
                }}>
                  🚨
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#E5E7EB' }}>
                  {t('dashboard.priorityAlerts')}
                </h3>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#E5E7EB', marginBottom: '4px' }}>
                {stats.priorityAlerts || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                {t('dashboard.requiresAttention')}
              </div>
            </div>

            {/* Card 3: WhatsApp Leads */}
            <Link to="/dashboard/whatsapp" className="dashboard-action-card" style={{
              background: '#0F172A',
              border: '1px solid #1E293B',
              borderLeft: '4px solid #22C55E',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(34, 197, 94, 0)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  display: 'grid',
                  placeItems: 'center',
                  height: '36px',
                  width: '36px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22C55E',
                  fontSize: '20px'
                }}>
                  💬
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#E5E7EB' }}>
                  {t('dashboard.whatsappLeads')}
                </h3>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#E5E7EB', marginBottom: '4px' }}>
                {stats.whatsappLeadsToday || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                {t('dashboard.newToday')}
              </div>
            </Link>

            {/* Card 4: Instagram Leads */}
            <Link to="/dashboard/instagram" className="dashboard-action-card" style={{
              background: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '20px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
              cursor: 'pointer',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(225, 48, 108, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: 'linear-gradient(180deg, #E1306C 0%, #F77737 100%)',
                borderRadius: '12px 0 0 12px'
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  display: 'grid',
                  placeItems: 'center',
                  height: '36px',
                  width: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.15) 0%, rgba(247, 119, 55, 0.15) 100%)',
                  color: '#E1306C',
                  fontSize: '20px'
                }}>
                  📷
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#E5E7EB' }}>
                  {t('dashboard.instagramLeads')}
                </h3>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#E5E7EB', marginBottom: '4px' }}>
                {stats.instagramLeadsToday || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                {t('dashboard.newToday')}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
