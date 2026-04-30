import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AiAssistantService } from '../../integrations/ai/ai-assistant.service';
import { AILeadAnalysisService } from './ai-lead-analysis.service';

export type MessageChannel = 'whatsapp' | 'instagram' | 'email';

export interface MessageDraft {
  channel: MessageChannel;
  content: string;
  subject?: string; // For email only
}

@Injectable()
export class MessageDraftService {
  private readonly logger = new Logger(MessageDraftService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly aiAssistant: AiAssistantService,
    private readonly aiAnalysis: AILeadAnalysisService,
  ) {}

  /**
   * Generate message draft for a lead
   * On-demand only, never cached
   */
  async generateDraft(
    leadId: string,
    channel: MessageChannel,
    teamId: string | null,
  ): Promise<MessageDraft> {
    // Get lead data
    const lead = await this.getLead(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Get AI analysis for context
    const analysis = await this.aiAnalysis.getOrGenerateAnalysis(leadId, teamId);

    // Build context for AI
    const context = await this.buildMessageContext(leadId, lead, analysis);

    // Generate draft using AI (with fallback)
    try {
      const aiOk = teamId && (await this.aiAnalysis.canUseAI(teamId));
      if (this.aiAssistant['isConfigured'] && aiOk) {
        return await this.generateAIDraft(channel, context, teamId);
      }
      return this.generateRuleBasedDraft(channel, context);
    } catch (error) {
      this.logger.warn(`AI draft generation failed, using rule-based:`, error);
      return this.generateRuleBasedDraft(channel, context);
    }
  }

  /**
   * Generate AI-powered draft
   */
  private async generateAIDraft(
    channel: MessageChannel,
    context: MessageContext,
    teamId: string | null,
  ): Promise<MessageDraft> {
    const prompt = this.buildDraftPrompt(channel, context);

    const response = await this.aiAssistant.chat({
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(channel),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      context: { teamId },
    });

    const tokens = this.tokenCountFromUsage(response.usage);
    if (teamId) await this.aiAnalysis.recordAIUsage(teamId, tokens);

    // Parse response
    if (channel === 'email') {
      const parsed = this.parseEmailDraft(response.message);
      if (parsed) {
        return { channel, ...parsed };
      }
    } else {
      const content = this.extractDraftContent(response.message);
      if (content) {
        return { channel, content };
      }
    }

    // Fallback to rule-based
    return this.generateRuleBasedDraft(channel, context);
  }

  private tokenCountFromUsage(usage: any): number {
    if (!usage) return 0;
    if (typeof usage.total_tokens === 'number') return usage.total_tokens;
    const in_ = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
    const out = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0;
    return in_ + out;
  }

  /**
   * Generate rule-based draft (fallback)
   */
  private generateRuleBasedDraft(channel: MessageChannel, context: MessageContext): MessageDraft {
    const leadName = context.leadName || 'there';
    const propertyTitle = context.propertyTitle || 'the property';
    const propertyPrice = context.propertyPrice
      ? `$${context.propertyPrice.toLocaleString()}`
      : 'this property';

    if (channel === 'email') {
      return {
        channel: 'email',
        subject: `Re: ${propertyTitle} - ${context.leadName || 'Property Inquiry'}`,
        content: `Hi ${leadName},\n\nThank you for your interest in ${propertyTitle} (${propertyPrice}).\n\nI'd love to help you learn more about this property. Would you be available for a call or showing?\n\nBest regards`,
      };
    } else if (channel === 'whatsapp' || channel === 'instagram') {
      return {
        channel,
        content: `Hi ${leadName}! Thank you for your interest in ${propertyTitle} (${propertyPrice}). I'd love to help you learn more. Are you available for a call or showing?`,
      };
    }

    return { channel, content: `Hi ${leadName}, thank you for your interest.` };
  }

  /**
   * Build message context
   */
  private async buildMessageContext(
    leadId: string,
    lead: any,
    analysis: any,
  ): Promise<MessageContext> {
    // Get property data
    let propertyTitle: string | null = null;
    let propertyPrice: number | null = null;
    if (lead.property_id) {
      const propertyResult = await this.db.query(
        `SELECT title, price FROM properties WHERE id = $1`,
        [lead.property_id],
      );
      if (propertyResult.rows.length > 0) {
        propertyTitle = propertyResult.rows[0].title;
        propertyPrice = propertyResult.rows[0].price
          ? parseFloat(propertyResult.rows[0].price.toString())
          : null;
      }
    }

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

    // Get last activity
    const lastActivity = lead.last_activity_at || lead.last_contacted_at || lead.created_at;

    return {
      leadName: lead.name,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      propertyTitle,
      propertyPrice,
      buyerIntentScore,
      lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
      source: lead.source,
      analysisSummary: analysis.summary,
      analysisScore: analysis.score,
    };
  }

  /**
   * Build draft prompt for AI
   */
  private buildDraftPrompt(channel: MessageChannel, context: MessageContext): string {
    return `Generate a ${channel} message draft for this real estate lead:

Lead: ${context.leadName}
Property: ${context.propertyTitle || 'Not specified'}
Property Price: ${context.propertyPrice ? `$${context.propertyPrice.toLocaleString()}` : 'Not specified'}
Buyer Intent Score: ${context.buyerIntentScore || 'N/A'}
Source: ${context.source || 'Unknown'}
Last Activity: ${context.lastActivity ? new Date(context.lastActivity).toLocaleDateString() : 'Unknown'}

Context Summary:
${JSON.stringify(context.analysisSummary, null, 2)}

Generate a professional, friendly message. ${channel === 'email' ? 'Include both subject and body.' : 'Keep it concise and conversational.'}`;
  }

  /**
   * Get system prompt for channel
   */
  private getSystemPrompt(channel: MessageChannel): string {
    if (channel === 'email') {
      return 'You are a real estate agent assistant. Generate professional email drafts. Return JSON: {"subject": "...", "content": "..."}';
    } else {
      return `You are a real estate agent assistant. Generate ${channel} message drafts. Keep messages concise, friendly, and professional. Return only the message text.`;
    }
  }

  /**
   * Extract draft content from AI response
   */
  private extractDraftContent(message: string): string | null {
    // Remove markdown code blocks if present
    const cleaned = message.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
    return cleaned || null;
  }

  /**
   * Parse email draft (subject + body)
   */
  private parseEmailDraft(message: string): { subject: string; content: string } | null {
    try {
      const jsonMatch = message.match(/```json\s*([\s\S]*?)\s*```/) || message.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.subject && parsed.content) {
          return { subject: parsed.subject, content: parsed.content };
        }
      }
      // Try direct JSON parse
      const parsed = JSON.parse(message);
      if (parsed.subject && parsed.content) {
        return { subject: parsed.subject, content: parsed.content };
      }
    } catch (error) {
      this.logger.warn(`Failed to parse email draft:`, error);
    }
    return null;
  }

  /**
   * Get lead data
   */
  private async getLead(leadId: string): Promise<any | null> {
    const { rows } = await this.db.query(
      `SELECT id, name, email, phone, status, source, property_id, buyer_id,
              last_contacted_at, last_activity_at, created_at, team_id
       FROM leads WHERE id = $1`,
      [leadId],
    );
    return rows.length > 0 ? rows[0] : null;
  }
}

interface MessageContext {
  leadName: string;
  leadEmail: string | null;
  leadPhone: string | null;
  propertyTitle: string | null;
  propertyPrice: number | null;
  buyerIntentScore: number | null;
  lastActivity: string | null;
  source: string | null;
  analysisSummary: any;
  analysisScore: number;
}
