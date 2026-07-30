import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../../auth/guards/payment.guard';
import { VaRestrictionGuard } from '../../auth/guards/va-restriction.guard';
import { CrmAccessGuard } from '../../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('crm')
@ApiBearerAuth('JWT-auth')
@Controller('crm/deals')
@UseGuards(JwtAuthGuard, VaRestrictionGuard, CrmAccessGuard, PaymentGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a deal (team from context or body; optional lead, assignee)' })
  @ApiBody({ type: CreateDealDto })
  @ApiResponse({ status: 201, description: 'Deal created' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async create(@Body() dto: CreateDealDto, @CurrentUser() user: any) {
    return this.dealsService.create(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get()
  @ApiOperation({ summary: 'List deals (optional teamId for owners; assignedTo=me for my deals)' })
  @ApiQuery({ name: 'teamId', required: false, description: 'Filter by team (owners with multiple teams)' })
  @ApiQuery({ name: 'assignedTo', required: false, description: 'Set to "me" to show only deals assigned to current user' })
  @ApiResponse({ status: 200, description: 'Deals list' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async findAll(
    @CurrentUser() user: any,
    @Query('teamId') teamId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    const assignedToMe = assignedTo === 'me';
    return this.dealsService.findAll(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      teamId || undefined,
      assignedToMe,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.dealsService.findOne(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiBody({ type: UpdateDealDto })
  @ApiResponse({ status: 200, description: 'Deal updated' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.update(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move deal to a stage (and optional position)' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiBody({ schema: { type: 'object', properties: { stage: { type: 'string' }, position: { type: 'number' } }, required: ['stage'] } })
  @ApiResponse({ status: 200, description: 'Deal updated' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async updateStage(
    @Param('id') id: string,
    @Body() body: { stage: string; position?: number },
    @CurrentUser() user: any,
  ) {
    return this.dealsService.updateStage(
      id,
      body.stage,
      body.position ?? 0,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deal' })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal deleted' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.dealsService.remove(id, user.id, user.teamId ?? null, user.role ?? 'owner');
    return { success: true };
  }
}
