import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { PropertyFeedService } from "./property-feed.service";

@Controller(
  "integrations/property-feed",
)
@UseGuards(JwtAuthGuard)
export class PropertyFeedController {
  constructor(
    private readonly propertyFeedService: PropertyFeedService,
  ) {}

  private requireTeam(user: any) {
    if (!user?.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  @Get()
  async getFeeds(
    @CurrentUser() user: any,
  ) {
    return this.propertyFeedService.getFeeds(
      this.requireTeam(user),
    );
  }

  @Post()
  async createFeed(
    @CurrentUser() user: any,

    @Body()
    body: any,
  ) {
    return this.propertyFeedService.createFeed(
      this.requireTeam(user),
      body,
    );
  }

  @Post(":feedId/sync")
  async syncFeed(
    @CurrentUser() user: any,

    @Param("feedId")
    feedId: string,
  ) {
    return this.propertyFeedService.syncFeed(
      this.requireTeam(user),
      feedId,
    );
  }

  @Post(":feedId/toggle-sync")
  async toggleSync(
    @CurrentUser() user: any,

    @Param("feedId")
    feedId: string,

    @Body()
    body: {
      enabled: boolean;
    },
  ) {
    return this.propertyFeedService.toggleSync(
      this.requireTeam(user),
      feedId,
      body.enabled,
    );
  }

  @Delete(":feedId")
  async deleteFeed(
    @CurrentUser() user: any,

    @Param("feedId")
    feedId: string,
  ) {
    return this.propertyFeedService.deleteFeed(
      this.requireTeam(user),
      feedId,
    );
  }
}