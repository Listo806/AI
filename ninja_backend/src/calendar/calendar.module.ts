import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module";
import { GoogleCalendarModule } from "../integrations/google-calendar/google-calendar.module";
import { SendgridModule } from "../integrations/email/sendgrid.module";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";

@Module({
  imports: [DatabaseModule, GoogleCalendarModule, SendgridModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
