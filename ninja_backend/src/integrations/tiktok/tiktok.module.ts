import { Module } from "@nestjs/common";

import { TiktokController } from "./tiktok.controller";
import { TiktokService } from "./tiktok.service";

import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],

  controllers: [TiktokController],

  providers: [TiktokService],

  exports: [TiktokService],
})
export class TiktokModule {}