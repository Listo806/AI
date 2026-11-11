import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChartsController } from './charts.controller';
import { ChartsAiService } from './charts-ai.service';
import { ChartsSubscriptionService } from './charts-subscription.service';
@Module({imports:[AuthModule],controllers:[ChartsController],providers:[ChartsSubscriptionService,ChartsAiService]})
export class ChartsModule {}
