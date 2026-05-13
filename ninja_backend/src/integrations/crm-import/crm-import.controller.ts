import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { CrmImportService } from "./crm-import.service";

@Controller("integrations/crm-import")
@UseGuards(JwtAuthGuard)
export class CrmImportController {
  constructor(private readonly crmImportService: CrmImportService) {}

  private requireTeam(user: any): string {
    if (!user?.teamId) {
      throw new ForbiddenException("User must belong to a team");
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
    const teamId = this.requireTeam(user);

    const importJob = await this.crmImportService.createImport({
      teamId,

      sourceType: "csv",

      fileName: file.originalname,
    });

    const rows = await this.crmImportService.parseCsv(file);

    await this.crmImportService.updateTotalRows(importJob.id, rows.length);

    return {
      importId: importJob.id,

      totalRows: rows.length,

      columns: rows.length > 0 ? Object.keys(rows[0]) : [],

      sampleRows: rows.slice(0, 5),
    };
  }

  @Get(":importId/analyze")
  async analyze(
    @Param("importId")
    importId: string,
  ) {
    return this.crmImportService.analyzeImport(importId);
  }

  @Post(":importId/mapping")
  async saveMapping(
    @Param("importId")
    importId: string,

    @Body()
    body: {
      mapping: any;
      duplicateStrategy: string;
    },
  ) {
    return this.crmImportService.saveMapping(
      importId,

      body.mapping,

      body.duplicateStrategy,
    );
  }

  @Post(":importId/start")
  async startImport(
    @Param("importId")
    importId: string,
  ) {
    return this.crmImportService.startImport(importId);
  }

  @Get(":importId/progress")
  async progress(
    @Param("importId")
    importId: string,
  ) {
    return this.crmImportService.getProgress(importId);
  }

  @Get(":importId/logs")
  async logs(
    @Param("importId")
    importId: string,
  ) {
    return this.crmImportService.getLogs(importId);
  }
}
