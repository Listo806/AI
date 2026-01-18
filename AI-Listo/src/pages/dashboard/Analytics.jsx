import { useState } from 'react';

export default function Analytics() {
  const [filters, setFilters] = useState({
    timeRange: '30d',
    agent: 'all',
    source: 'all'
  });

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Analytics</h1>
      
      {/* Filters */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '16px', 
        background: '#fff', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <select
          value={filters.timeRange}
          onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
          className="crm-select"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
        <select
          value={filters.agent}
          onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
          className="crm-select"
        >
          <option value="all">All Agents</option>
          <option value="me">Me</option>
        </select>
        <select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          className="crm-select"
        >
          <option value="all">All Sources</option>
          <option value="website">Website</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
      </div>

      {/* Full-width Charts */}
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Primary Chart */}
        <div className="crm-section">
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            Leads Over Time
          </h2>
          <div style={{
            height: '400px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            Time-series line chart placeholder
          </div>
        </div>

        {/* Secondary Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="crm-section">
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Lead Source Breakdown
            </h2>
            <div style={{
              height: '300px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}>
              Pie/Bar chart placeholder
            </div>
          </div>

          <div className="crm-section">
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Conversion Funnel
            </h2>
            <div style={{
              height: '300px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}>
              Funnel chart placeholder
            </div>
          </div>

          <div className="crm-section">
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Activity Distribution
            </h2>
            <div style={{
              height: '300px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}>
              Distribution chart placeholder
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
