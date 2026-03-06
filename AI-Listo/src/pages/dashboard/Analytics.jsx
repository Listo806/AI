import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { getDashboardSummary, getAnalyticsDashboard, getActivityMetrics, getOwnerLeads } from '../../api/analyticsApi';
import './analytics.css';

// Collapsible Section: optional collapsible on desktop for lower-priority sections
function CollapsibleSection({ title, children, defaultExpanded = false, isMobile = false, collapsibleOnDesktop = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setRenderKey(prev => prev + 1), 150);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const showCollapsible = isMobile || collapsibleOnDesktop;

  if (!showCollapsible) {
    return (
      <section className="analytics-section">
        <h2 className="analytics-section-title">{title}</h2>
        {children}
      </section>
    );
  }

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

// Build funnel from analytics leads.byStatus (backend: new, contacted, qualified, converted, lost)
function buildFunnelFromLeads(leads) {
  if (!leads?.byStatus) return [];
  const { total, byStatus } = leads;
  const newCount = byStatus.new ?? 0;
  const contacted = byStatus.contacted ?? 0;
  const qualified = byStatus.qualified ?? 0;
  const converted = byStatus.converted ?? 0;
  const totalCount = typeof total === 'number' ? total : (newCount + contacted + qualified + converted + (byStatus.lost ?? 0));
  const pct = (n) => totalCount > 0 ? ((n / totalCount) * 100).toFixed(1) : 0;
  return [
    { stage: 'Lead', count: totalCount, conversion: 100 },
    { stage: 'Contacted', count: contacted, conversion: parseFloat(pct(contacted)) },
    { stage: 'Qualified', count: qualified, conversion: parseFloat(pct(qualified)) },
    { stage: 'Proposal', count: 0, conversion: 0 },
    { stage: 'Closed', count: converted, conversion: parseFloat(pct(converted)) },
  ].filter((row) => row.count > 0 || row.stage === 'Lead');
}

// Aggregate leads by source for source performance (from /crm/owner/leads)
function aggregateBySource(leads, leadSourceFilter) {
  let list = Array.isArray(leads) ? leads : [];
  if (leadSourceFilter?.length) {
    const values = leadSourceFilter.map((o) => o.value?.toLowerCase());
    list = list.filter((l) => values.includes((l.source || '').toLowerCase()));
  }
  const bySource = {};
  list.forEach((l) => {
    const src = (l.source || 'other').trim() || 'other';
    const key = src.charAt(0).toUpperCase() + src.slice(1).toLowerCase();
    if (!bySource[key]) bySource[key] = { leads: 0, converted: 0 };
    bySource[key].leads += 1;
    if (l.status === 'converted' || l.status === 'qualified') bySource[key].converted += 1;
  });
  return Object.entries(bySource).map(([source, d]) => ({
    source,
    leads: d.leads,
    conversion: d.leads > 0 ? ((d.converted / d.leads) * 100).toFixed(1) : 0,
    revenue: 0,
  }));
}

export default function Analytics() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [leadsForSource, setLeadsForSource] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dateRangeOptions = [
    { value: 'today', label: t('common.today') },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: 'custom', label: t('common.all') },
  ];

  const leadSourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'email', label: 'Email' },
  ];

  const leadStatusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'closed', label: 'Closed' },
  ];

  const agentOptions = [];
  const teamOptions = [];
  const campaignOptions = [];

  const [filters, setFilters] = useState({
    dateRange: { value: '30d', label: '30d' },
    comparePeriod: false,
    agents: [],
    teams: [],
    leadSources: [],
    campaigns: [],
    leadStatuses: [],
  });

  const dateValue = filters.dateRange?.value || '30d';

  // Fetch data: Dashboard summary (KPI match), analytics dashboard (funnel), activity, leads for source
  useEffect(() => {
    if (!isAuthenticated() || !user) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [summary, analytics, activity, leads] = await Promise.allSettled([
          getDashboardSummary(),
          getAnalyticsDashboard(dateValue),
          getActivityMetrics(dateValue),
          getOwnerLeads(),
        ]);

        if (cancelled) return;

        const summaryVal = summary.status === 'fulfilled' ? summary.value : null;
        const analyticsVal = analytics.status === 'fulfilled' ? analytics.value : null;
        const activityVal = activity.status === 'fulfilled' ? activity.value : null;
        const leadsVal = leads.status === 'fulfilled' ? leads.value : [];

        setDashboardSummary(summaryVal);
        setAnalyticsData(analyticsVal);
        setActivityData(activityVal);
        setLeadsForSource(Array.isArray(leadsVal) ? leadsVal : []);
      } catch (err) {
        if (!cancelled) setError(err.message || t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, user, dateValue]);

  // KPI from dashboard summary (match Dashboard page)
  const kpiData = useMemo(() => {
    const total = dashboardSummary?.leads?.total ?? 0;
    const qualified = dashboardSummary?.leads?.qualified ?? 0;
    const conversionRate = total > 0 ? ((qualified / total) * 100).toFixed(1) : 0;
    const deals = dashboardSummary?.deals || {};
    return {
      totalLeads: total,
      qualifiedLeads: qualified,
      conversionRate: parseFloat(conversionRate) || 0,
      revenue: deals.wonValue != null ? Number(deals.wonValue) : null,
      pipelineValue: deals.pipelineValue != null ? Number(deals.pipelineValue) : null,
      dealsTotal: deals.total ?? 0,
      avgTimeToFirstContact: null,
      changes: null,
    };
  }, [dashboardSummary]);

  // Deals by stage for chart (from dashboard summary)
  const dealsByStageData = useMemo(() => {
    const byStage = dashboardSummary?.deals?.byStage || {};
    const stageLabels = [
      { key: 'new', label: 'New' },
      { key: 'qualified', label: 'Qualified' },
      { key: 'proposal', label: 'Proposal' },
      { key: 'negotiation', label: 'Negotiation' },
      { key: 'won', label: 'Won' },
      { key: 'lost', label: 'Lost' },
    ];
    return stageLabels.map(({ key, label }) => ({
      stage: label,
      count: Number(byStage[key]) || 0,
    })).filter((d) => d.count > 0);
  }, [dashboardSummary]);

  // Funnel from analytics dashboard leads
  const funnelData = useMemo(() => {
    if (!analyticsData?.leads) return buildFunnelFromLeads({ byStatus: {}, total: 0 });
    return buildFunnelFromLeads(analyticsData.leads);
  }, [analyticsData]);

  // Source performance from leads list (when available)
  const sourcePerformanceData = useMemo(
    () => aggregateBySource(leadsForSource, filters.leadSources),
    [leadsForSource, filters.leadSources],
  );

  // Lead source over time: use activity eventsByDay if present
  const leadSourceData = useMemo(() => {
    if (activityData?.eventsByDay?.length) {
      return activityData.eventsByDay.slice(-14).map((d) => ({
        date: d.date.slice(5) || d.date,
        count: d.count || 0,
      }));
    }
    return [];
  }, [activityData]);

  // Activity outcome from analytics activity (eventsByType)
  const activityOutcomeData = useMemo(() => {
    if (!activityData?.eventsByType || typeof activityData.eventsByType !== 'object') return [];
    return Object.entries(activityData.eventsByType).map(([activity, count]) => ({
      activity,
      count: Number(count) || 0,
      conversions: 0,
      closures: 0,
    }));
  }, [activityData]);

  // Agent performance: no backend per-agent metrics yet
  const agentPerformanceData = [];

  // Time-to-conversion and campaign: no backend data
  const timeToConversionData = [];
  const campaignData = [];

  const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleDateRangeChange = (selected) => {
    setFilters((f) => ({ ...f, dateRange: selected }));
  };

  const handleCompareToggle = () => {
    setFilters((f) => ({ ...f, comparePeriod: !f.comparePeriod }));
  };

  if (!isAuthenticated() || !user) return null;

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

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-content" style={{ padding: '24px', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-content" style={{ padding: '24px', color: 'var(--danger, #dc2626)' }}>
          {error}
        </div>
      </div>
    );
  }

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
              <div className="analytics-kpi-value">{Number(kpiData.totalLeads).toLocaleString()}</div>
              {filters.comparePeriod && kpiData.changes && (
                <div className={`analytics-kpi-change ${kpiData.changes.totalLeads >= 0 ? 'positive' : 'negative'}`}>
                  {kpiData.changes.totalLeads >= 0 ? '+' : ''}{kpiData.changes.totalLeads}%
                </div>
              )}
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.qualifiedLeads')}</div>
              <div className="analytics-kpi-value">{Number(kpiData.qualifiedLeads).toLocaleString()}</div>
              {filters.comparePeriod && kpiData.changes && (
                <div className={`analytics-kpi-change ${kpiData.changes.qualifiedLeads >= 0 ? 'positive' : 'negative'}`}>
                  {kpiData.changes.qualifiedLeads >= 0 ? '+' : ''}{kpiData.changes.qualifiedLeads}%
                </div>
              )}
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.conversionRate')}</div>
              <div className="analytics-kpi-value">{kpiData.conversionRate}%</div>
              {filters.comparePeriod && kpiData.changes && (
                <div className={`analytics-kpi-change ${kpiData.changes.conversionRate >= 0 ? 'positive' : 'negative'}`}>
                  {kpiData.changes.conversionRate >= 0 ? '+' : ''}{kpiData.changes.conversionRate}%
                </div>
              )}
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.revenue')}</div>
              <div className="analytics-kpi-value">{kpiData.revenue != null ? `$${(Number(kpiData.revenue) / 1000).toFixed(0)}k` : '—'}</div>
              {filters.comparePeriod && kpiData.changes && kpiData.changes.revenue != null && (
                <div className={`analytics-kpi-change ${kpiData.changes.revenue >= 0 ? 'positive' : 'negative'}`}>
                  {kpiData.changes.revenue >= 0 ? '+' : ''}{kpiData.changes.revenue}%
                </div>
              )}
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.avgTimeToFirstContact')}</div>
              <div className="analytics-kpi-value">{kpiData.avgTimeToFirstContact ?? '—'}</div>
              {filters.comparePeriod && kpiData.changes && kpiData.changes.avgTimeToFirstContact != null && (
                <div className={`analytics-kpi-change ${kpiData.changes.avgTimeToFirstContact >= 0 ? 'positive' : 'negative'}`}>
                  {kpiData.changes.avgTimeToFirstContact >= 0 ? '+' : ''}{kpiData.changes.avgTimeToFirstContact}h
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* 2. Full Conversion Funnel - compressed */}
        <CollapsibleSection 
          title={t('analytics.fullConversionFunnel')}
          defaultExpanded={true}
          isMobile={isMobile}
        >
          <div className="analytics-funnel-container analytics-funnel-compressed">
            {funnelData.length === 0 ? (
              <p className="analytics-empty-inline">{t('analytics.noData') || 'No funnel data for this period.'}</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
                  <BarChart data={funnelData} layout="vertical" margin={isMobile ? { top: 5, right: 10, left: 5, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#64748b" fontSize={isMobile ? 10 : 12} />
                    <YAxis dataKey="stage" type="category" stroke="#64748b" fontSize={isMobile ? 10 : 12} width={isMobile ? 70 : 100} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '6px', color: '#E5E7EB' }} />
                    <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="analytics-funnel-stats">
                  {funnelData.map((item, index) => {
                    if (index === 0) return null;
                    const prevItem = funnelData[index - 1];
                    const dropoff = prevItem.count > 0 ? ((prevItem.count - item.count) / prevItem.count * 100).toFixed(1) : 0;
                    return (
                      <div key={item.stage} className="analytics-funnel-stat">
                        <span className="analytics-funnel-stat-label">{prevItem.stage} → {item.stage}</span>
                        <span className="analytics-funnel-stat-value">{item.conversion}% ({dropoff}% drop-off)</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* 2b. Pipeline & Deals */}
        <CollapsibleSection 
          title={t('analytics.pipelineDeals')}
          defaultExpanded={true}
          isMobile={isMobile}
        >
          <div className="analytics-kpi-grid" style={{ marginBottom: '16px' }}>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.totalDeals')}</div>
              <div className="analytics-kpi-value">{Number(kpiData.dealsTotal || 0).toLocaleString()}</div>
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.pipelineValue')}</div>
              <div className="analytics-kpi-value">{kpiData.pipelineValue != null ? `$${Number(kpiData.pipelineValue).toLocaleString()}` : '—'}</div>
            </div>
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-label">{t('analytics.wonValue')}</div>
              <div className="analytics-kpi-value">{kpiData.revenue != null ? `$${Number(kpiData.revenue).toLocaleString()}` : '—'}</div>
            </div>
          </div>
          {dealsByStageData.length === 0 ? (
            <p className="analytics-empty-inline">{t('analytics.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
              <BarChart data={dealsByStageData} margin={isMobile ? { top: 5, right: 10, left: 5, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={isMobile ? 10 : 12} />
                <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 12} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '6px', color: '#E5E7EB' }} />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name={t('analytics.dealsByStage')} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CollapsibleSection>

        {/* 3. Source Performance - unified block */}
        <CollapsibleSection 
          title={t('analytics.leadSourcePerformance')}
          defaultExpanded={true}
          isMobile={isMobile}
        >
          <div className="analytics-source-block">
          <div className="analytics-chart-grid analytics-chart-grid-tight">
            <div className="analytics-chart-card">
              <h3 className="analytics-chart-title">{t('analytics.leadsBySourceOverTime')}</h3>
              {leadSourceData.length === 0 ? (
                <p className="analytics-empty-inline">{t('analytics.noData') || 'No data for this period.'}</p>
              ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                  <AreaChart data={leadSourceData}>
                    <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                    <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '6px', color: '#E5E7EB' }} />
                    <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={1.25} fill="url(#activityGradient)" name={t('analytics.activityVolume') || 'Activity'} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="analytics-chart-card">
              <h3 className="analytics-chart-title">{t('analytics.conversionRateBySource')}</h3>
              {sourcePerformanceData.length === 0 ? (
                <p className="analytics-empty-inline">{t('analytics.noData') || 'No source data. Connect leads with sources to see metrics.'}</p>
              ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                  <BarChart data={sourcePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="source" stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                    <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '6px', color: '#E5E7EB' }} />
                    <Bar dataKey="conversion" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="analytics-table-container">
            {sourcePerformanceData.length === 0 ? (
              <p className="analytics-empty-inline">{t('analytics.noData') || 'No source data.'}</p>
            ) : (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>{t('analytics.leadSource')}</th>
                    <th>{t('analytics.totalLeads')}</th>
                    <th>{t('analytics.conversionRate')}</th>
                    <th>{t('analytics.revenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sourcePerformanceData.map((item) => (
                    <tr key={item.source}>
                      <td>{item.source}</td>
                      <td>{item.leads}</td>
                      <td>{Number(item.conversion)}%</td>
                      <td>{item.revenue != null && item.revenue > 0 ? `$${(Number(item.revenue) / 1000).toFixed(0)}k` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </div>
        </CollapsibleSection>

        {/* 4. Agent Performance - table only, improved spacing */}
        <CollapsibleSection 
          title={t('analytics.agentPerformance')}
          defaultExpanded={true}
          isMobile={isMobile}
        >
          <div className="analytics-table-container analytics-agent-table-wrap">
            {agentPerformanceData.length === 0 ? (
              <p className="analytics-empty-inline">{t('analytics.noData') || 'No agent metrics for this period.'}</p>
            ) : (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>{t('analytics.agent')}</th>
                    <th>{t('analytics.leadsHandled')}</th>
                    <th>{t('analytics.conversionRate')}</th>
                    <th>{t('analytics.avgResponseTime')}</th>
                    <th>{t('analytics.revenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformanceData.map((item) => (
                    <tr key={item.agent} className="analytics-table-row-clickable">
                      <td>{item.agent}</td>
                      <td>{item.leads}</td>
                      <td>{item.conversion}%</td>
                      <td>{item.responseTime}</td>
                      <td>{item.revenue != null ? `$${(Number(item.revenue) / 1000).toFixed(0)}k` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CollapsibleSection>

        {/* 5. Activity → Outcome - collapsible on desktop */}
        <CollapsibleSection 
          title={t('analytics.activityOutcome')}
          defaultExpanded={false}
          isMobile={isMobile}
          collapsibleOnDesktop
        >
          <div className="analytics-chart-grid">
            {activityOutcomeData.length === 0 ? (
              <p className="analytics-empty-inline">{t('analytics.noData') || 'No activity data for this period.'}</p>
            ) : (
              <>
                <div className="analytics-chart-card">
                  <h3 className="analytics-chart-title">{t('analytics.activityVolume')}</h3>
                  <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                    <BarChart data={activityOutcomeData} margin={isMobile ? { top: 5, right: 10, left: 5, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="activity" stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                      <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '6px', color: '#E5E7EB' }} />
                      <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="analytics-chart-card">
                  <h3 className="analytics-chart-title">{t('analytics.outcomesByActivity')}</h3>
                  <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                    <BarChart data={activityOutcomeData} margin={isMobile ? { top: 5, right: 10, left: 5, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="activity" stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                      <YAxis stroke="#64748b" fontSize={isMobile ? 10 : 11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '6px', color: '#E5E7EB' }} />
                      <Legend wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }} />
                      <Bar dataKey="conversions" fill="#16A34A" radius={[4, 4, 0, 0]} name={t('analytics.conversions') || 'Conversions'} />
                      <Bar dataKey="closures" fill="#F59E0B" radius={[4, 4, 0, 0]} name={t('analytics.closures') || 'Closures'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* 6. Time-to-Conversion - collapsible on desktop */}
        <CollapsibleSection 
          title={t('analytics.timeToConversion')}
          defaultExpanded={false}
          isMobile={isMobile}
          collapsibleOnDesktop
        >
          {timeToConversionData.length === 0 ? (
            <p className="analytics-empty-inline">{t('analytics.noData') || 'No time-to-conversion data for this period.'}</p>
          ) : (
            <div className="analytics-time-conversion">
              {timeToConversionData.map((item) => (
                <div key={item.metric} className="analytics-time-card">
                  <div className="analytics-time-metric">{item.metric}</div>
                  <div className="analytics-time-value">{item.avg}</div>
                  <div className="analytics-time-breakdown">
                    <div>
                      <span className="analytics-time-label">By Agent:</span>
                      <span>{item.byAgent?.min} - {item.byAgent?.max}</span>
                    </div>
                    <div>
                      <span className="analytics-time-label">By Source:</span>
                      <span>{item.bySource?.min} - {item.bySource?.max}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* 7. Campaign Performance - collapsible on desktop */}
        <CollapsibleSection 
          title={t('analytics.campaignPerformance')}
          defaultExpanded={false}
          isMobile={isMobile}
          collapsibleOnDesktop
        >
          {campaignData.length === 0 ? (
            <p className="analytics-empty-inline">{t('analytics.noData') || 'No campaign data for this period.'}</p>
          ) : (
            <div className="analytics-table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>{t('analytics.campaign')}</th>
                    <th>{t('analytics.totalLeads')}</th>
                    <th>{t('analytics.conversionRate')}</th>
                    <th>{t('analytics.revenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignData.map((item) => (
                    <tr key={item.campaign}>
                      <td>{item.campaign}</td>
                      <td>{item.leads}</td>
                      <td>{item.conversion}%</td>
                      <td>${(Number(item.revenue) / 1000).toFixed(0)}k</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
