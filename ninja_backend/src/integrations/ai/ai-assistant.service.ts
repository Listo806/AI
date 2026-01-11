import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestDto {
  messages: ChatMessage[];
  context?: {
    userId?: string;
    teamId?: string;
  };
}

export interface AnalyzeLeadDto {
  leadId: string;
  includeSuggestions?: boolean;
}

export interface SuggestPropertiesDto {
  criteria: {
    budget?: { min?: number; max?: number };
    location?: string;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: 'sale' | 'rent';
    preferences?: string; // Free-form text preferences
  };
  userId?: string;
  teamId?: string;
  limit?: number;
}

export interface PropertySuggestion {
  propertyId: string;
  title: string;
  price: number;
  location: string;
  matchScore: number;
  matchReasons: string[];
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly axiosInstance: AxiosInstance | null = null;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    this.provider = this.configService.get('AI_PROVIDER') || 'openai';
    this.model = this.configService.get('AI_MODEL') || 'gpt-4o-mini';

    if (this.provider === 'openai') {
      this.apiKey = this.configService.get('OPENAI_API_KEY') || '';
      this.baseUrl = 'https://api.openai.com/v1';
    } else if (this.provider === 'anthropic') {
      this.apiKey = this.configService.get('ANTHROPIC_API_KEY') || '';
      this.baseUrl = 'https://api.anthropic.com/v1';
    } else {
      this.apiKey = '';
      this.baseUrl = '';
    }

