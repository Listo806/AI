import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module";

import { ApiAccessController } from "./api-access.controller";
import { ApiAccessService } from "./api-access.service";

@Module({
  imports: [DatabaseModule],

  controllers: [ApiAccessController],

  providers: [ApiAccessService],

  exports: [ApiAccessService],
})
export class ApiAccessModule {}