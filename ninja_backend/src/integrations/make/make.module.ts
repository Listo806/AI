import { Module } from "@nestjs/common";

import { MakeController } from "./make.controller";
import { MakeService } from "./make.service";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [MakeController],
  providers: [MakeService],
  exports: [MakeService],
})
export class MakeModule {}