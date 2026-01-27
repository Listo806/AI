import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { WhatsAppLeadService } from './services/whatsapp-lead.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateWhatsAppLeadDto } from './dto/create-whatsapp-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from './entities/lead.entity';
import { SubscriptionRequiredGuard } from '../subscriptions/guards/subscription-required.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly whatsappLeadService: WhatsAppLeadService,
  ) {}

  @Post('whatsapp')
  @ApiOperation({
    summary: 'Create lead from WhatsApp gate and get WhatsApp redirect URL (public, no auth required)',
    description: 'Creates a CRM lead before redirecting to WhatsApp. Required: phone (E.164), propertyId, source. Returns WhatsApp URL only after successful lead creation.',
  })
  @ApiBody({ type: CreateWhatsAppLeadDto })
  @ApiResponse({
    status: 200,
    description: 'Lead created successfully, WhatsApp URL returned',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            leadId: { type: 'string', format: 'uuid' },
            whatsappUrl: { type: 'string', example: 'https://wa.me/593987654321?text=...' },
            assignedTo: { type: 'string', enum: ['agent', 'owner', 'team', 'system'] },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone number or missing WhatsApp number',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string' },
      },
    },
  })
  async createWhatsAppLead(@Body() createWhatsAppLeadDto: CreateWhatsAppLeadDto) {
    // Service will throw BadRequestException or NotFoundException on errors
    // NestJS will handle these and return appropriate HTTP responses
    return await this.whatsappLeadService.createWhatsAppLead(createWhatsAppLeadDto);
  }

  @Post('public')
  @ApiOperation({ summary: 'Create a new lead from public contact form (no auth required)' })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async createPublic(@Body() createLeadDto: CreateLeadDto) {
    // For public leads, we don't have a user ID, so we'll use null
    // The service will handle this appropriately
    return this.leadsService.createPublic(createLeadDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Active subscription required' })
  async create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.create(createLeadDto, user.id, user.teamId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all leads (optionally filtered by status)' })
  @ApiQuery({ name: 'status', required: false, enum: LeadStatus, description: 'Filter leads by status' })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: any, @Query('status') status?: LeadStatus) {
    if (status) {
      return this.leadsService.findByStatus(status, user.id, user.teamId);
    }
    return this.leadsService.findAll(user.id, user.teamId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a lead by ID' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Lead retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({ type: UpdateLeadDto })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, updateLeadDto, user.id, user.teamId);
  }

  @Post(':id/contact')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Log a contact action (call, WhatsApp, or email)' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        actionType: { type: 'string', enum: ['call', 'whatsapp', 'email'] } 
      },
      required: ['actionType']
    } 
  })
  @ApiResponse({ status: 200, description: 'Contact action logged successfully' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async logContact(
    @Param('id') id: string,
    @Body() body: { actionType: 'call' | 'whatsapp' | 'email' },
    @CurrentUser() user: any,
  ) {
    return this.leadsService.logContactAction(id, body.actionType, user.id, user.teamId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Lead deleted successfully' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.leadsService.delete(id, user.id, user.teamId);
    return { message: 'Lead deleted successfully' };
  }
}

