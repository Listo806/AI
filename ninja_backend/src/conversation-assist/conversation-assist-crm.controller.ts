import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { VaRestrictionGuard } from '../auth/guards/va-restriction.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiFeaturesGuard } from '../subscriptions/guards/ai-features.guard';
import { ConversationAssistEngineService } from './conversation-assist-engine.service';
import { ConversationAssistTurnDto } from './dto/conversation-assist-turn.dto';
import { SiteAssistState } from '../site-assist/site-assist.types';

@Controller('integrations/ai')
@UseGuards(JwtAuthGuard, VaRestrictionGuard, PaymentGuard)
export class ConversationAssistCrmController {
  constructor(private readonly engine: ConversationAssistEngineService) {}

  /**
   * Same marketplace funnel + listing context as public site assist, with client-held state
   * (no anonymous session DB). Use for in-app CRM assist or other authenticated surfaces.
   */
  @Post('assist-turn')
  @UseGuards(AiFeaturesGuard)
  async assistTurn(@Body() dto: ConversationAssistTurnDto, @CurrentUser() user: { id: string }) {
    const sessionId = dto.sessionId?.trim() || `crm:${user.id}`;
    const state = dto.state as unknown as SiteAssistState;
    const { newState, response } = await this.engine.processTurn({
      sessionId,
      locale: dto.locale,
      state,
      message: dto.message,
      actionId: dto.actionId,
      priorMessages: dto.priorMessages || [],
    });
    return {
      success: true,
      data: {
        state: newState,
        sessionId: response.sessionId,
        type: response.type,
        text: response.text,
        buttons: response.buttons,
        links: response.links,
      },
    };
  }
}
