import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export const LEAD_AI_STATES = [
  'new',
  'collecting_info',
  'qualified',
  'booking_offered',
  'booked',
  'booking_blocked',
  'escalated_to_human',
] as const;

export type LeadAiState = (typeof LEAD_AI_STATES)[number];

@Injectable()
export class LeadStateService {
  constructor(private readonly db: DatabaseService) {}

  async getState(leadId: string): Promise<LeadAiState> {
    const { rows } = await this.db.query(
      `SELECT COALESCE(lead_ai_state, 'new') as state FROM leads WHERE id = $1`,
      [leadId],
    );
    return (rows[0]?.state || 'new') as LeadAiState;
  }

  async transition(
    leadId: string,
    toState: LeadAiState,
    reason?: string,
  ): Promise<{ fromState: string; toState: LeadAiState }> {
    const fromState = await this.getState(leadId);
    await this.db.query(
      `UPDATE leads SET lead_ai_state = $1, updated_at = NOW() WHERE id = $2`,
      [toState, leadId],
    );
    await this.logTransition(leadId, fromState, toState, reason);
    return { fromState, toState };
  }

  async logTransition(
    leadId: string,
    fromState: string,
    toState: string,
    reason?: string,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO lead_state_transitions (lead_id, from_state, to_state, reason)
       VALUES ($1, $2, $3, $4)`,
      [leadId, fromState, toState, reason || null],
    );
  }
}
