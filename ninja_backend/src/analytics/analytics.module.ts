import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { EventLoggerService } from './events/event-logger.service';
import { ReportGeneratorService } from './reports/report-generator.service';
import { ReportsController } from './reports/reports.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController, ReportsController],
  providers: [AnalyticsService, EventLoggerService, ReportGeneratorService],
  exports: [EventLoggerService, AnalyticsService, ReportGeneratorService],
})
export class AnalyticsModule {}
