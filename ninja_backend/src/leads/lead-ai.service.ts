import { Injectable } from '@nestjs/common';
import { LeadStatus } from './entities/lead.entity';

export type LeadPriority = 'hot' | 'warm' | 'cold';
export type SuggestedAction = 'call-now' | 'send-email' | 'schedule-viewing' | 'follow-up-days';

export interface LeadAICalculation {
  aiScore: number; // 0-100
  priority: LeadPriority;
  aiExplanation: string[];
  suggestedNextAction: SuggestedAction;
  actionDetails?: string; // e.g., "Follow up in 3 days"
}

export interface LeadContext {
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date | null;
  propertyPrice?: number | null;
  propertyType?: string | null;
  aiScore?: number | null; // Previous score if exists
  phone?: string | null; // For action suggestions
  email?: string | null; // For action suggestions
}

@Injectable()
export class LeadAIService {
  /**
   * Calculate AI score (0-100) based on multiple factors
   */
  calculateAIScore(context: LeadContext): number {
    let score = 50; // Base score

    // Status-based scoring
    switch (context.status) {
      case LeadStatus.CLOSED_WON:
        return 100;
      case LeadStatus.CLOSED_LOST:
        return 0;
      case LeadStatus.QUALIFIED:
        score += 25;
        break;
      case LeadStatus.FOLLOW_UP:
        score += 15;
        break;
      case LeadStatus.CONTACTED:
        score += 10;
        break;
      case LeadStatus.NEW:
        score += 5;
        break;
    }

    // Time since last contact (recent = higher score)
    if (context.lastContactedAt) {
      const hoursSinceContact = (Date.now() - new Date(context.lastContactedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceContact < 12) {
        score += 20;
      } else if (hoursSinceContact < 24) {
        score += 15;
      } else if (hoursSinceContact < 48) {
        score += 10;
      } else if (hoursSinceContact < 168) { // 7 days
        score += 5;
      } else {
        score -= 10; // Stale contact
      }
    } else {
      // No contact yet - check lead age
      const hoursSinceCreation = (Date.now() - new Date(context.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation < 24) {
        score += 15; // Fresh lead
      } else if (hoursSinceCreation < 72) {
        score += 5;
      } else {
        score -= 5; // Old uncontacted lead
      }
    }

    // Property value impact
    if (context.propertyPrice) {
      if (context.propertyPrice >= 500000) {
        score += 10; // High-value property
      } else if (context.propertyPrice >= 300000) {
        score += 5;
      }
    }

    // Property type impact (sale typically higher value than rent)
    if (context.propertyType === 'sale') {
      score += 5;
    }

    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine priority (hot/warm/cold) based on rules
   */
  calculatePriority(context: LeadContext, aiScore: number): LeadPriority {
    const now = Date.now();
    const createdAt = new Date(context.createdAt).getTime();
    const updatedAt = new Date(context.updatedAt).getTime();
    const lastContactedAt = context.lastContactedAt ? new Date(context.lastContactedAt).getTime() : null;

    // Hot Lead if ANY is true:
    // - AI score >= 80%
    if (aiScore >= 80) {
      return 'hot';
    }

    // - OR last activity within 48h
    const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
    if (hoursSinceUpdate < 48) {
      return 'hot';
    }

    // - OR status = Qualified AND high-value property
    if (context.status === LeadStatus.QUALIFIED && context.propertyPrice && context.propertyPrice >= 300000) {
      return 'hot';
    }

    // - OR lead created within last 24h
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation < 24) {
      return 'hot';
    }

    // Warm if AI score >= 50
    if (aiScore >= 50) {
      return 'warm';
    }

    // Otherwise cold
    return 'cold';
  }

  /**
   * Generate AI explanation for the score
   */
  generateAIExplanation(context: LeadContext, aiScore: number): string[] {
    const explanations: string[] = [];

    // Status-based explanations
    switch (context.status) {
      case LeadStatus.QUALIFIED:
        explanations.push('Qualified status');
        break;
      case LeadStatus.FOLLOW_UP:
        explanations.push('Follow-up required');
        break;
      case LeadStatus.CONTACTED:
        explanations.push('Recently contacted');
        break;
      case LeadStatus.NEW:
        explanations.push('New lead');
        break;
    }

    // Time-based explanations
    if (context.lastContactedAt) {
      const hoursSinceContact = (Date.now() - new Date(context.lastContactedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceContact < 12) {
        explanations.push(`Recent activity (${Math.round(hoursSinceContact)}h ago)`);
      } else if (hoursSinceContact < 48) {
        explanations.push(`Activity within 48h`);
      } else if (hoursSinceContact > 168) {
        explanations.push('Needs re-engagement');
      }
    } else {
      const hoursSinceCreation = (Date.now() - new Date(context.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation < 24) {
        explanations.push('Fresh lead (created today)');
      }
    }

    // Property value explanations
    if (context.propertyPrice) {
      if (context.propertyPrice >= 500000) {
        explanations.push('High-value property');
      } else if (context.propertyPrice >= 300000) {
        explanations.push('Premium property');
      }
    }

    // Score-based explanations
    if (aiScore >= 80) {
      explanations.push('High conversion potential');
    } else if (aiScore < 40) {
      explanations.push('Low engagement');
    }

    return explanations.length > 0 ? explanations : ['Standard lead'];
  }

  /**
   * Suggest next action based on lead context
   */
  suggestNextAction(context: LeadContext, aiScore: number): { action: SuggestedAction; details?: string } {
    const now = Date.now();
    const lastContactedAt = context.lastContactedAt ? new Date(context.lastContactedAt).getTime() : null;

    // High priority actions
    if (aiScore >= 80 || context.status === LeadStatus.QUALIFIED) {
      if (context.phone) {
        return { action: 'call-now' };
      } else if (context.email) {
        return { action: 'send-email' };
      }
    }

    // Schedule viewing for qualified leads with property
    if (context.status === LeadStatus.QUALIFIED && context.propertyPrice) {
      return { action: 'schedule-viewing' };
    }

    // Follow-up logic based on last contact
    if (lastContactedAt) {
      const hoursSinceContact = (now - lastContactedAt) / (1000 * 60 * 60);
      
      if (hoursSinceContact < 12) {
        // Too soon, wait
        const hoursToWait = 24 - hoursSinceContact;
        return { 
          action: 'follow-up-days', 
          details: `Follow up in ${Math.ceil(hoursToWait / 24)} day(s)` 
        };
      } else if (hoursSinceContact < 48) {
        // Good time for follow-up
        if (context.phone) {
          return { action: 'call-now' };
        } else {
          return { action: 'send-email' };
        }
      } else if (hoursSinceContact < 168) {
        // Within a week
        return { 
          action: 'follow-up-days', 
          details: 'Follow up soon' 
        };
      } else {
        // Stale, needs re-engagement
        if (context.phone) {
          return { action: 'call-now' };
        } else {
          return { action: 'send-email' };
        }
      }
    }

    // New leads - contact immediately
    if (context.status === LeadStatus.NEW) {
      if (context.phone) {
        return { action: 'call-now' };
      } else if (context.email) {
        return { action: 'send-email' };
      }
    }

    // Default: follow-up
    return { 
      action: 'follow-up-days', 
      details: 'Follow up in 3 days' 
    };
  }

  /**
   * Calculate all AI metrics for a lead
   */
  calculateLeadAI(context: LeadContext): LeadAICalculation {
    const aiScore = this.calculateAIScore(context);
    const priority = this.calculatePriority(context, aiScore);
    const aiExplanation = this.generateAIExplanation(context, aiScore);
    const { action, details } = this.suggestNextAction(context, aiScore);

    return {
      aiScore,
      priority,
      aiExplanation,
      suggestedNextAction: action,
      actionDetails: details,
    };
  }
}
