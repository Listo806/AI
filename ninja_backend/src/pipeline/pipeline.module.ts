import { Module } from "@nestjs/common";
import { PipelineController } from "./pipeline.controller";
import { PipelineService } from "./pipeline.service";
import { DatabaseModule } from "../database/database.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";

@Module({
  imports: [DatabaseModule, SubscriptionsModule],
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}