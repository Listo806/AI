import { ListoqasaGoogleAdsController } from "./listoqasa-google-ads.controller";
import { ListoqasaGoogleAdsService } from "./listoqasa-google-ads.service";
import { Module } from "@nestjs/common";
import { GoogleAdsController } from "./google-ads.controller";
import { GoogleAdsService } from "./google-ads.service";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],

  controllers: [
    GoogleAdsController,
    ListoqasaGoogleAdsController,
  ],

  providers: [GoogleAdsService, ListoqasaGoogleAdsService],

  exports: [GoogleAdsService, ListoqasaGoogleAdsService],
})
export class GoogleAdsModule {}