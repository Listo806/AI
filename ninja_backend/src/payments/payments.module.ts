import { Module } from '@nestjs/common';
import { PaddleService } from './paddle.service';
import { PaddleController } from './paddle.controller';
import { ConfigModule } from '../config/config.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayPalService } from './paypal.service';
import { User } from '../users/entities/user.entity';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';

@Module({
  imports: [ConfigModule, PlatformMailModule],
  controllers: [PaddleController, PaymentsController],
  providers: [PaddleService, PaymentsService, PayPalService],
  exports: [PaddleService],
})
export class PaymentsModule {}
