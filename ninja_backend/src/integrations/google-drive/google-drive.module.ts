import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module";

import { GoogleDriveController } from "./google-drive.controller";
import { GoogleDriveService } from "./google-drive.service";

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [
    GoogleDriveController,
  ],
  providers: [
    GoogleDriveService,
  ],
  exports: [
    GoogleDriveService,
  ],
})
export class GoogleDriveModule {}