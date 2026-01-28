import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ZapierService } from './zapier.service';
import { DatabaseService } from '../database/database.service';

@ApiTags('zapier')
@Controller('zapier')
export class ZapierController {
  constructor(
    private readonly zapierService: ZapierService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Authenticate and get team ID from API key
   */
  private async authenticateRequest(apiKey: string | undefined): Promise<string> {
    if (!apiKey) {
      throw new UnauthorizedException('Zapier API key is required');
    }

    const { teamId, isValid } = await this.zapierService.authenticate(apiKey);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Zapier API key');
    }

    return teamId;
  }

  // ============================================================================
  // TRIGGERS (Webhooks that Zapier can subscribe to)
  // ============================================================================

  @Get('triggers/new_lead_created')
  @ApiOperation({
    summary: 'Zapier trigger: New lead created',
    description: 'Poll with ?since=ISO8601 for leads created after since, or ?leadId=uuid for one lead.',
  })
  @ApiHeader({ name: 'X-Zapier-API-Key', description: 'Zapier API key for authentication' })
  @ApiQuery({ name: 'leadId', required: false, description: 'Fetch specific lead' })
  @ApiQuery({ name: 'since', required: false, description: 'ISO8601 timestamp; return leads created after' })
  @ApiResponse({ status: 200, description: 'Trigger payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNewLeadCreatedTrigger(
    @Headers('x-zapier-api-key') apiKey: string,
    @Query('leadId') leadId?: string,
    @Query('since') since?: string,
  ) {
    const teamId = await this.authenticateRequest(apiKey);
    return this.zapierService.triggerNewLeadCreated(teamId, leadId, since);
  }

  @Get('triggers/lead_status_updated')
  @ApiOperation({
    summary: 'Zapier trigger: Lead status updated',
    description: 'Poll with ?since=ISO8601 for leads updated after since, or ?leadId=uuid for one lead.',
  })
  @ApiHeader({ name: 'X-Zapier-API-Key', description: 'Zapier API key for authentication' })
  @ApiQuery({ name: 'leadId', required: false, description: 'Fetch specific lead' })
  @ApiQuery({ name: 'since', required: false, description: 'ISO8601 timestamp; return leads updated after' })
  @ApiResponse({ status: 200, description: 'Trigger payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLeadStatusUpdatedTrigger(
    @Headers('x-zapier-api-key') apiKey: string,
    @Query('leadId') leadId?: string,
    @Query('since') since?: string,
  ) {
    const teamId = await this.authenticateRequest(apiKey);
    return this.zapierService.triggerLeadStatusUpdated(teamId, leadId, since);
  }

  // ============================================================================
  // ACTIONS (Zapier can call these to perform actions)
  // ============================================================================

  @Post('actions/create_lead')
  @ApiOperation({
    summary: 'Zapier action: Create a new lead',
    description: 'Creates a new lead in the CRM. Same schema as POST /api/leads.',
  })
  @ApiHeader({ name: 'X-Zapier-API-Key', description: 'Zapier API key for authentication' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        phone: { type: 'string', example: '+593987654321' },
        status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'follow-up', 'closed-won', 'closed-lost'] },
        property_id: { type: 'string', format: 'uuid' },
        notes: { type: 'string' },
        source: { type: 'string' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 200, description: 'Lead created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async actionCreateLead(
    @Headers('x-zapier-api-key') apiKey: string,
    @Body() data: any,
  ) {
    const teamId = await this.authenticateRequest(apiKey);

    // Get team owner as created_by (or first team member)
    const teamOwner = await this.getTeamOwner(teamId);
    if (!teamOwner) {
      throw new BadRequestException('No team owner found for Zapier integration');
    }

    return await this.zapierService.actionCreateLead(data, teamId, teamOwner);
  }

  @Post('actions/update_lead')
  @ApiOperation({
    summary: 'Zapier action: Update a lead',
    description: 'Updates lead status, notes, or assigned agent.',
  })
  @ApiHeader({ name: 'X-Zapier-API-Key', description: 'Zapier API key for authentication' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', format: 'uuid', description: 'Lead ID to update' },
        status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'follow-up', 'closed-won', 'closed-lost'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        notes: { type: 'string' },
        assigned_to: { type: 'string', format: 'uuid' },
      },
      required: ['lead_id'],
    },
  })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async actionUpdateLead(
    @Headers('x-zapier-api-key') apiKey: string,
    @Body() data: any,
  ) {
    const teamId = await this.authenticateRequest(apiKey);

    if (!data.lead_id && !data.leadId) {
      throw new BadRequestException('lead_id is required');
    }

    const leadId = data.lead_id || data.leadId;

    // Get team owner as user
    const teamOwner = await this.getTeamOwner(teamId);
    if (!teamOwner) {
      throw new BadRequestException('No team owner found for Zapier integration');
    }

    return await this.zapierService.actionUpdateLead(leadId, data, teamId, teamOwner);
  }

  @Post('actions/create_task_followup')
  @ApiOperation({
    summary: 'Zapier action: Create a task/followup for a lead',
    description: 'Creates a task in the lead_tasks table.',
  })
  @ApiHeader({ name: 'X-Zapier-API-Key', description: 'Zapier API key for authentication' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', format: 'uuid', description: 'Lead ID' },
        title: { type: 'string', example: 'Follow-up call' },
        description: { type: 'string' },
        due_date: { type: 'string', format: 'date-time' },
        assigned_to: { type: 'string', format: 'uuid' },
      },
      required: ['lead_id'],
    },
  })
  @ApiResponse({ status: 200, description: 'Task created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async actionCreateTask(
    @Headers('x-zapier-api-key') apiKey: string,
    @Body() data: any,
  ) {
    const teamId = await this.authenticateRequest(apiKey);

    // Get team owner as created_by
    const teamOwner = await this.getTeamOwner(teamId);
    if (!teamOwner) {
      throw new BadRequestException('No team owner found for Zapier integration');
    }

    return await this.zapierService.actionCreateTask(data, teamId, teamOwner);
  }

  /**
   * Get team owner (for Zapier actions that need a user)
   */
  private async getTeamOwner(teamId: string): Promise<string | null> {
    const { rows } = await this.db.query(
      `SELECT u.id FROM users u
       INNER JOIN teams t ON u.id = t.owner_id
       WHERE t.id = $1
       LIMIT 1`,
      [teamId],
    );

    if (rows.length > 0) {
      return rows[0].id;
    }

    // Fallback: get first active user in team
    const { rows: fallbackRows } = await this.db.query(
      `SELECT id FROM users
       WHERE team_id = $1 AND is_active = true
       ORDER BY created_at ASC
       LIMIT 1`,
      [teamId],
    );

    return fallbackRows.length > 0 ? fallbackRows[0].id : null;
  }
}
