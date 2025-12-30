import { Module } from '@nestjs/common';
import { PaddleService } from './paddle.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [PaddleService],
  exports: [PaddleService],
})
export class PaymentsModule {}
