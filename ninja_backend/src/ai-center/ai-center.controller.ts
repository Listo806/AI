import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AiCenterService } from './ai-center.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { AiCenterAccessGuard } from './guards/ai-center-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('ai-center')
@ApiBearerAuth('JWT-auth')
@Controller('ai-center')
//@UseGuards(JwtAuthGuard, CrmAccessGuard, AiCenterAccessGuard)
@UseGuards(JwtAuthGuard, CrmAccessGuard)
export class AiCenterController {
  constructor(private readonly service: AiCenterService) {}

  @Get('overview')
  @ApiOperation({ summary: 'AI Center overview (status, channels, recent actions)' })
  @ApiResponse({ status: 200, description: 'Overview' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async overview(@CurrentUser() user: any) {
    return this.service.getOverview(user.teamId);
  }

  @Get('auto-reply')
  @ApiOperation({ summary: 'Get AI Auto-Reply settings' })
  @ApiResponse({ status: 200, description: 'enabled, tone' })
  async getAutoReply(@CurrentUser() user: any) {
    return this.service.getAutoReply(user.teamId);
  }

  @Put('auto-reply')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update AI Auto-Reply (enabled, tone)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        tone: { type: 'string', enum: ['professional', 'friendly', 'sales'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Updated settings' })
  @ApiResponse({ status: 403, description: 'Edit requires Admin or Owner' })
  async setAutoReply(@CurrentUser() user: any, @Body() body: { enabled?: boolean; tone?: string }) {
    return this.service.setAutoReply(user.teamId, body);
  }

  @Post('appointment-setter/enable')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Enable AI Setter' })
  @ApiResponse({ status: 200, description: 'Enabled' })
  @ApiResponse({ status: 403, description: 'Edit requires Admin or Owner' })
  async enableAppointmentSetter(@CurrentUser() user: any) {
    return this.service.enableAppointmentSetter(user.teamId);
  }

  @Post('appointment-setter/disable')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Disable AI Setter' })
  @ApiResponse({ status: 200, description: 'Disabled' })
  @ApiResponse({ status: 403, description: 'Edit requires Admin or Owner' })
  async disableAppointmentSetter(@CurrentUser() user: any) {
    return this.service.disableAppointmentSetter(user.teamId);
  }

  @Get('appointment-setter/status')
  @ApiOperation({ summary: 'AI Setter status and metrics' })
  @ApiResponse({ status: 200, description: 'enabled, metrics, channels, calendars' })
  async getAppointmentSetterStatus(@CurrentUser() user: any) {
    return this.service.getAppointmentSetterStatus(user.teamId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'AI activity log (paginated by limit)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of actions' })
  async getActivity(
    @CurrentUser() user: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.service.getActivity(user.teamId, safeLimit);
  }

  @Get('qualification-rules')
  @ApiOperation({ summary: 'Active qualification ruleset (Phase 1: name + updated_at)' })
  @ApiResponse({ status: 200, description: 'name, updated_at' })
  async getQualificationRules(@CurrentUser() user: any) {
    return this.service.getQualificationRules(user.teamId);
  }

  @Post('agent')
  @ApiOperation({ summary: 'CORTEXA AI Agent Chat' })
  @ApiResponse({ status: 200, description: 'AI response' })
  async cortexaAgent(
    @CurrentUser() user: any,
    @Body()
    body: {
      message: string;
      conversationId?: string;
      workspaceId?: string;
    },
  ) {
    return this.service.cortexaAgent({
      user,
      body,
    });
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 10),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    return this.service.uploadFiles({
      files,
      user,
    });
  }

}
