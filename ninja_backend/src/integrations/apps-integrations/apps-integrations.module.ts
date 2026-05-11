import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module";

import { AppsIntegrationsController } from "./apps-integrations.controller";
import { AppsIntegrationsService } from "./apps-integrations.service";

@Module({
  imports: [DatabaseModule],

  controllers: [AppsIntegrationsController],

  providers: [AppsIntegrationsService],

  exports: [AppsIntegrationsService],
})
export class AppsIntegrationsModule {}