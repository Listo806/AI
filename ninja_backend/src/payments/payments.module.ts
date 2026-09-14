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
import { DatabaseModule } from '../database/database.module';
import { WebSolutionsStripeCheckoutController } from './web-solutions-stripe-checkout.controller';
import { WebSolutionsStripeCheckoutService } from './web-solutions-stripe-checkout.service';

@Module({
  imports: [ConfigModule, PlatformMailModule, WorkspacesModule, AiUnitsModule, DatabaseModule],
  controllers: [PaddleController, PaymentsController, WebSolutionsStripeCheckoutController],
  providers: [PaddleService, PaymentsService, PayPalService, WebSolutionsStripeCheckoutService],
  exports: [PaddleService],
})
export class PaymentsModule {}
