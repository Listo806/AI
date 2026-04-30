import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { LeadAIService, LeadContext } from '../lead-ai.service';
import { AiAssistantService } from '../../integrations/ai/ai-assistant.service';
import { LeadStatus } from '../entities/lead.entity';

export type IntentLabel = 'browsing' | 'low_intent' | 'medium_intent' | 'high_intent' | 'ready_to_buy';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type NextActionType = 'call' | 'whatsapp' | 'email' | 'wait' | 'assign_agent';
export type Timing = 'immediate' | 'within_24h' | 'within_48h';

export interface AISummary {
  background: string;
  property_interest: string;
  engagement: string;
  key_insights: string[];
}

export interface NextAction {
  action: NextActionType;
  reason: string;
  timing: Timing;
}

export interface LeadAIAnalysis {
  score: number; // 0-100 (rule-based + AI adjustment)
  intent_label: IntentLabel;
  priority: Priority;
  ai_adjustment: number; // ±10 max
  summary: AISummary;
  next_action: NextAction;
  updated_at: Date;
}

@Injectable()
export class AILeadAnalysisService {
  private readonly logger = new Logger(AILeadAnalysisService.name);

  // Rate limits (per team)
  private readonly RATE_LIMIT_PER_MIN = 20;
  private readonly RATE_LIMIT_PER_DAY = 500;
  private readonly TOKEN_LIMIT_PER_REQUEST = 2000;
  private readonly TOKEN_LIMIT_PER_DAY = 100000;

  constructor(
    private readonly db: DatabaseService,
    private readonly leadAIService: LeadAIService,
    private readonly aiAssistant: AiAssistantService,
  ) {}

  /**
   * Get or generate AI analysis for a lead
   * Returns cached analysis if available and fresh, otherwise generates new
   */
  async getOrGenerateAnalysis(leadId: string, teamId: string | null): Promise<LeadAIAnalysis> {
    // Check cache first
    const cached = await this.getCachedAnalysis(leadId);
    if (cached) {
      // Check if cache is stale (older than 24 hours or lead was updated)
      const lead = await this.getLead(leadId);
      if (lead && cached.updated_at >= lead.updated_at) {
        return cached;
      }
    }

    // Generate new analysis
    return await this.generateAnalysis(leadId, teamId);
  }

