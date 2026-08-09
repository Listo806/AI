import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { EventLoggerService } from './events/event-logger.service';
import { ReportGeneratorService } from './reports/report-generator.service';
import { ReportsController } from './reports/reports.controller';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [DatabaseModule, PlansModule],
  controllers: [AnalyticsController, ReportsController],
  providers: [AnalyticsService, EventLoggerService, ReportGeneratorService, PaymentGuard],
  exports: [EventLoggerService, AnalyticsService, ReportGeneratorService],
})
export class AnalyticsModule {}
