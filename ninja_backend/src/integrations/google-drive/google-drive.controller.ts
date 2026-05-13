import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  ForbiddenException,
  Res,
  Query,
  UploadedFile,
  UseInterceptors,
  Param,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

import { GoogleDriveService } from "./google-drive.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("integrations/google-drive")
@UseGuards(JwtAuthGuard)
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  private requireTeam(user: any): string {
    if (!user.teamId) {
      throw new ForbiddenException("User must belong to a team");
    }

    return user.teamId;
  }

  @Get("config/status")
  async getStatus(@CurrentUser() user: any) {
    return this.googleDriveService.getStatus(this.requireTeam(user));
  }

  @Delete("disconnect")
  async disconnect(@CurrentUser() user: any) {
    return this.googleDriveService.disconnect(this.requireTeam(user));
  }

  @Get("connect")
  async connect(@CurrentUser() user: any) {
    return this.googleDriveService.getAuthUrl(this.requireTeam(user));
  }

  @Get("callback")
  async callback(
    @Query("code") code: string,
    @Query("state") teamId: string,
    @Res() res: Response,
  ) {
    await this.googleDriveService.handleCallback(code, teamId);

    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard/integrations/google-drive?connected=true`,
    );
  }

  @Post("upload/:folderId")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @CurrentUser() user: any,

    @Param("folderId")
    folderId: string,

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.googleDriveService.uploadFile(
      this.requireTeam(user),
      folderId,
      file,
    );
  }

  @Get("folders")
  async listFolders(@CurrentUser() user: any) {
    return this.googleDriveService.listFolders(this.requireTeam(user));
  }

  @Post("select-folder")
  async selectFolder(
    @CurrentUser() user: any,
    @Body()
    body: {
      folderId: string;
      folderName: string;
    },
  ) {
    return this.googleDriveService.saveSelectedFolder(
      this.requireTeam(user),
      body.folderId,
      body.folderName,
    );
  }

  @Post("toggle-sync")
  async toggleSync(
    @CurrentUser() user: any,
    @Body()
    body: {
      enabled: boolean;
    },
  ) {
    return this.googleDriveService.toggleSync(
      this.requireTeam(user),
      body.enabled,
    );
  }
}
