import { Module } from "@nestjs/common";
import { GoogleAdsController } from "./google-ads.controller";
import { GoogleAdsService } from "./google-ads.service";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],

  controllers: [
    GoogleAdsController,
  ],

  providers: [GoogleAdsService],

  exports: [GoogleAdsService],
})
export class GoogleAdsModule {}