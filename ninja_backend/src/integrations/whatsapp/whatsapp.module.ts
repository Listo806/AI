import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { ConfigModule } from '../../config/config.module';
import { AppsIntegrationsModule } from "../apps-integrations/apps-integrations.module";
import { PaymentGuard } from "../../auth/guards/payment.guard";

@Module({
  imports: [ConfigModule, AppsIntegrationsModule,],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, PaymentGuard],
  exports: [WhatsAppService],
  
})
export class WhatsAppModule {}

