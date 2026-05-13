import { Module } from "@nestjs/common";

import { CrmImportController } from "./crm-import.controller";
import { CrmImportService } from "./crm-import.service";

@Module({
  controllers: [CrmImportController],
  providers: [CrmImportService],
  exports: [CrmImportService],
})
export class CrmImportModule {}