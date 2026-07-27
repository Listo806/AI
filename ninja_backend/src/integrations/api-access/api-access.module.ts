import {
  Module,
  MiddlewareConsumer,
  NestModule,
} from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module";

import { ApiAccessController } from "./api-access.controller";
import { ExternalApiController } from "./external-api.controller";
import { ApiAccessService } from "./api-access.service";
import { ApiAccessMiddleware } from "./api-access.middleware";

@Module({
  imports: [DatabaseModule],

  controllers: [ApiAccessController, ExternalApiController],

  providers: [ApiAccessService, ApiAccessMiddleware],

  exports: [ApiAccessService],
})
export class ApiAccessModule implements NestModule {
  // API keys authenticate the read-only external API (/api/external/*) through
  // ApiAccessMiddleware. Applying by controller keeps existing dashboard routes
  // untouched — they continue to use JwtAuthGuard.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiAccessMiddleware).forRoutes(ExternalApiController);
  }
}