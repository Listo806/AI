import { Module } from "@nestjs/common";

import { CsvLeadsController } from "./csv-leads.controller";
import { CsvLeadsService } from "./csv-leads.service";

@Module({
  controllers: [CsvLeadsController],
  providers: [CsvLeadsService],
  exports: [CsvLeadsService],
})
export class CsvLeadsModule {}