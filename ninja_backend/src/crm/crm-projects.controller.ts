import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CrmProjectsService } from './crm-projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaRestrictionGuard } from '../auth/guards/va-restriction.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';

@ApiTags('crm')
@ApiBearerAuth('JWT-auth')
@Controller('crm/projects')
@UseGuards(JwtAuthGuard, VaRestrictionGuard, CrmAccessGuard)
export class CrmProjectsController {
  constructor(private readonly service: CrmProjectsService) {}

  @Get(':id/progress')
  @ApiOperation({ summary: 'Project progress (total units, sold units, sold_percent)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Progress: total_units, sold_units, sold_percent' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async progress(@Param('id') projectId: string, @CurrentUser() user: any) {
    return this.service.projectProgress(projectId, user.id, user.teamId ?? null);
  }
}
