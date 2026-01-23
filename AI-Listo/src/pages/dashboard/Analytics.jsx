import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import './analytics.css';

// Collapsible Section Component for Mobile
function CollapsibleSection({ title, children, defaultExpanded = false, isMobile = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    // Force re-render of charts when section expands
    if (isExpanded) {
      // Small delay to ensure DOM is ready for chart rendering
      const timer = setTimeout(() => {
        setRenderKey(prev => prev + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  if (!isMobile) {
    // Desktop: Always show expanded
    return (
      <section className="analytics-section">
        <h2 className="analytics-section-title">{title}</h2>
        {children}
      </section>
    );
  }

  // Mobile: Collapsible
  return (
    <section className="analytics-section analytics-section-collapsible">
      <button 
        className="analytics-section-header-button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <h2 className="analytics-section-title">{title}</h2>
        <span className="analytics-section-toggle-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
      {isExpanded && (
        <div className="analytics-section-content" key={renderKey}>
          {children}
        </div>
      )}
    </section>
  );
}

export default function Analytics() {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Options for multi-select filters
  const dateRangeOptions = [
    { value: 'today', label: t('common.today') },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: 'custom', label: t('common.all') }
  ];

  const agentOptions = [
    { value: 'sarah-chen', label: 'Sarah Chen' },
    { value: 'mike-johnson', label: 'Mike Johnson' },
    { value: 'emma-davis', label: 'Emma Davis' },
    { value: 'alex-brown', label: 'Alex Brown' },
    { value: 'lisa-wilson', label: 'Lisa Wilson' }
  ];

  const teamOptions = [
    { value: 'sales', label: 'Sales Team' },
    { value: 'marketing', label: 'Marketing Team' },
    { value: 'support', label: 'Support Team' }
  ];

  const leadSourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'email', label: 'Email' }
  ];

  const campaignOptions = [
    { value: 'q1-website', label: 'Q1 Website Campaign' },
    { value: 'whatsapp-spring', label: 'WhatsApp Spring' },
    { value: 'instagram-summer', label: 'Instagram Summer' },
    { value: 'email-nurture', label: 'Email Nurture' }
  ];

  const leadStatusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'closed', label: 'Closed' }
  ];

  const [filters, setFilters] = useState({
    dateRange: { value: '30d', label: '30d' },
    comparePeriod: false,
    agents: [],
    teams: [],
    leadSources: [],
    campaigns: [],
    leadStatuses: []
  });

  // Mock data - will be replaced with API calls
  const kpiData = {
    totalLeads: 1247,
    qualifiedLeads: 342,
    conversionRate: 27.4,
    revenue: 125000,
    avgTimeToFirstContact: '2.3h',
    changes: {
      totalLeads: 12.5,
      qualifiedLeads: 8.3,
      conversionRate: -2.1,
      revenue: 15.7,
      avgTimeToFirstContact: -0.5
    }
  };

  const funnelData = [
    { stage: 'Lead', count: 1247, conversion: 100 },
    { stage: 'Contacted', count: 892, conversion: 71.5 },
    { stage: 'Qualified', count: 342, conversion: 27.4 },
    { stage: 'Proposal', count: 198, conversion: 15.9 },
    { stage: 'Closed', count: 124, conversion: 9.9 }
  ];

  const leadSourceData = [
    { date: 'Jan 1', website: 12, whatsapp: 8, instagram: 5, email: 3 },
    { date: 'Jan 8', website: 18, whatsapp: 12, instagram: 7, email: 4 },
    { date: 'Jan 15', website: 15, whatsapp: 10, instagram: 6, email: 3 },
    { date: 'Jan 22', website: 22, whatsapp: 15, instagram: 9, email: 5 },
    { date: 'Jan 29', website: 20, whatsapp: 14, instagram: 8, email: 4 },
    { date: 'Feb 5', website: 25, whatsapp: 18, instagram: 11, email: 6 },
    { date: 'Feb 12', website: 24, whatsapp: 17, instagram: 10, email: 5 }
  ];

  const sourcePerformanceData = [
    { source: 'Website', leads: 136, conversion: 32.4, revenue: 45000 },
    { source: 'WhatsApp', leads: 94, conversion: 28.7, revenue: 38000 },
    { source: 'Instagram', leads: 56, conversion: 25.0, revenue: 25000 },
    { source: 'Email', leads: 32, conversion: 21.9, revenue: 17000 }
  ];

  const agentPerformanceData = [
    { agent: 'Sarah Chen', leads: 342, conversion: 31.2, responseTime: '1.2h', revenue: 45000 },
    { agent: 'Mike Johnson', leads: 298, conversion: 28.5, responseTime: '1.8h', revenue: 38000 },
    { agent: 'Emma Davis', leads: 267, conversion: 26.8, responseTime: '2.1h', revenue: 32000 },
    { agent: 'Alex Brown', leads: 234, conversion: 24.1, responseTime: '2.5h', revenue: 25000 },
    { agent: 'Lisa Wilson', leads: 106, conversion: 22.6, responseTime: '2.8h', revenue: 12000 }
  ];

  const activityOutcomeData = [
    { activity: 'Calls', count: 1247, conversions: 342, closures: 124 },
    { activity: 'Messages', count: 2891, conversions: 456, closures: 198 },
    { activity: 'Follow-ups', count: 1567, conversions: 234, closures: 89 }
  ];

  const timeToConversionData = [
    { metric: 'Lead → First Contact', avg: '2.3h', byAgent: { min: '0.8h', max: '4.2h' }, bySource: { min: '1.1h', max: '3.8h' } },
    { metric: 'Contact → Close', avg: '12.5d', byAgent: { min: '8.2d', max: '18.7d' }, bySource: { min: '9.1d', max: '16.3d' } }
  ];

  const campaignData = [
    { campaign: 'Q1 Website Campaign', leads: 342, conversion: 28.4, revenue: 45000 },
    { campaign: 'WhatsApp Spring', leads: 198, conversion: 32.3, revenue: 38000 },
    { campaign: 'Instagram Summer', leads: 156, conversion: 25.6, revenue: 25000 },
    { campaign: 'Email Nurture', leads: 89, conversion: 22.5, revenue: 15000 }
  ];

  const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleDateRangeChange = (selected) => {
    setFilters({ ...filters, dateRange: selected });
  };

  // Update KPI data based on dateRange value
  const getDateRangeValue = () => {
    return filters.dateRange?.value || '30d';
  };

  const handleCompareToggle = () => {
    setFilters({ ...filters, comparePeriod: !filters.comparePeriod });
  };

  // Custom styles for react-select (dark theme)
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#0F172A',
      borderColor: state.isFocused ? '#2563EB' : '#1E293B',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#2563EB'
      },
      minHeight: '38px'
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#0F172A',
      border: '1px solid #1E293B',
      borderRadius: '6px',
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused 
        ? 'rgba(37, 99, 235, 0.1)' 
        : state.isSelected 
        ? 'rgba(37, 99, 235, 0.2)' 
        : '#0F172A',
      color: state.isSelected ? '#E5E7EB' : '#94A3B8',
      '&:active': {
        backgroundColor: 'rgba(37, 99, 235, 0.2)'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'rgba(37, 99, 235, 0.2)',
      borderRadius: '4px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#E5E7EB',
      fontSize: '13px'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#94A3B8',
      '&:hover': {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        color: '#EF4444'
      }
    }),
    input: (base) => ({
      ...base,
      color: '#E5E7EB'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94A3B8'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#E5E7EB'
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: '#1E293B'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#94A3B8',
      '&:hover': {
        color: '#E5E7EB'
      }
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#94A3B8',
      '&:hover': {
        color: '#EF4444'
      }
    })
  };

  return (
    <div className="analytics-page">
      {/* Sticky Top Bar */}
      <div className="analytics-controls-bar">
        <div className="analytics-controls-left">
          <div className="analytics-select-wrapper">
            <Select
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              options={dateRangeOptions}
              styles={selectStyles}
              isSearchable={false}
              className="analytics-react-select"
              classNamePrefix="analytics-select"
            />
          </div>

          <label className="analytics-toggle">
            <input
              type="checkbox"
              checked={filters.comparePeriod}
              onChange={handleCompareToggle}
            />
            <span>{t('analytics.comparePeriod')}</span>
          </label>
        </div>

        <div className="analytics-controls-right">
          <div className="analytics-multi-select-wrapper">
            <Select
              isMulti
              placeholder={t('analytics.agent')}
              options={agentOptions}
              value={filters.agents}
              onChange={(selected) => setFilters({ ...filters, agents: selected || [] })}
              styles={selectStyles}
              className="analytics-react-select"
              classNamePrefix="analytics-select"
            />
          </div>
          <div className="analytics-multi-select-wrapper">
            <Select
              isMulti
              placeholder={t('analytics.team')}
              options={teamOptions}
              value={filters.teams}
              onChange={(selected) => setFilters({ ...filters, teams: selected || [] })}
              styles={selectStyles}
              className="analytics-react-select"
              classNamePrefix="analytics-select"
            />
          </div>
          <div className="analytics-multi-select-wrapper">
            <Select
              isMulti
              placeholder={t('analytics.leadSource')}
              options={leadSourceOptions}
              value={filters.leadSources}
              onChange={(selected) => setFilters({ ...filters, leadSources: selected || [] })}
              styles={selectStyles}
              className="analytics-react-select"
              classNamePrefix="analytics-select"
            />
          </div>
          <div className="analytics-multi-select-wrapper">
            <Select
              isMulti
              placeholder={t('analytics.campaign')}
              options={campaignOptions}
              value={filters.campaigns}
              onChange={(selected) => setFilters({ ...filters, campaigns: selected || [] })}
              styles={selectStyles}
              className="analytics-react-select"
              classNamePrefix="analytics-select"
            />
          </div>
          <div className="analytics-multi-select-wrapper">
            <Select
              isMulti
              placeholder={t('analytics.leadStatus')}
              options={leadStatusOptions}
              value={filters.leadStatuses}
              onChange={(selected) => setFilters({ ...filters, leadStatuses: selected || [] })}
              styles={selectStyles}
              className="analytics-react-select"
              classNamePrefix="analytics-select"
            />
          </div>
        </div>
      </div>

      <div className="analytics-content">
        {/* 1. KPI Overview */}
        <CollapsibleSection 
          title={t('analytics.kpiOverview')} 
          defaultExpanded={true}
          isMobile={isMobile}
        >
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.totalLeads')}</div>
              <div className="analytics-kpi-value">{kpiData.totalLeads.toLocaleString()}</div>
                {filters.comparePeriod && (
                  <div className={`analytics-kpi-change ${kpiData.changes.totalLeads >= 0 ? 'positive' : 'negative'}`}>
                    {kpiData.changes.totalLeads >= 0 ? '+' : ''}{kpiData.changes.totalLeads}%
                  </div>
                )}
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">Qualified Leads</div>
              <div className="analytics-kpi-value">{kpiData.qualifiedLeads.toLocaleString()}</div>
                {filters.comparePeriod && (
                  <div className={`analytics-kpi-change ${kpiData.changes.qualifiedLeads >= 0 ? 'positive' : 'negative'}`}>
                    {kpiData.changes.qualifiedLeads >= 0 ? '+' : ''}{kpiData.changes.qualifiedLeads}%
                  </div>
                )}
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.conversionRate')}</div>
              <div className="analytics-kpi-value">{kpiData.conversionRate}%</div>
                {filters.comparePeriod && (
                  <div className={`analytics-kpi-change ${kpiData.changes.conversionRate >= 0 ? 'positive' : 'negative'}`}>
                    {kpiData.changes.conversionRate >= 0 ? '+' : ''}{kpiData.changes.conversionRate}%
                  </div>
                )}
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">Revenue</div>
              <div className="analytics-kpi-value">${(kpiData.revenue / 1000).toFixed(0)}k</div>
                {filters.comparePeriod && (
                  <div className={`analytics-kpi-change ${kpiData.changes.revenue >= 0 ? 'positive' : 'negative'}`}>
                    {kpiData.changes.revenue >= 0 ? '+' : ''}{kpiData.changes.revenue}%
                  </div>
                )}
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">Avg Time to First Contact</div>
              <div className="analytics-kpi-value">{kpiData.avgTimeToFirstContact}</div>
                {filters.comparePeriod && (
                  <div className={`analytics-kpi-change ${kpiData.changes.avgTimeToFirstContact >= 0 ? 'positive' : 'negative'}`}>
                    {kpiData.changes.avgTimeToFirstContact >= 0 ? '+' : ''}{kpiData.changes.avgTimeToFirstContact}h
                  </div>
                )}
            </div>
          </div>
        </CollapsibleSection>

        {/* 2. Full Conversion Funnel */}
        <CollapsibleSection 
          title={t('analytics.fullConversionFunnel')}
          defaultExpanded={false}
          isMobile={isMobile}
        >
          <div className="analytics-funnel-container">
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
              <BarChart data={funnelData} layout="vertical" margin={isMobile ? { top: 5, right: 10, left: 5, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#64748b" fontSize={isMobile ? 10 : 12} />
                <YAxis dataKey="stage" type="category" stroke="#64748b" fontSize={isMobile ? 10 : 12} width={isMobile ? 70 : 100} />
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
            <div className="analytics-funnel-stats">
              {funnelData.map((item, index) => {
                if (index === 0) return null;
                const prevItem = funnelData[index - 1];
                const dropoff = ((prevItem.count - item.count) / prevItem.count * 100).toFixed(1);
                return (
                  <div key={item.stage} className="analytics-funnel-stat">
                    <span className="analytics-funnel-stat-label">{prevItem.stage} → {item.stage}</span>
                    <span className="analytics-funnel-stat-value">{item.conversion}% ({dropoff}% drop-off)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleSection>

        {/* 3. Lead Source Performance */}
        <CollapsibleSection 
          title="Lead Source Performance"
          defaultExpanded={false}
          isMobile={isMobile}
        >
          <div className="analytics-chart-grid">
            <div className="analytics-chart-card">
              <h3 className="analytics-chart-title">Leads by Source Over Time</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                <AreaChart data={leadSourceData}>
                  <defs>
                    <linearGradient id="websiteGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="whatsappGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                  <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      border: '1px solid #1E293B',
                      borderRadius: '6px',
                      color: '#E5E7EB'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="website" stroke="#2563EB" strokeWidth={1.25} fill="url(#websiteGradient)" name="Website" />
                  <Area type="monotone" dataKey="whatsapp" stroke="#16A34A" strokeWidth={1.25} fill="url(#whatsappGradient)" name="WhatsApp" />
                  <Area type="monotone" dataKey="instagram" stroke="#F59E0B" strokeWidth={1.25} fill="none" name="Instagram" />
                  <Area type="monotone" dataKey="email" stroke="#EF4444" strokeWidth={1.25} fill="none" name="Email" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-chart-card">
              <h3 className="analytics-chart-title">Conversion Rate by Source</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                <BarChart data={sourcePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="source" stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                  <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      border: '1px solid #1E293B',
                      borderRadius: '6px',
                      color: '#E5E7EB'
                    }}
                  />
                  <Bar dataKey="conversion" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="analytics-table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Leads</th>
                  <th>Conversion Rate</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sourcePerformanceData.map((item) => (
                  <tr key={item.source}>
                    <td>{item.source}</td>
                    <td>{item.leads}</td>
                    <td>{item.conversion}%</td>
                    <td>${(item.revenue / 1000).toFixed(0)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        {/* 4. Agent Performance Analytics */}
        <CollapsibleSection 
          title={t('analytics.agentPerformance')}
          defaultExpanded={false}
          isMobile={isMobile}
        >
          <div className="analytics-table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Leads Handled</th>
                  <th>Conversion Rate</th>
                  <th>Avg Response Time</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformanceData.map((item) => (
                  <tr key={item.agent} className="analytics-table-row-clickable">
                    <td>{item.agent}</td>
                    <td>{item.leads}</td>
                    <td>{item.conversion}%</td>
                    <td>{item.responseTime}</td>
                    <td>${(item.revenue / 1000).toFixed(0)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        {/* 5. Activity → Outcome Analysis */}
        <CollapsibleSection 
          title="Activity → Outcome Analysis"
          defaultExpanded={false}
          isMobile={isMobile}
        >
          <div className="analytics-chart-grid">
            <div className="analytics-chart-card">
              <h3 className="analytics-chart-title">Activity Volume</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                <BarChart data={activityOutcomeData} margin={isMobile ? { top: 5, right: 10, left: 5, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="activity" stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                  <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      border: '1px solid #1E293B',
                      borderRadius: '6px',
                      color: '#E5E7EB'
                    }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-chart-card">
              <h3 className="analytics-chart-title">Outcomes by Activity</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                <BarChart data={activityOutcomeData} margin={isMobile ? { top: 5, right: 10, left: 5, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="activity" stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                  <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      border: '1px solid #1E293B',
                      borderRadius: '6px',
                      color: '#E5E7EB'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                  <Bar dataKey="conversions" fill="#16A34A" radius={[4, 4, 0, 0]} name="Conversions" />
                  <Bar dataKey="closures" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Closures" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CollapsibleSection>

        {/* 6. Time-to-Conversion Analysis */}
        <CollapsibleSection 
          title={t('analytics.timeToConversion')}
          defaultExpanded={false}
          isMobile={isMobile}
        >
          <div className="analytics-time-conversion">
            {timeToConversionData.map((item) => (
              <div key={item.metric} className="analytics-time-card">
                <div className="analytics-time-metric">{item.metric}</div>
                <div className="analytics-time-value">{item.avg}</div>
                <div className="analytics-time-breakdown">
                  <div>
                    <span className="analytics-time-label">By Agent:</span>
                    <span>{item.byAgent.min} - {item.byAgent.max}</span>
                  </div>
                  <div>
                    <span className="analytics-time-label">By Source:</span>
                    <span>{item.bySource.min} - {item.bySource.max}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* 7. Campaign / Channel Performance */}
        <CollapsibleSection 
          title="Campaign / Channel Performance"
          defaultExpanded={false}
          isMobile={isMobile}
        >
          <div className="analytics-table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Leads</th>
                  <th>Conversion Rate</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {campaignData.map((item) => (
                  <tr key={item.campaign}>
                    <td>{item.campaign}</td>
                    <td>{item.leads}</td>
                    <td>{item.conversion}%</td>
                    <td>${(item.revenue / 1000).toFixed(0)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
