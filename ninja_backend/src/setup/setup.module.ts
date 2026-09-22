import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SetupController } from "./setup.controller";
import { SetupService } from "./setup.service";
import { AiCenterModule } from "../ai-center/ai-center.module";
import { LeadsModule } from "../leads/leads.module";
import { PipelineModule } from "../pipeline/pipeline.module";
@Module({ imports:[DatabaseModule,NotificationsModule,AiCenterModule,LeadsModule,PipelineModule], controllers:[SetupController], providers:[SetupService], exports:[SetupService] })
export class SetupModule {}
