import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
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
   * List saved reports (most recent first), scoped to the caller.
   */
  @Get()
  @ApiOperation({ summary: 'List saved analytics reports' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max reports to return (default 50, max 200)' })
  @ApiResponse({ status: 200, description: 'Saved reports' })
  async listReports(
    @CurrentUser() user: any,
    @Query('limit') limitStr?: string,
  ) {
    const parsed = limitStr ? parseInt(limitStr, 10) : 50;
    const limit = Number.isFinite(parsed) ? parsed : 50;
    return this.reportGeneratorService.listReports(
      user.teamId,
      user.id,
      user.role,
      limit,
    );
  }

  /**
   * Fetch one saved report by id.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a saved analytics report by id' })
  @ApiParam({ name: 'id', description: 'Report id' })
  @ApiResponse({ status: 200, description: 'Saved report' })
  @ApiResponse({ status: 403, description: 'Not your report' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReport(@CurrentUser() user: any, @Param('id') id: string) {
    return this.reportGeneratorService.getReportById(
      id,
      user.teamId,
      user.id,
      user.role,
    );
  }

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

