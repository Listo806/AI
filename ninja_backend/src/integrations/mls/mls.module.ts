import { Module } from "@nestjs/common";

import { MlsController } from "./mls.controller";
import { MlsService } from "./mls.service";

import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],

  controllers: [MlsController],

  providers: [MlsService],

  exports: [MlsService],
})
export class MlsModule {}