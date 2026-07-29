import { Module } from "@nestjs/common";
import { PipelineController } from "./pipeline.controller";
import { PipelineService } from "./pipeline.service";
import { DatabaseModule } from "../database/database.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { PaymentGuard } from "../auth/guards/payment.guard";

@Module({
  imports: [DatabaseModule, SubscriptionsModule],
  controllers: [PipelineController],
  providers: [PipelineService, PaymentGuard],
  exports: [PipelineService],
})
export class PipelineModule {}