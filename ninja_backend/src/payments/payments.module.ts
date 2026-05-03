import { Module } from '@nestjs/common';
import { PaddleService } from './paddle.service';
import { PaddleController } from './paddle.controller';
import { ConfigModule } from '../config/config.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [ConfigModule],
  controllers: [PaddleController, PaymentsController],
  providers: [PaddleService, PaymentsService],
  exports: [PaddleService],
})
export class PaymentsModule {}
