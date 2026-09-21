import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SetupController } from "./setup.controller";
import { SetupService } from "./setup.service";
@Module({ imports:[DatabaseModule,NotificationsModule], controllers:[SetupController], providers:[SetupService], exports:[SetupService] })
export class SetupModule {}
