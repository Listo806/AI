import { Module } from "@nestjs/common";

import { PropertyFeedController } from "./property-feed.controller";
import { PropertyFeedService } from "./property-feed.service";

@Module({
  controllers: [PropertyFeedController],

  providers: [PropertyFeedService],

  exports: [PropertyFeedService],
})
export class PropertyFeedModule {
  constructor() {
    console.log(
      "PROPERTY FEED MODULE INIT",
    );
  }
}