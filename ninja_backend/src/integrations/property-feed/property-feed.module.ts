import { Module } from "@nestjs/common";

import { PropertyFeedController } from "./property-feed.controller";
import { PropertyFeedService } from "./property-feed.service";
import { StorageModule } from "../storage/storage.module";
import { ListoqasaImportService } from "./listoqasa-import.service";

@Module({
  imports: [StorageModule],
  controllers: [PropertyFeedController],

  providers: [PropertyFeedService, ListoqasaImportService],

  exports: [PropertyFeedService],
})
export class PropertyFeedModule {
  constructor() {
    console.log(
      "PROPERTY FEED MODULE INIT",
    );
  }
}