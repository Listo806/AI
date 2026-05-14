import { Module } from "@nestjs/common";
import { GoogleAdsController } from "./google-ads.controller";
import { GoogleAdsService } from "./google-ads.service";
import { DatabaseService } from "../../database/database.service";

@Module({
  controllers: [GoogleAdsController],
  providers: [
    GoogleAdsService,
    DatabaseService,
  ],
})
export class GoogleAdsModule {}