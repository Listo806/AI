import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AiAssistantModule } from '../integrations/ai/ai-assistant.module';
import { WhatsAppQrController } from './whatsapp-qr.controller';
import { WhatsAppQrSessionService } from './whatsapp-qr-session.service';
import { BaileysSocketService } from './baileys-socket.service';
import { BaileysRedisAuthService } from './baileys-redis-auth.service';
import { OutboundThrottleService } from './outbound-throttle.service';
import { WhatsAppQrConversationService } from './whatsapp-qr-conversation.service';
import { WhatsAppQrMessageService } from './whatsapp-qr-message.service';
import { WhatsAppQrIntentService } from './whatsapp-qr-intent.service';
import { WhatsAppQrRoutingService } from './whatsapp-qr-routing.service';
import { WhatsAppQrInboundService } from './whatsapp-qr-inbound.service';
import { WhatsAppQrOutboundService } from './whatsapp-qr-outbound.service';
import { WhatsAppQrAiReplyService } from './whatsapp-qr-ai-reply.service';
import { WhatsAppQrFlowOrchestratorService } from './whatsapp-qr-flow-orchestrator.service';
import { WhatsAppQrGateway } from './whatsapp-qr.gateway';
import { WhatsAppQrRealtimeService } from './whatsapp-qr-realtime.service';
import { CrmModule } from '../crm/crm.module';
import { AiCenterModule } from "../ai-center/ai-center.module";
import { PaymentGuard } from "../auth/guards/payment.guard";

@Module({
  imports: [ConfigModule, DatabaseModule, SubscriptionsModule, AiAssistantModule, CrmModule, AiCenterModule],
  controllers: [WhatsAppQrController],
  providers: [
    PaymentGuard,
    WhatsAppQrRealtimeService,
    WhatsAppQrGateway,
    WhatsAppQrSessionService,
    BaileysSocketService,
    BaileysRedisAuthService,
    OutboundThrottleService,
    WhatsAppQrConversationService,
    WhatsAppQrMessageService,
    WhatsAppQrIntentService,
    WhatsAppQrRoutingService,
    WhatsAppQrInboundService,
    WhatsAppQrOutboundService,
    WhatsAppQrAiReplyService,
    WhatsAppQrFlowOrchestratorService,
  ],
  exports: [WhatsAppQrSessionService, BaileysSocketService],
})
export class WhatsAppQrModule {}
