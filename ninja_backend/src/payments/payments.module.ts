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
import { WebSolutionsPaymentService } from './web-solutions-payment.service';
import { WebSolutionsPaymentController } from './web-solutions-payment.controller';
import { DatabaseModule } from '../database/database.module';
import { WebSolutionsReviewController } from './web-solutions-review.controller';
import { WebSolutionsReviewService } from './web-solutions-review.service';

@Module({
  imports: [ConfigModule, PlatformMailModule, WorkspacesModule, AiUnitsModule, DatabaseModule],
  controllers: [PaddleController, PaymentsController, WebSolutionsPaymentController, WebSolutionsReviewController],
  providers: [PaddleService, PaymentsService, PayPalService, WebSolutionsPaymentService, WebSolutionsReviewService],
  exports: [PaddleService],
})
export class PaymentsModule {}
