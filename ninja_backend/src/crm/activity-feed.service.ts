import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface NormalizedActivityItem {
  type: string;
  label: string;
  timestamp: string;
  entity_type: string;
  entity_id: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  'lead.created': 'Lead created',
  'lead.updated': 'Lead updated',
  'lead.status_changed': 'Lead status changed',
  'lead.assigned': 'Lead assigned',
  'lead.deleted': 'Lead deleted',
  'property.created': 'Property created',
  'property.updated': 'Property updated',
  'property.published': 'Property published',
  'property.status_changed': 'Property status changed',
  'property.deleted': 'Property deleted',
  'subscription.created': 'Subscription created',
  'subscription.updated': 'Subscription updated',
  'subscription.cancelled': 'Subscription cancelled',
  'subscription.renewed': 'Subscription renewed',
  'subscription.activated': 'Subscription activated',
  'subscription.deactivated': 'Subscription deactivated',
  'team.created': 'Team created',
  'team.updated': 'Team updated',
  'team.member_added': 'Team member added',
  'team.member_removed': 'Team member removed',
  'user.signed_up': 'User signed up',
  'user.logged_in': 'User logged in',
  'user.updated': 'User updated',
  'payment.succeeded': 'Payment succeeded',
  'payment.failed': 'Payment failed',
  'payment.refunded': 'Payment refunded',
};

@Injectable()
export class ActivityFeedService {
  constructor(private readonly db: DatabaseService) {}

  eventTypeToLabel(eventType: string): string {
    return EVENT_LABELS[eventType] || eventType.replace(/\./g, ' ');
  }

  aiActionLabel(action: string, outcome: string | null): string {
    const base = action.replace(/_/g, ' ');
    return outcome ? `${base} · ${outcome}` : base;
  }

  /**
   * Merged timeline from `events` and `ai_activity` (same sources used for per-lead labels).
   */
  async getRecentActivity(
    isGlobal: boolean,
    teamIds: string[],
    limit: number,
  ): Promise<NormalizedActivityItem[]> {
    const cap = Math.min(Math.max(limit, 1), 80);
    const params: unknown[] = [];
    let teamFilterEvents = '';
    let teamFilterAi = '';
    if (!isGlobal) {
      if (teamIds.length === 0) {
        return [];
      }
      params.push(teamIds);
      teamFilterEvents = `WHERE e.team_id = ANY($1::uuid[])`;
      teamFilterAi = `WHERE a.team_id = ANY($1::uuid[])`;
    }

    const limitParam = isGlobal ? 1 : 2;
    if (isGlobal) {
      params.push(cap);
    } else {
      params.push(cap);
    }

    const sql = isGlobal
      ? `
      SELECT * FROM (
        SELECT e.event_type::text AS type_key, e.entity_type::text AS entity_type,
               e.entity_id::text AS entity_id, e.created_at AS ts, 'event'::text AS src,
               NULL::text AS outcome
        FROM events e
        UNION ALL
        SELECT a.action::text, CASE WHEN a.lead_id IS NOT NULL THEN 'lead' ELSE 'ai_activity' END,
               COALESCE(a.lead_id::text, a.id::text), a.created_at, 'ai', a.outcome::text
        FROM ai_activity a
      ) x
      ORDER BY ts DESC
      LIMIT $1
    `
      : `
      SELECT * FROM (
        SELECT e.event_type::text AS type_key, e.entity_type::text AS entity_type,
               e.entity_id::text AS entity_id, e.created_at AS ts, 'event'::text AS src,
               NULL::text AS outcome
        FROM events e
        ${teamFilterEvents}
        UNION ALL
        SELECT a.action::text, CASE WHEN a.lead_id IS NOT NULL THEN 'lead' ELSE 'ai_activity' END,
               COALESCE(a.lead_id::text, a.id::text), a.created_at, 'ai', a.outcome::text
        FROM ai_activity a
        ${teamFilterAi}
      ) x
      ORDER BY ts DESC
      LIMIT $2
    `;

    const { rows } = await this.db.query(sql, params);
    return rows.map(
      (r: {
        type_key: string;
        entity_type: string;
        entity_id: string | null;
        ts: Date;
        src: string;
        outcome: string | null;
      }) => {
        const ts = r.ts instanceof Date ? r.ts.toISOString() : new Date(r.ts).toISOString();
        if (r.src === 'event') {
          return {
            type: r.type_key,
            label: this.eventTypeToLabel(r.type_key),
            timestamp: ts,
            entity_type: r.entity_type,
            entity_id: r.entity_id,
          };
        }
        return {
          type: `ai.${r.type_key}`,
          label: this.aiActionLabel(r.type_key, r.outcome),
          timestamp: ts,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
        };
      },
    );
  }

  /**
   * Latest unified label per lead (events on lead + ai_activity for that lead).
   */
  async getLastActionLabelsForLeadIds(
    isGlobal: boolean,
    teamIds: string[],
    leadIds: string[],
  ): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (leadIds.length === 0) return out;

    const params: unknown[] = [leadIds];
    let evFilter = 'e.entity_type = \'lead\' AND e.entity_id = ANY($1::uuid[])';
    let aiFilter = 'a.lead_id = ANY($1::uuid[])';
    if (!isGlobal) {
      if (teamIds.length === 0) return out;
      params.push(teamIds);
      evFilter += ' AND e.team_id = ANY($2::uuid[])';
      aiFilter += ' AND a.team_id = ANY($2::uuid[])';
    }

    const sql = `
      WITH unioned AS (
        SELECT e.entity_id::uuid AS lead_id, e.created_at AS ts, e.event_type::text AS type_key, 'event'::text AS src,
               NULL::text AS outcome
        FROM events e
        WHERE ${evFilter}
        UNION ALL
        SELECT a.lead_id, a.created_at, a.action::text, 'ai', a.outcome::text
        FROM ai_activity a
        WHERE ${aiFilter}
      ),
      ranked AS (
        SELECT lead_id, type_key, src, outcome, ts,
               ROW_NUMBER() OVER (PARTITION BY lead_id ORDER BY ts DESC) AS rn
        FROM unioned
      )
      SELECT lead_id::text, type_key, src, outcome FROM ranked WHERE rn = 1
    `;

    const { rows } = await this.db.query(sql, params);
    for (const r of rows as { lead_id: string; type_key: string; src: string; outcome: string | null }[]) {
      const label =
        r.src === 'event'
          ? this.eventTypeToLabel(r.type_key)
          : this.aiActionLabel(r.type_key, r.outcome);
      out.set(r.lead_id, label);
    }
    return out;
  }
}
