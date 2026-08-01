import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WhatsAppAiBookingService } from './whatsapp-ai-booking.service';

/**
 * Small authenticated surface for validating the AI booking conversation
 * without a live WhatsApp round-trip. Read-only: it never writes or sends.
 */
@Controller('ai-booking')
@UseGuards(JwtAuthGuard, PaymentGuard)
export class AiBookingController {
  constructor(private readonly booking: WhatsAppAiBookingService) {}

  private requireTeam(user: any): string {
    if (!user?.teamId) {
      throw new ForbiddenException('User must belong to a team');
    }
    return user.teamId;
  }

  // Given a lead phrase ("can I see it tomorrow at 3pm?"), returns the time the
  // AI would extract and the slot decision it would make against the team rules.
  @Post('preview')
  preview(@CurrentUser() user: any, @Body() body: { text?: string }) {
    return this.booking.previewExtraction(
      this.requireTeam(user),
      String(body?.text || ''),
    );
  }
}
