import {
  Users,
  UserCheck,
  DollarSign,
  Target,
  Brain,
  TrendingUp,
} from 'lucide-react';

/* =========================================================
   MEMBER FILTERS
========================================================= */

export const TEAM_FILTERS = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'active',
    label: 'Active',
  },
  {
    key: 'pending',
    label: 'Pending',
  },
  {
    key: 'manager',
    label: 'Managers',
  },
  {
    key: 'agent',
    label: 'Agents',
  },
  // {
    // key: 'viewer',
    // label: 'Viewer',
  // },
  {
    key: 'high-performers',
    label: 'High Performers',
  }
];

/* =========================================================
   KPI CARDS
========================================================= */

export const buildStatsCards = (stats = {}) => [
  {
    key: 'members',
    label: 'Total Members',
    value: stats.totalMembers || 0,
    change: stats.membersGrowth || '+0%',
    changetext: 'Last 30 days',
    icon: Users,
  },

  {
    key: 'active',
    label: 'Active Members',
    value: stats.activeMembers || 0,
    change: stats.activeGrowth || '+0%',
    changetext: 'Last 30 days',
    icon: UserCheck,
  },

  {
    key: 'pipeline',
    label: 'Pipeline Value',
    value: `$${Number(
      stats.totalPipeline || 0
    ).toLocaleString()}`,
    change: stats.pipelineGrowth || '+0%',
    changetext: 'Last 30 days',
    icon: DollarSign,
  },

  {
    key: 'leads',
    label: 'Total Leads',
    value: stats.totalLeads || 0,
    change: stats.leadsGrowth || '+0%',
    changetext: 'Last 30 days',
    icon: Target,
  },

  {
    key: 'ai',
    label: 'Avg AI Score',
    value: `${stats.avgAIScore || 0}%`,
    change: stats.aiGrowth || '+0%',
    changetext: 'Last 30 days',
    icon: Brain,
  },

  {
    key: 'conversion',
    label: 'Conversion Rate',
    value: `${stats.conversionRate || 0}%`,
    change: stats.conversionGrowth || '+0%',
    changetext: 'Last 30 days',
    icon: TrendingUp,
  },
];

/* =========================================================
   ROLE COLORS
========================================================= */

export const ROLE_STYLES = {
  owner: {
    bg: '#ede9fe',
    text: '#7c3aed',
  },

  manager: {
    bg: '#dbeafe',
    text: '#2563eb',
  },

  agent: {
    bg: '#dcfce7',
    text: '#16a34a',
  },
  viewer: {
    bg: '#e6cdcc',
    text: '#5d0d09',
  },
  admin: {
    bg: '#e7cfee',
    text: '#4b095d',
  },
};

/* =========================================================
   STATUS COLORS
========================================================= */

export const STATUS_STYLES = {
  active: {
    bg: '#dcfce7',
    text: '#16a34a',
  },

  pending: {
    bg: '#fef3c7',
    text: '#d97706',
  },

  inactive: {
    bg: '#fee2e2',
    text: '#dc2626',
  },
};