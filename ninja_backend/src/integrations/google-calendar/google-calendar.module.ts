import { Module } from "@nestjs/common";
import { GoogleCalendarController } from "./google-calendar.controller";
import { GoogleCalendarService } from "./google-calendar.service";
import { DatabaseModule } from "../../database/database.module";
import { PaymentGuard } from "../../auth/guards/payment.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService, PaymentGuard],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}