    if (this.apiKey && this.baseUrl) {
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          ...(this.provider === 'openai' 
            ? { 'Authorization': `Bearer ${this.apiKey}` }
            : { 'x-api-key': this.apiKey }),
          'Content-Type': 'application/json',
          ...(this.provider === 'anthropic' && {
            'anthropic-version': '2023-06-01',
          }),
        },
      });
      this.isConfigured = true;
      this.logger.log(`AI Assistant configured with provider: ${this.provider}`);
    } else {
      this.logger.warn(
        'AI Assistant not configured. ' +
        `Required: ${this.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'}`
      );
      this.isConfigured = false;
    }
  }

  /**
   * Chat with AI assistant
   */
  async chat(dto: ChatRequestDto): Promise<{ message: string; usage?: any }> {
    if (!this.isConfigured || !this.axiosInstance) {
      throw new BadRequestException('AI Assistant service is not configured');
    }

    try {
      if (this.provider === 'openai') {
        return await this.chatWithOpenAI(dto);
      } else if (this.provider === 'anthropic') {
        return await this.chatWithAnthropic(dto);
      } else {
        throw new BadRequestException(`Unsupported AI provider: ${this.provider}`);
      }
    } catch (error: any) {
      this.logger.error(`AI chat error: ${error.message}`, error.response?.data);
      throw new BadRequestException(
        error.response?.data?.error?.message || 'Failed to get AI response'
      );
    }
  }

  /**
   * Analyze a lead using AI
   */
  async analyzeLead(dto: AnalyzeLeadDto): Promise<{
    analysis: string;
    insights: {
      priority: 'high' | 'medium' | 'low';
      suggestedActions: string[];
      riskFactors?: string[];
    };
    propertySuggestions?: PropertySuggestion[];
  }> {
    if (!this.isConfigured || !this.axiosInstance) {
      throw new BadRequestException('AI Assistant service is not configured');
    }

    // Fetch lead data
    const { rows } = await this.db.query(
      `SELECT id, name, email, phone, status, notes, source, created_at, updated_at
       FROM leads WHERE id = $1`,
      [dto.leadId],
    );

    if (rows.length === 0) {
      throw new BadRequestException('Lead not found');
    }

    const lead = rows[0];

    // Build analysis prompt
    const prompt = `Analyze this real estate lead and provide insights:

Lead Information:
- Name: ${lead.name}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Status: ${lead.status}
- Source: ${lead.source || 'Unknown'}
- Notes: ${lead.notes || 'No notes'}
- Created: ${lead.created_at}
- Last Updated: ${lead.updated_at}

Please provide:
1. A brief analysis of the lead's potential
2. Priority level (high/medium/low)
3. Suggested next actions
4. Any risk factors to consider

Format your response as JSON with: analysis, priority, suggestedActions, riskFactors.`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a real estate lead analysis assistant. Provide structured, actionable insights.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await this.chat({ messages });
    
    // Parse AI response (try to extract JSON if possible)
    let insights;
    try {
      // Try to extract JSON from response
      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response from text
        insights = {
          priority: this.extractPriority(response.message),
          suggestedActions: this.extractActions(response.message),
          riskFactors: this.extractRisks(response.message),
        };
      }
    } catch (e) {
      // If parsing fails, create default structure
      insights = {
        priority: 'medium' as const,
        suggestedActions: ['Follow up with lead', 'Qualify lead requirements'],
        riskFactors: [],
      };
    }

    const result: any = {
      analysis: response.message,
      insights: {
        priority: insights.priority || 'medium',
        suggestedActions: insights.suggestedActions || [],
        riskFactors: insights.riskFactors || [],
      },
    };

    // Get property suggestions if requested
    if (dto.includeSuggestions) {
      // Extract criteria from lead notes/analysis
      const criteria = this.extractCriteriaFromLead(lead);
      const suggestions = await this.suggestProperties({
        criteria,
        limit: 5,
      });
      result.propertySuggestions = suggestions;
    }

    return result;
  }

  /**
   * Suggest properties based on criteria
   */
  async suggestProperties(dto: SuggestPropertiesDto): Promise<PropertySuggestion[]> {
    if (!this.isConfigured || !this.axiosInstance) {
      throw new BadRequestException('AI Assistant service is not configured');
    }

    // Build query to fetch properties
    let query = `
      SELECT id, title, description, address, city, state, zip_code, price, 
             type, bedrooms, bathrooms, square_feet, status
      FROM properties
      WHERE status = 'published'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (dto.criteria.propertyType) {
      query += ` AND type = $${paramIndex}`;
      params.push(dto.criteria.propertyType);
      paramIndex++;
    }

    if (dto.criteria.budget?.min) {
      query += ` AND price >= $${paramIndex}`;
      params.push(dto.criteria.budget.min);
      paramIndex++;
    }

    if (dto.criteria.budget?.max) {
      query += ` AND price <= $${paramIndex}`;
      params.push(dto.criteria.budget.max);
      paramIndex++;
    }

    if (dto.criteria.bedrooms) {
      query += ` AND bedrooms >= $${paramIndex}`;
      params.push(dto.criteria.bedrooms);
      paramIndex++;
    }

    if (dto.criteria.bathrooms) {
      query += ` AND bathrooms >= $${paramIndex}`;
      params.push(dto.criteria.bathrooms);
      paramIndex++;
    }

    // Team/user filtering
    if (dto.teamId) {
      query += ` AND team_id = $${paramIndex}`;
      params.push(dto.teamId);
      paramIndex++;
    } else if (dto.userId) {
      query += ` AND created_by = $${paramIndex}`;
      params.push(dto.userId);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(dto.limit || 20);

    const { rows } = await this.db.query(query, params);

    if (rows.length === 0) {
      return [];
    }

    // Use AI to score and rank properties
    const propertiesText = rows.map((p: any, index: number) => 
      `${index + 1}. ${p.title} - $${p.price} - ${p.city}, ${p.state} - ` +
      `${p.bedrooms}BR/${p.bathrooms}BA - ${p.square_feet} sqft`
    ).join('\n');

    const criteriaText = `
Budget: ${dto.criteria.budget?.min ? `$${dto.criteria.budget.min}` : 'Any'} - ${dto.criteria.budget?.max ? `$${dto.criteria.budget.max}` : 'Any'}
Location: ${dto.criteria.location || 'Any'}
Bedrooms: ${dto.criteria.bedrooms || 'Any'}
Bathrooms: ${dto.criteria.bathrooms || 'Any'}
Preferences: ${dto.criteria.preferences || 'None'}
`.trim();

    const prompt = `Given these properties and criteria, rank them by match quality (1-10) and explain why:

Properties:
${propertiesText}

Criteria:
${criteriaText}

For each property, provide: matchScore (1-10), matchReasons (array of strings).
Return as JSON array: [{"propertyIndex": 1, "matchScore": 8, "matchReasons": ["reason1", "reason2"]}, ...]`;

    try {
      const response = await this.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a real estate property matching assistant. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Parse AI response
      const jsonMatch = response.message.match(/\[[\s\S]*\]/);
      let scores: any[] = [];
      
      if (jsonMatch) {
        try {
          scores = JSON.parse(jsonMatch[0]);
        } catch (e) {
          this.logger.warn('Failed to parse AI scores, using default');
        }
      }

      // Combine properties with scores
      const suggestions: PropertySuggestion[] = rows.map((property: any, index: number) => {
        const score = scores.find((s: any) => s.propertyIndex === index + 1) || {
          matchScore: 5,
          matchReasons: ['Property matches basic criteria'],
        };

        return {
          propertyId: property.id,
          title: property.title,
          price: parseFloat(property.price) || 0,
          location: `${property.city || ''}, ${property.state || ''}`.trim() || property.address || 'Location TBD',
          matchScore: score.matchScore || 5,
          matchReasons: score.matchReasons || [],
        };
      });

      // Sort by match score
      return suggestions.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error: any) {
      this.logger.error('Error in AI property suggestion', error);
      // Fallback: return properties without AI scoring
      return rows.map((property: any) => ({
        propertyId: property.id,
        title: property.title,
        price: parseFloat(property.price) || 0,
        location: `${property.city || ''}, ${property.state || ''}`.trim() || property.address || 'Location TBD',
        matchScore: 5,
        matchReasons: ['Property matches basic criteria'],
      }));
    }
  }

  /**
   * Chat with OpenAI
   */
  private async chatWithOpenAI(dto: ChatRequestDto): Promise<{ message: string; usage?: any }> {
    if (!this.axiosInstance) throw new BadRequestException('AI service not configured');

    const response = await this.axiosInstance.post('/chat/completions', {
      model: this.model,
      messages: dto.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      message: response.data.choices[0]?.message?.content || 'No response',
      usage: response.data.usage,
    };
  }

  /**
   * Chat with Anthropic
   */
  private async chatWithAnthropic(dto: ChatRequestDto): Promise<{ message: string; usage?: any }> {
    if (!this.axiosInstance) throw new BadRequestException('AI service not configured');

    // Convert messages format for Anthropic
    const systemMessage = dto.messages.find((m) => m.role === 'system');
    const userMessages = dto.messages.filter((m) => m.role !== 'system');

    const response = await this.axiosInstance.post('/messages', {
      model: this.model,
      max_tokens: 1000,
      system: systemMessage?.content || 'You are a helpful assistant.',
      messages: userMessages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
    });

    return {
      message: response.data.content[0]?.text || 'No response',
      usage: response.data.usage,
    };
  }

  /**
   * Helper: Extract priority from text
   */
  private extractPriority(text: string): 'high' | 'medium' | 'low' {
    const lower = text.toLowerCase();
    if (lower.includes('high') || lower.includes('urgent') || lower.includes('priority')) {
      return 'high';
    }
    if (lower.includes('low') || lower.includes('minor')) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Helper: Extract actions from text
   */
  private extractActions(text: string): string[] {
    const actions: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.match(/^[-•*]\s*(.+)/) || line.match(/^\d+\.\s*(.+)/)) {
        actions.push(line.replace(/^[-•*\d.]\s*/, '').trim());
      }
    }
    
    return actions.length > 0 ? actions : ['Follow up with lead'];
  }

  /**
   * Helper: Extract risks from text
   */
  private extractRisks(text: string): string[] {
    const risks: string[] = [];
    const lower = text.toLowerCase();
    
    if (lower.includes('risk') || lower.includes('concern') || lower.includes('warning')) {
      const riskSection = text.match(/risk[s]?:?\s*(.+?)(?:\n\n|\n[A-Z]|$)/i);
      if (riskSection) {
        risks.push(riskSection[1].trim());
      }
    }
    
    return risks;
  }

  /**
   * Helper: Extract criteria from lead
   */
  private extractCriteriaFromLead(lead: any): SuggestPropertiesDto['criteria'] {
    const criteria: SuggestPropertiesDto['criteria'] = {};
    
    // Try to extract from notes
    if (lead.notes) {
      const notes = lead.notes.toLowerCase();
      
      // Budget
      const budgetMatch = notes.match(/\$?(\d{1,3}(?:,\d{3})*(?:k|k)?)/g);
      if (budgetMatch) {
        const amounts = budgetMatch.map((m) => {
          let num = m.replace(/[$,k]/g, '');
          if (m.includes('k')) num += '000';
          return parseInt(num);
        });
        criteria.budget = {
          max: Math.max(...amounts),
        };
      }
      
      // Bedrooms
      const bedMatch = notes.match(/(\d+)\s*(?:bed|br|bedroom)/i);
      if (bedMatch) {
        criteria.bedrooms = parseInt(bedMatch[1]);
      }
      
      // Location
      const locationMatch = notes.match(/(?:in|near|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (locationMatch) {
        criteria.location = locationMatch[1];
      }
    }
    
    return criteria;
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      isConfigured: this.isConfigured,
      provider: this.provider,
      model: this.model,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 4)}...` : 'not set',
    };
  }
}

