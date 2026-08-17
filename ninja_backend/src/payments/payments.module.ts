import { Module } from '@nestjs/common';
import { PaddleService } from './paddle.service';
import { PaddleController } from './paddle.controller';
import { ConfigModule } from '../config/config.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayPalService } from './paypal.service';
import { User } from '../users/entities/user.entity';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AiUnitsModule } from '../ai-units/ai-units.module';

@Module({
  imports: [ConfigModule, PlatformMailModule, WorkspacesModule, AiUnitsModule],
  controllers: [PaddleController, PaymentsController],
  providers: [PaddleService, PaymentsService, PayPalService],
  exports: [PaddleService],
})
export class PaymentsModule {}