  /**
   * Generate AI analysis for a lead
   * Rule-based score is source of truth, AI can adjust ±10
   */
  private async generateAnalysis(leadId: string, teamId: string | null): Promise<LeadAIAnalysis> {
    // Get lead data
    const lead = await this.getLead(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Build lead context
    const context = await this.buildLeadContext(leadId, lead);

    // Calculate rule-based score (source of truth)
    const ruleBasedScore = this.leadAIService.calculateAIScore(context);

    // Try to get AI adjustment (±10 max)
    let aiAdjustment = 0;
    try {
      // Check rate limits
      if (teamId && !(await this.checkRateLimits(teamId))) {
        this.logger.warn(`Rate limit exceeded for team ${teamId}, using rule-based score only`);
      } else {
        aiAdjustment = await this.getAIAdjustment(leadId, context, ruleBasedScore, teamId);
        // Clamp adjustment to ±10
        aiAdjustment = Math.max(-10, Math.min(10, aiAdjustment));
      }
    } catch (error) {
      this.logger.warn(`AI adjustment failed for lead ${leadId}, using rule-based score:`, error);
      // Continue with rule-based score only
    }

    // Final score (rule-based + AI adjustment)
    const finalScore = Math.max(0, Math.min(100, ruleBasedScore + aiAdjustment));

    // Map score to intent and priority
    const { intent_label, priority } = this.mapScoreToIntentAndPriority(finalScore);

    // Generate summary (try AI, fallback to rule-based)
    let summary: AISummary;
    try {
      if (teamId && await this.checkRateLimits(teamId)) {
        summary = await this.generateAISummary(leadId, context, teamId);
      } else {
        summary = this.generateRuleBasedSummary(context);
      }
    } catch (error) {
      this.logger.warn(`AI summary generation failed for lead ${leadId}, using rule-based:`, error);
      summary = this.generateRuleBasedSummary(context);
    }

    // Generate next action (try AI, fallback to rule-based)
    let nextAction: NextAction;
    try {
      if (teamId && await this.checkRateLimits(teamId)) {
        nextAction = await this.generateAINextAction(leadId, context, finalScore, teamId);
      } else {
        nextAction = this.generateRuleBasedNextAction(context);
      }
    } catch (error) {
      this.logger.warn(`AI next action generation failed for lead ${leadId}, using rule-based:`, error);
      nextAction = this.generateRuleBasedNextAction(context);
    }

    // Cache the analysis
    await this.cacheAnalysis(leadId, {
      score: finalScore,
      intent_label,
      priority,
      ai_adjustment: aiAdjustment,
      summary,
      next_action: nextAction,
      updated_at: new Date(),
    });

    return {
      score: finalScore,
      intent_label,
      priority,
      ai_adjustment: aiAdjustment,
      summary,
      next_action: nextAction,
      updated_at: new Date(),
    };
  }

  /**
   * Map score to intent label and priority
   */
  private mapScoreToIntentAndPriority(score: number): { intent_label: IntentLabel; priority: Priority } {
    if (score >= 91) {
      return { intent_label: 'ready_to_buy', priority: 'urgent' };
    } else if (score >= 76) {
      return { intent_label: 'high_intent', priority: 'urgent' };
    } else if (score >= 56) {
      return { intent_label: 'medium_intent', priority: 'high' };
    } else if (score >= 31) {
      return { intent_label: 'low_intent', priority: 'medium' };
    } else {
      return { intent_label: 'browsing', priority: 'low' };
    }
  }

  /**
   * Get AI adjustment to score (±10 max)
   */
  private async getAIAdjustment(
    leadId: string,
    context: LeadContext,
    baseScore: number,
    teamId: string | null,
  ): Promise<number> {
    if (!this.aiAssistant['isConfigured']) {
      return 0;
    }

    // Build prompt for AI
    const prompt = this.buildAdjustmentPrompt(context, baseScore);

    try {
      const response = await this.aiAssistant.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a real estate lead scoring assistant. Analyze the lead data and suggest a score adjustment between -10 and +10. Return ONLY a JSON object with a single "adjustment" field (integer). Example: {"adjustment": 5}',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        context: { teamId },
      });

      // Parse JSON response
      const parsed = this.parseJSONResponse(response.message);
      if (parsed && typeof parsed.adjustment === 'number') {
        const tokens = this.tokenCountFromUsage(response.usage);
        if (teamId) await this.recordRateLimitUsage(teamId, tokens);
        return Math.max(-10, Math.min(10, parsed.adjustment));
      }
    } catch (error) {
      this.logger.warn(`AI adjustment failed:`, error);
    }

