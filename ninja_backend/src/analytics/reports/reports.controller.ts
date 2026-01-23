import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportGeneratorService } from './report-generator.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportGeneratorService: ReportGeneratorService) {}

  /**
   * Generate weekly report
   */
  @Post('weekly')
  @ApiOperation({ summary: 'Generate weekly analytics report' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601 format YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Weekly report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid date format' })
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
  @ApiOperation({ summary: 'Generate monthly analytics report' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601 format YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Monthly report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid date format' })
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

