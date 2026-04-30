import { Injectable } from '@nestjs/common';
import { ConversationAssistEngineService } from '../conversation-assist/conversation-assist-engine.service';
import { SiteAssistLocale, SiteAssistState, SiteAssistTurnResponse } from './site-assist.types';

/**
 * Thin adapter: public site assist persists sessions/messages; funnel logic lives in
 * {@link ConversationAssistEngineService} (shared with CRM `POST integrations/ai/assist-turn`).
 */
@Injectable()
export class SiteAssistOrchestratorService {
  constructor(private readonly engine: ConversationAssistEngineService) {}

  welcomeResponse(sessionId: string, locale: SiteAssistLocale): SiteAssistTurnResponse {
    return this.engine.welcomeResponse(sessionId, locale);
  }

  processTurn(args: {
    sessionId: string;
    locale: SiteAssistLocale;
    state: SiteAssistState;
    message?: string;
    actionId?: string;
    priorMessages: { role: 'user' | 'assistant'; body: string }[];
  }): Promise<{ newState: SiteAssistState; response: SiteAssistTurnResponse }> {
    return this.engine.processTurn(args);
  }
}