    return 0; // Fallback: no adjustment
  }

  /**
   * Generate AI summary (structured JSON)
   */
  private async generateAISummary(leadId: string, context: LeadContext, teamId: string | null): Promise<AISummary> {
    if (!this.aiAssistant['isConfigured']) {
      return this.generateRuleBasedSummary(context);
    }

    const prompt = this.buildSummaryPrompt(context);

    try {
      const response = await this.aiAssistant.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a real estate lead analysis assistant. Analyze the lead and return a JSON object with: background (string), property_interest (string), engagement (string), key_insights (array of strings). Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        context: { teamId },
      });

      const parsed = this.parseJSONResponse(response.message);
      if (parsed && this.validateSummary(parsed)) {
        const tokens = this.tokenCountFromUsage(response.usage);
        if (teamId) await this.recordRateLimitUsage(teamId, tokens);
        return parsed;
      }
    } catch (error) {
      this.logger.warn(`AI summary generation failed:`, error);
    }

    return this.generateRuleBasedSummary(context);
  }

  /**
   * Generate AI next action recommendation
   */
  private async generateAINextAction(
    leadId: string,
    context: LeadContext,
    score: number,
    teamId: string | null,
  ): Promise<NextAction> {
    if (!this.aiAssistant['isConfigured']) {
      return this.generateRuleBasedNextAction(context);
    }

    const prompt = this.buildNextActionPrompt(context, score);

    try {
      const response = await this.aiAssistant.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a real estate lead action recommendation assistant. Return a JSON object with: action (one of: call, whatsapp, email, wait, assign_agent), reason (string), timing (one of: immediate, within_24h, within_48h). Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        context: { teamId },
      });

      const parsed = this.parseJSONResponse(response.message);
      if (parsed && this.validateNextAction(parsed)) {
        const tokens = this.tokenCountFromUsage(response.usage);
        if (teamId) await this.recordRateLimitUsage(teamId, tokens);
        return parsed;
      }
    } catch (error) {
      this.logger.warn(`AI next action generation failed:`, error);
    }

    return this.generateRuleBasedNextAction(context);
  }

  /**
   * Generate rule-based summary (fallback)
   */
  private generateRuleBasedSummary(context: LeadContext): AISummary {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(context.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    const lastContactedAt = context.lastContactedAt
      ? Math.floor((Date.now() - new Date(context.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      background: `Lead created ${daysSinceCreation} day${daysSinceCreation !== 1 ? 's' : ''} ago${context.source ? ` via ${context.source}` : ''}. ${context.phone ? 'Has phone number.' : ''} ${context.email ? 'Has email.' : ''}`,
      property_interest: context.propertyPrice
        ? `Interested in property valued at $${context.propertyPrice.toLocaleString()}`
        : 'Property interest not specified',
      engagement: lastContactedAt === null
        ? 'Not yet contacted'
        : `Last contacted ${lastContactedAt} day${lastContactedAt !== 1 ? 's' : ''} ago`,
      key_insights: this.leadAIService.generateReasonBullets(context, this.leadAIService.calculateAIScore(context)),
    };
  }

  /**
   * Generate rule-based next action (fallback)
   */
  private generateRuleBasedNextAction(context: LeadContext): NextAction {
    const recommendation = this.leadAIService.recommendAction(context, context.lastContactedAt || null);

    // Map recommendation action to NextActionType
    let action: NextActionType = 'wait';
    if (recommendation.action === 'CALL') {
      action = 'call';
    } else if (recommendation.action === 'WHATSAPP') {
      action = 'whatsapp';
    } else if (recommendation.action === 'EMAIL') {
      action = 'email';
    } else if (recommendation.action === 'FOLLOW_UP') {
      action = 'wait';
    }

    // Determine timing
    let timing: Timing = 'within_48h';
    if (recommendation.followUpRecommended) {
      timing = 'immediate';
    } else if (context.lastContactedAt) {
      const hoursSinceContact = (Date.now() - new Date(context.lastContactedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceContact > 48) {
        timing = 'immediate';
      } else if (hoursSinceContact > 24) {
        timing = 'within_24h';
      }
    } else {
      timing = 'immediate';
    }

    return {
      action,
      reason: recommendation.reason,
      timing,
    };
  }

  /**
   * Build lead context from lead data and integrations
   */
  private async buildLeadContext(leadId: string, lead: any): Promise<LeadContext> {
    // Get buyer intent score (Milestone 1)
    let buyerIntentScore: number | null = null;
    if (lead.buyer_id) {
      const intentResult = await this.db.query(
        `SELECT score FROM buyer_intent_scores WHERE buyer_id = $1`,
        [lead.buyer_id],
      );
      if (intentResult.rows.length > 0) {
        buyerIntentScore = parseFloat(intentResult.rows[0].score.toString());
      }
    }

    // Get property data
    let propertyPrice: number | null = null;
    let propertyType: string | null = null;
    if (lead.property_id) {
      const propertyResult = await this.db.query(
        `SELECT price, type FROM properties WHERE id = $1`,
        [lead.property_id],
      );
      if (propertyResult.rows.length > 0) {
        propertyPrice = propertyResult.rows[0].price ? parseFloat(propertyResult.rows[0].price.toString()) : null;
        propertyType = propertyResult.rows[0].type;
      }
    }

    // Get engagement count (Milestone 1 buyer_events) only when lead has buyer_id
    let engagementCount = 0;
    if (lead.buyer_id) {
      const engagementResult = await this.db.query(
        `SELECT COUNT(*) as count FROM buyer_events WHERE buyer_id = $1`,
        [lead.buyer_id],
      );
      engagementCount = engagementResult.rows[0]?.count ? parseInt(String(engagementResult.rows[0].count), 10) : 0;
    }

    return {
      status: lead.status as LeadStatus,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      lastContactedAt: lead.last_contacted_at,
      lastActivityAt: lead.last_activity_at,
      lastActionType: lead.last_action_type,
      lastActionAt: lead.last_action_at,
      propertyPrice,
      propertyType,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      engagementCount,
    };
  }

  /**
   * Build prompt for AI score adjustment
   */
  private buildAdjustmentPrompt(context: LeadContext, baseScore: number): string {
    return `Analyze this real estate lead and suggest a score adjustment (-10 to +10):

Lead Context:
- Status: ${context.status}
- Created: ${new Date(context.createdAt).toLocaleDateString()}
- Last Contacted: ${context.lastContactedAt ? new Date(context.lastContactedAt).toLocaleDateString() : 'Never'}
- Has Phone: ${!!context.phone}
- Has Email: ${!!context.email}
- Source: ${context.source || 'Unknown'}
- Property Price: ${context.propertyPrice ? `$${context.propertyPrice.toLocaleString()}` : 'Not specified'}
- Engagement Count: ${context.engagementCount || 0}

Current Rule-Based Score: ${baseScore}

Suggest an adjustment (-10 to +10) based on factors not captured by rules (e.g., source quality, timing signals, buyer behavior patterns). Return JSON: {"adjustment": <number>}`;
  }

  /**
   * Build prompt for AI summary
   */
  private buildSummaryPrompt(context: LeadContext): string {
    return `Analyze this real estate lead and provide a structured summary:

Lead Data:
- Status: ${context.status}
- Created: ${new Date(context.createdAt).toLocaleDateString()}
- Last Contacted: ${context.lastContactedAt ? new Date(context.lastContactedAt).toLocaleDateString() : 'Never'}
- Phone: ${context.phone || 'Not provided'}
- Email: ${context.email || 'Not provided'}
- Source: ${context.source || 'Unknown'}
- Property Price: ${context.propertyPrice ? `$${context.propertyPrice.toLocaleString()}` : 'Not specified'}
- Property Type: ${context.propertyType || 'Not specified'}
- Engagement: ${context.engagementCount || 0} interactions

Return JSON with: background (string), property_interest (string), engagement (string), key_insights (array of 2-4 strings)`;
  }

  /**
   * Build prompt for AI next action
   */
  private buildNextActionPrompt(context: LeadContext, score: number): string {
    return `Recommend the next action for this real estate lead:

Lead Score: ${score}
Status: ${context.status}
Last Contacted: ${context.lastContactedAt ? new Date(context.lastContactedAt).toLocaleDateString() : 'Never'}
Has Phone: ${!!context.phone}
Has Email: ${!!context.email}
Source: ${context.source || 'Unknown'}

Return JSON with: action (call/whatsapp/email/wait/assign_agent), reason (string), timing (immediate/within_24h/within_48h)`;
  }

  /**
   * Parse JSON response from AI (with retry on failure)
   */
  private parseJSONResponse(message: string): any | null {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/) || message.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      // Try direct JSON parse
      return JSON.parse(message);
    } catch (error) {
      this.logger.warn(`Failed to parse AI JSON response:`, error);
      return null;
    }
  }

  /**
   * Validate summary structure
   */
  private validateSummary(obj: any): obj is AISummary {
    return (
      obj &&
      typeof obj.background === 'string' &&
      typeof obj.property_interest === 'string' &&
      typeof obj.engagement === 'string' &&
      Array.isArray(obj.key_insights) &&
      obj.key_insights.every((item: any) => typeof item === 'string')
    );
  }

  /**
   * Validate next action structure
   */
  private validateNextAction(obj: any): obj is NextAction {
    return (
      obj &&
      ['call', 'whatsapp', 'email', 'wait', 'assign_agent'].includes(obj.action) &&
      typeof obj.reason === 'string' &&
      ['immediate', 'within_24h', 'within_48h'].includes(obj.timing)
    );
  }

  /** Public for MessageDraftService and other consumers. */
  async canUseAI(teamId: string): Promise<boolean> {
    return this.checkRateLimits(teamId);
  }

  /** Record AI usage for rate limiting. Public for MessageDraftService. */
  async recordAIUsage(teamId: string | null, tokensUsed: number): Promise<void> {
    if (teamId) await this.recordRateLimitUsage(teamId, tokensUsed);
  }

  private tokenCountFromUsage(usage: any): number {
    if (!usage) return 0;
    if (typeof usage.total_tokens === 'number') return usage.total_tokens;
    const in_ = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
    const out = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0;
    return in_ + out;
  }

  /**
   * Check rate limits for team.
   * Per-minute: current window request_count.
   * Per-day: sum of request_count over last 24h.
   */
  private async checkRateLimits(teamId: string): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (now.getTime() % 60000));
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Per-minute: current window's request_count
    const minRow = await this.db.query(
      `SELECT request_count FROM ai_rate_limits
       WHERE team_id = $1 AND window_start = $2`,
      [teamId, windowStart],
    );
    const minuteRequests = minRow.rows[0]?.request_count ?? 0;
    if (minuteRequests >= this.RATE_LIMIT_PER_MIN) {
      return false;
    }

    // Per-day: sum over last 24h
    const dayCount = await this.db.query(
      `SELECT COALESCE(SUM(request_count), 0)::int as total FROM ai_rate_limits
       WHERE team_id = $1 AND window_start >= $2`,
      [teamId, oneDayAgo],
    );
    const totalRequests = parseInt(String(dayCount.rows[0]?.total ?? 0), 10);
    if (totalRequests >= this.RATE_LIMIT_PER_DAY) {
      return false;
    }

    return true;
  }

  /**
   * Record rate limit usage
   */
  async recordRateLimitUsage(teamId: string | null, tokensUsed: number): Promise<void> {
    if (!teamId) {
      return;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - (now.getTime() % 60000)); // Round to minute

    await this.db.query(
      `INSERT INTO ai_rate_limits (team_id, request_count, token_count, window_start, updated_at)
       VALUES ($1, 1, $2, $3, NOW())
       ON CONFLICT (team_id, window_start)
       DO UPDATE SET 
         request_count = ai_rate_limits.request_count + 1,
         token_count = ai_rate_limits.token_count + $2,
         updated_at = NOW()`,
      [teamId, tokensUsed, windowStart],
    );
  }

  /**
   * Get lead data
   */
  private async getLead(leadId: string): Promise<any | null> {
    const { rows } = await this.db.query(
      `SELECT id, name, email, phone, status, source, property_id, buyer_id,
              last_contacted_at, last_activity_at, last_action_type, last_action_at,
              created_at, updated_at, team_id
       FROM leads WHERE id = $1`,
      [leadId],
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get cached analysis
   */
  private async getCachedAnalysis(leadId: string): Promise<LeadAIAnalysis | null> {
    const { rows } = await this.db.query(
      `SELECT score, intent_label, priority, ai_adjustment, summary_json, next_action_json, updated_at
       FROM lead_ai_analysis WHERE lead_id = $1`,
      [leadId],
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      score: row.score,
      intent_label: row.intent_label,
      priority: row.priority,
      ai_adjustment: row.ai_adjustment,
      summary: row.summary_json,
      next_action: row.next_action_json,
      updated_at: row.updated_at,
    };
  }

  /**
   * Cache analysis
   */
  private async cacheAnalysis(leadId: string, analysis: LeadAIAnalysis): Promise<void> {
    await this.db.query(
      `INSERT INTO lead_ai_analysis 
       (lead_id, score, intent_label, priority, ai_adjustment, summary_json, next_action_json, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (lead_id)
       DO UPDATE SET
         score = $2,
         intent_label = $3,
         priority = $4,
         ai_adjustment = $5,
         summary_json = $6,
         next_action_json = $7,
         updated_at = $8`,
      [
        leadId,
        analysis.score,
        analysis.intent_label,
        analysis.priority,
        analysis.ai_adjustment,
        JSON.stringify(analysis.summary),
        JSON.stringify(analysis.next_action),
        analysis.updated_at,
      ],
    );
  }
}
