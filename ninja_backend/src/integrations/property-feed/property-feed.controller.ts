import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from "@nestjs/common";

import { FilesInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { PropertyFeedService } from "./property-feed.service";
import { ListoqasaImportService } from "./listoqasa-import.service";


@Controller("integrations/property-feed")
@UseGuards(JwtAuthGuard)
export class PropertyFeedController {
  constructor(
    private readonly propertyFeedService: PropertyFeedService,
    private readonly listoqasa: ListoqasaImportService,
  ) {}

  private requireTeam(user: any) {
    if (!user?.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  @Post("listoqasa-stage2/preview")
  preview(@Body() body:any) { return this.listoqasa.preview(body); }

  @Post("listoqasa-stage2/commit")
  commit(@Body() body:any, @CurrentUser() user:any) { return this.listoqasa.commit(body,user); }

  @Post("listoqasa-stage3/images/preview")
  imagesPreview(@Body() body:any) { return this.listoqasa.imagesPreview(body); }

  @Post("listoqasa-stage3/images/commit")
  imagesCommit(@Body() body:any,@CurrentUser() user:any) { return this.listoqasa.imagesCommit(body,user); }

  // Files must be individually cropped and named with their permanent external ID.
  // Max six per request to bound Render memory usage and make retries predictable.
  @Post("listoqasa-stage3/covers/upload")
  @UseInterceptors(FilesInterceptor('files', 6, { limits: { fileSize: 5 * 1024 * 1024, files: 6 } }))
  uploadCovers(@UploadedFiles() files: Express.Multer.File[], @CurrentUser() user:any) {
    return this.listoqasa.uploadCovers(files, user);
  }

  @Get("listoqasa-stage3/status")
  stage3Status(@CurrentUser() user:any) { return this.listoqasa.stage3Status(user); }

  @Post("listoqasa-stage3/publish")
  stage3Publish(@Body() body:any, @CurrentUser() user:any) { return this.listoqasa.publishSamples(body,user); }

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