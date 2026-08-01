import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module";
import { GoogleCalendarModule } from "../integrations/google-calendar/google-calendar.module";
import { SendgridModule } from "../integrations/email/sendgrid.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { BookingEngineService } from "./booking-engine.service";
import { PaymentGuard } from "../auth/guards/payment.guard";

@Module({
  imports: [DatabaseModule, GoogleCalendarModule, SendgridModule, AnalyticsModule],
  controllers: [CalendarController],
  providers: [CalendarService, BookingEngineService, PaymentGuard],
  exports: [CalendarService, BookingEngineService],
})
export class CalendarModule {}
