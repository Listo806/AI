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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VaRestrictionGuard } from '../../auth/guards/va-restriction.guard';
import { CrmAccessGuard } from '../../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('crm')
@ApiBearerAuth('JWT-auth')
@Controller('crm/contacts')
//@UseGuards(JwtAuthGuard, VaRestrictionGuard, CrmAccessGuard)
@UseGuards(JwtAuthGuard, VaRestrictionGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a contact' })
  @ApiBody({ type: CreateContactDto })
  @ApiResponse({ status: 201, description: 'Contact created' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async create(@Body() dto: CreateContactDto, @CurrentUser() user: any) {
    return this.contactsService.create(dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Get()
  @ApiOperation({ summary: 'List contacts (optional teamId for owners)' })
  @ApiQuery({ name: 'teamId', required: false, description: 'Filter by team' })
  @ApiResponse({ status: 200, description: 'Contacts list' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async findAll(@CurrentUser() user: any, @Query('teamId') teamId?: string) {
    return this.contactsService.findAll(user.id, user.teamId ?? null, user.role ?? 'owner', teamId || undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.findOne(id, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiBody({ type: UpdateContactDto })
  @ApiResponse({ status: 200, description: 'Contact updated' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.update(id, dto, user.id, user.teamId ?? null, user.role ?? 'owner');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact deleted' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.contactsService.remove(id, user.id, user.teamId ?? null, user.role ?? 'owner');
    return { success: true };
  }
}
