import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module";
import { GoogleCalendarModule } from "../integrations/google-calendar/google-calendar.module";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";

@Module({
  imports: [DatabaseModule, GoogleCalendarModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
