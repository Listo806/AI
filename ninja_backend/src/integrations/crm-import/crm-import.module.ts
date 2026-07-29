import { Module } from "@nestjs/common";

import { CrmImportController } from "./crm-import.controller";
import { CrmImportService } from "./crm-import.service";
import { PaymentGuard } from "../../auth/guards/payment.guard";

@Module({
  controllers: [CrmImportController],
  providers: [CrmImportService, PaymentGuard],
  exports: [CrmImportService],
})
export class CrmImportModule {}