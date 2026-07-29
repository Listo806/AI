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
import { PaymentGuard } from "../../auth/guards/payment.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { CrmImportService } from "./crm-import.service";

@Controller("integrations/crm-import")
@UseGuards(JwtAuthGuard, PaymentGuard)
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

    await this.crmImportService.saveParsedRows(importJob.id, rows);

    return {
      importId: importJob.id,

      totalRows: rows.length,

      columns: rows.length > 0 ? Object.keys(rows[0]) : [],

      sampleRows: rows.slice(0, 5),
    };
  }

  @Get(":importId/analyze")
  async analyze(
    @CurrentUser() user: any,

    @Param("importId")
    importId: string,
  ) {
    return this.crmImportService.analyzeImport(
      importId,
      this.requireTeam(user),
    );
  }

  @Post(":importId/mapping")
  async saveMapping(
    @CurrentUser() user: any,

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

      this.requireTeam(user),
    );
  }

  @Post(":importId/start")
  async startImport(
    @CurrentUser() user: any,

    @Param("importId")
    importId: string,
  ) {
    return this.crmImportService.startImport(
      importId,
      this.requireTeam(user),
    );
  }

  @Get(":importId/progress")
  async progress(
    @CurrentUser() user: any,

    @Param("importId")
    importId: string,
  ) {
    return this.crmImportService.getProgress(
      importId,
      this.requireTeam(user),
    );
  }

  @Get(":importId/logs")
  async logs(
    @CurrentUser() user: any,

    @Param("importId")
    importId: string,
  ) {
    return this.crmImportService.getLogs(
      importId,
      this.requireTeam(user),
    );
  }
}
