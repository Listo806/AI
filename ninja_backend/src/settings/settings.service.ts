import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const DEFAULT_NOTIFICATIONS = {
  newLeadAssigned: true,
  newCustomerMessage: true,
  appointmentUpdates: true,
  taskUpdates: true,
  pipelineChanges: true,
  aiHumanAssistance: true,
  importantTeamActivity: true,
  billingAccountAlerts: true,
  emailNotifications: true,
  inAppNotifications: true,
};

const DEFAULT_PREFERENCES = {
  timeZone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  defaultLandingPage: '/dashboard',
  defaultWorkspace: null as string | null,
};

@Injectable()
export class SettingsService {
  constructor(private readonly db: DatabaseService) {}

  private async ensureRow(userId: string) {
    await this.db.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
  }

  async get(userId: string, teamId?: string | null) {
    await this.ensureRow(userId);
    const { rows } = await this.db.query(
      `SELECT notification_preferences, preferences
       FROM user_settings WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    const availableWorkspaces = await this.availableWorkspaces(userId, teamId);
    return {
      notifications: { ...DEFAULT_NOTIFICATIONS, ...(rows[0]?.notification_preferences || {}) },
      preferences: { ...DEFAULT_PREFERENCES, ...(rows[0]?.preferences || {}) },
      availableWorkspaces,
    };
  }

  async updateNotifications(userId: string, input: Record<string, unknown>) {
    const allowed = Object.keys(DEFAULT_NOTIFICATIONS);
    const clean: Record<string, boolean> = {};
    for (const key of allowed) {
      if (typeof input?.[key] === 'boolean') clean[key] = input[key] as boolean;
    }
    // Billing/account alerts include operational notices and cannot be disabled.
    clean.billingAccountAlerts = true;
    await this.ensureRow(userId);
    const { rows } = await this.db.query(
      `UPDATE user_settings
       SET notification_preferences = notification_preferences || $2::jsonb, updated_at = NOW()
       WHERE user_id = $1
       RETURNING notification_preferences`,
      [userId, JSON.stringify(clean)],
    );
    return { success: true, notifications: { ...DEFAULT_NOTIFICATIONS, ...rows[0].notification_preferences } };
  }

  async updatePreferences(userId: string, teamId: string | null | undefined, input: Record<string, unknown>) {
    const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
    const timeFormats = ['12h', '24h'];
    const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BRL', 'MXN'];
    const landingPages = ['/dashboard', '/dashboard/leads', '/dashboard/pipeline', '/dashboard/contacts', '/dashboard/calendar', '/dashboard/whatsapp'];
    const clean: Record<string, unknown> = {};

    if (typeof input.timeZone === 'string') {
      try { Intl.DateTimeFormat('en-US', { timeZone: input.timeZone }); clean.timeZone = input.timeZone; }
      catch { throw new BadRequestException('Invalid time zone.'); }
    }
    if (typeof input.dateFormat === 'string' && dateFormats.includes(input.dateFormat)) clean.dateFormat = input.dateFormat;
    if (typeof input.timeFormat === 'string' && timeFormats.includes(input.timeFormat)) clean.timeFormat = input.timeFormat;
    if (typeof input.currency === 'string' && currencies.includes(input.currency)) clean.currency = input.currency;
    if (typeof input.defaultLandingPage === 'string' && landingPages.includes(input.defaultLandingPage)) clean.defaultLandingPage = input.defaultLandingPage;

    if (input.defaultWorkspace === null || input.defaultWorkspace === '') {
      clean.defaultWorkspace = null;
    } else if (typeof input.defaultWorkspace === 'string') {
      const available = await this.availableWorkspaces(userId, teamId);
      if (!available.some((w) => w.id === input.defaultWorkspace)) {
        throw new BadRequestException('You do not have access to that workspace.');
      }
      clean.defaultWorkspace = input.defaultWorkspace;
    }

    await this.ensureRow(userId);
    const { rows } = await this.db.query(
      `UPDATE user_settings
       SET preferences = preferences || $2::jsonb, updated_at = NOW()
       WHERE user_id = $1 RETURNING preferences`,
      [userId, JSON.stringify(clean)],
    );
    return { success: true, preferences: { ...DEFAULT_PREFERENCES, ...rows[0].preferences } };
  }

  async availableWorkspaces(userId: string, teamId?: string | null) {
    if (!teamId) return [];
    const { rows } = await this.db.query(
      `SELECT DISTINCT workspace_id AS id
       FROM workspace_entitlements
       WHERE team_id = $1
         AND status = 'active'
         AND (user_id IS NULL OR user_id = $2)
       ORDER BY workspace_id`,
      [teamId, userId],
    );
    return rows.map((r: any) => ({ id: r.id, label: this.workspaceLabel(r.id) }));
  }

  async notificationAllowed(userId: string, preferenceKey: keyof typeof DEFAULT_NOTIFICATIONS, channel: 'email' | 'inApp') {
    const settings = await this.get(userId);
    if (preferenceKey === 'billingAccountAlerts') return true;
    if (!settings.notifications[preferenceKey]) return false;
    return channel === 'email' ? settings.notifications.emailNotifications : settings.notifications.inAppNotifications;
  }

  private workspaceLabel(id: string) {
    const labels: Record<string, string> = {
      business: 'Business Suite', sales: 'Sales Workspace', ecommerce: 'E-Commerce',
      insurance: 'Insurance', 'financial-services': 'Financial Services',
      'customer-service': 'Customer Service', marketing: 'Marketing', projects: 'Projects',
      'real-estate': 'Real Estate', team: 'Team Workspace', 'lead-generator': 'Lead Generator',
      'aesthetic-wellness': 'Aesthetic & Wellness', 'clinic-medical': 'Clinic & Medical',
    };
    return labels[id] || id;
  }
}
