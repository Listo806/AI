import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module";

import { AppointmentController } from "./appointment.controller";
import { AppointmentService } from "./appointment.service";

@Module({
  imports: [DatabaseModule],

  controllers: [AppointmentController],

  providers: [AppointmentService],

  exports: [AppointmentService],
})
export class AppointmentModule {}