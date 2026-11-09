import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChartsController } from './charts.controller';
import { ChartsSubscriptionService } from './charts-subscription.service';
@Module({imports:[AuthModule],controllers:[ChartsController],providers:[ChartsSubscriptionService]})
export class ChartsModule {}
