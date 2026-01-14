import { Injectable } from '@nestjs/common';
import { LeadStatus } from './entities/lead.entity';

export type LeadPriority = 'HOT' | 'WARM' | 'COLD';
export type RecommendedAction = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'FOLLOW_UP';

export interface LeadAICalculation {
  aiScore: number; // 0-100
  aiTier: LeadPriority;
  aiScoreLabel: string;
  aiReasonBullets: string[];
  recommendedAction: RecommendedAction;
  recommendedActionReason: string;
}

export interface LeadContext {
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date | null;
  propertyPrice?: number | null;
  propertyType?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  engagementCount?: number | null;
}

@Injectable()
export class LeadAIService {
  /**
   * Calculate AI score (0-100) based on multiple factors
   * Base = 50, then adjust based on recency, contact freshness, reachability, engagement
   */
  calculateAIScore(context: LeadContext): number {
    let score = 50; // Base score

    const now = Date.now();
    const createdAt = new Date(context.createdAt).getTime();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    const lastContactedAt = context.lastContactedAt ? new Date(context.lastContactedAt).getTime() : null;
    const daysSinceLastContact = lastContactedAt ? (now - lastContactedAt) / (1000 * 60 * 60 * 24) : null;
    const hoursSinceLastContact = lastContactedAt ? (now - lastContactedAt) / (1000 * 60 * 60) : null;

    // Recency scoring
    if (daysSinceCreation <= 1) {
      score += 20; // Created within 24h
    } else if (daysSinceCreation <= 7) {
      score += 10; // Within 7 days
    } else if (daysSinceCreation <= 30) {
      score += 5; // Within 30 days
    } else {
      score -= 10; // Older than 30 days
    }

    // Contact freshness scoring
    if (lastContactedAt === null) {
      score += 10; // Uncontacted
    } else if (hoursSinceLastContact < 48) {
      score -= 10; // Contacted recently (within 48h)
    } else if (daysSinceLastContact > 7) {
      score += 5; // Last contact older than 7 days
      if (daysSinceLastContact > 14) {
        score += 5; // Last contact older than 14 days (additional +5)
      }
    }

    // Reachability scoring
    const hasPhone = !!(context.phone && context.phone.trim());
    const hasEmail = !!(context.email && context.email.trim());
    const hasWhatsapp = hasPhone && this.isWhatsAppSupported(context.phone);

    if (hasPhone) {
      score += 10;
    }
    if (hasEmail) {
      score += 5;
    }
    if (hasWhatsapp) {
      score += 10; // LATAM preference
    }

    // Engagement scoring (if available)
    if (context.engagementCount !== undefined && context.engagementCount !== null) {
      if (context.engagementCount > 3) {
        score += 10;
      } else if (context.engagementCount === 0) {
        score -= 10;
      }
    }

    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine tier (HOT/WARM/COLD) based on AI score
   */
  calculateTier(aiScore: number): LeadPriority {
    if (aiScore >= 80) {
      return 'HOT';
    } else if (aiScore >= 60) {
      return 'WARM';
    } else {
      return 'COLD';
    }
  }

  /**
   * Generate AI score label (interpretation)
   */
  generateScoreLabel(aiScore: number, aiTier: LeadPriority): string {
    if (aiTier === 'HOT') {
      return 'High intent — contact within 24h';
    } else if (aiTier === 'WARM') {
      return 'Medium intent — re-engagement suggested';
    } else {
      return 'Low intent — manual follow-up recommended';
    }
  }

  /**
   * Generate AI reason bullets (2-4 reasons)
   */
  generateReasonBullets(context: LeadContext, aiScore: number): string[] {
    const reasons: string[] = [];
    const now = Date.now();
    const createdAt = new Date(context.createdAt).getTime();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const lastContactedAt = context.lastContactedAt ? new Date(context.lastContactedAt).getTime() : null;
    const daysSinceLastContact = lastContactedAt ? Math.floor((now - lastContactedAt) / (1000 * 60 * 60 * 24)) : null;

    // Always include 1 recency reason
    if (daysSinceCreation === 0) {
      reasons.push('Created today');
    } else if (daysSinceCreation === 1) {
      reasons.push('Created 1 day ago');
    } else {
      reasons.push(`Created ${daysSinceCreation} days ago`);
    }

    // Always include 1 contact reason
    if (lastContactedAt === null) {
      reasons.push('No contact yet');
    } else if (daysSinceLastContact === 0) {
      reasons.push('Contacted today');
    } else if (daysSinceLastContact === 1) {
      reasons.push('Last contact 1 day ago');
    } else if (daysSinceLastContact >= 14) {
      reasons.push(`No contact in ${daysSinceLastContact}+ days`);
    } else {
      reasons.push(`Last contact ${daysSinceLastContact} days ago`);
    }

    // Include 1 channel reason
    const hasPhone = !!(context.phone && context.phone.trim());
    const hasEmail = !!(context.email && context.email.trim());
    const hasWhatsapp = hasPhone && this.isWhatsAppSupported(context.phone);

    if (hasWhatsapp) {
      reasons.push('WhatsApp available');
    } else if (hasPhone) {
      reasons.push('Phone number available');
    } else if (hasEmail) {
      reasons.push('Email only');
    }

    // Include 1 engagement reason if data exists
    if (context.engagementCount !== undefined && context.engagementCount !== null) {
      if (context.engagementCount > 3) {
        reasons.push('High engagement activity');
      } else if (context.engagementCount === 0) {
        reasons.push('No engagement recorded');
      } else {
        reasons.push(`${context.engagementCount} engagement(s)`);
      }
    }

    // Return 2-4 reasons (prioritize the most important)
    return reasons.slice(0, 4);
  }

  /**
   * Recommend next action based on lead context
   */
  recommendAction(context: LeadContext, lastContactedAt?: Date | null): { action: RecommendedAction; reason: string } {
    const hasPhone = !!(context.phone && context.phone.trim());
    const hasEmail = !!(context.email && context.email.trim());
    const hasWhatsapp = hasPhone && this.isWhatsAppSupported(context.phone);

    const now = Date.now();
    const lastContact = lastContactedAt ? new Date(lastContactedAt).getTime() : null;
    const hoursSinceLastContact = lastContact ? (now - lastContact) / (1000 * 60 * 60) : null;

    // Primary logic: Phone/WhatsApp if available and not recently contacted
    if (hasPhone && (lastContact === null || hoursSinceLastContact > 24)) {
      if (hasWhatsapp) {
        return {
          action: 'WHATSAPP',
          reason: 'WhatsApp contact has the highest response rate for this lead.',
        };
      } else {
        return {
          action: 'CALL',
          reason: 'Phone contact has the highest response rate for this lead.',
        };
      }
    }

    // Fallback to email
    if (hasEmail) {
      return {
        action: 'EMAIL',
        reason: 'Email is the best available contact method for this lead.',
      };
    }

    // Default: Follow-up
    return {
      action: 'FOLLOW_UP',
      reason: 'Schedule a follow-up when contact information becomes available.',
    };
  }

  /**
   * Check if phone number supports WhatsApp (simple check for common LATAM countries)
   * This is a simplified check - in production, use a proper phone number library
   */
  private isWhatsAppSupported(phone: string | null): boolean {
    if (!phone) return false;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check for common LATAM country codes (simplified)
    // In production, use a proper phone number parsing library like libphonenumber
    const latamCodes = ['52', '54', '55', '56', '57', '58', '51', '593', '595', '598', '506', '507', '505', '504', '503', '502', '501'];
    
    // Check if starts with + or country code
    if (phone.startsWith('+')) {
      const countryCode = digits.substring(0, 3);
      return latamCodes.some(code => countryCode.startsWith(code));
    }
    
    // Default: assume WhatsApp is available if phone exists (can be refined)
    return digits.length >= 10;
  }

  /**
   * Calculate all AI metrics for a lead
   */
  calculateLeadAI(context: LeadContext): LeadAICalculation {
    const aiScore = this.calculateAIScore(context);
    const aiTier = this.calculateTier(aiScore);
    const aiScoreLabel = this.generateScoreLabel(aiScore, aiTier);
    const aiReasonBullets = this.generateReasonBullets(context, aiScore);
    const { action, reason } = this.recommendAction(context, context.lastContactedAt);

    return {
      aiScore,
      aiTier,
      aiScoreLabel,
      aiReasonBullets,
      recommendedAction: action,
      recommendedActionReason: reason,
    };
  }
}
