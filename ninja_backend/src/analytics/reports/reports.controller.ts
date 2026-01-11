import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReportGeneratorService } from './report-generator.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('analytics/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportGeneratorService: ReportGeneratorService) {}

  /**
   * Generate weekly report
   */
  @Post('weekly')
  async generateWeeklyReport(
    @CurrentUser() user: any,
    @Query('startDate') startDateStr?: string,
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : undefined;

    if (startDate && isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    return this.reportGeneratorService.generateWeeklyReport(
      user.teamId,
      user.id,
      user.role,
      startDate,
    );
  }

  /**
   * Generate monthly report
   */
  @Post('monthly')
  async generateMonthlyReport(
    @CurrentUser() user: any,
    @Query('startDate') startDateStr?: string,
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : undefined;

    if (startDate && isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    return this.reportGeneratorService.generateMonthlyReport(
      user.teamId,
      user.id,
      user.role,
      startDate,
    );
  }
}

