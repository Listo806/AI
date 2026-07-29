import { Module } from "@nestjs/common";

import { CsvLeadsController } from "./csv-leads.controller";
import { CsvLeadsService } from "./csv-leads.service";
import { PaymentGuard } from "../../auth/guards/payment.guard";

@Module({
  controllers: [CsvLeadsController],
  providers: [CsvLeadsService, PaymentGuard],
  exports: [CsvLeadsService],
})
export class CsvLeadsModule {}