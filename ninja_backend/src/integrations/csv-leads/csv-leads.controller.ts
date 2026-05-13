import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { CsvLeadsService } from "./csv-leads.service";

@Controller("imports/csv-leads")
@UseGuards(JwtAuthGuard)
export class CsvLeadsController {
  constructor(
    private readonly csvLeadsService: CsvLeadsService,
  ) {}

  private requireTeam(user: any) {
    if (!user?.teamId) {
      throw new ForbiddenException(
        "User must belong to a team",
      );
    }

    return user.teamId;
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @CurrentUser() user: any,

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    const teamId =
      this.requireTeam(user);

    const importJob =
      await this.csvLeadsService.createImport(
        teamId,
        file.originalname,
      );

    const rows =
      await this.csvLeadsService.parseCsv(
        file,
      );

    return {
      importId: importJob.id,
      rows,
      columns:
        rows.length > 0
          ? Object.keys(rows[0])
          : [],
      preview: rows.slice(0, 10),
    };
  }

  @Post("mapping")
  async saveMapping(
    @Body()
    body: {
      importId: string;
      mapping: any;
    },
  ) {
    return this.csvLeadsService.saveMapping(
      body.importId,
      body.mapping,
    );
  }

  @Post("start")
  async startImport(
    @CurrentUser() user: any,

    @Body()
    body: {
      importId: string;
      rows: any[];
      mapping: any;
    },
  ) {
    return this.csvLeadsService.startImport(
      body.importId,
      body.rows,
      body.mapping,
      this.requireTeam(user),
    );
  }
}