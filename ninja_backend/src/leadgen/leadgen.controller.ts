import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeadgenService } from './leadgen.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceLockGuard } from '../workspaces/workspace-lock.guard';
import { RequiresWorkspace } from '../workspaces/requires-workspace.decorator';

@ApiTags('lead-generator')
@ApiBearerAuth('JWT-auth')
@Controller('leadgen')
@RequiresWorkspace('lead-generator')
@UseGuards(JwtAuthGuard, PaymentGuard, WorkspaceLockGuard)
export class LeadgenController {
  constructor(private readonly leadgen: LeadgenService) {}

  // ---- literal routes first ----

  @Get('context')
  @ApiOperation({ summary: 'Entitlement, connected sources, and capabilities' })
  getContext(@CurrentUser() user: any) {
    return this.leadgen.getContext(user);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Lead Generator KPIs computed from real records' })
  getOverview(@CurrentUser() user: any) {
    return this.leadgen.getOverview(user);
  }

  @Get('sources')
  @ApiOperation({ summary: 'Data source connectors and their connection status' })
  getSources() {
    return this.leadgen.getSources();
  }

  @Post('interpret')
  @ApiOperation({ summary: 'Interpret a natural-language prompt into search criteria' })
  interpret(@CurrentUser() user: any, @Body() body: any) {
    return this.leadgen.interpret(user, body);
  }

  // ---- saved searches (literal before :id collection routes) ----

  @Get('saved-searches')
  listSaved(@CurrentUser() user: any) {
    return this.leadgen.listSavedSearches(user);
  }

  @Post('saved-searches')
  createSaved(@CurrentUser() user: any, @Body() body: any) {
    return this.leadgen.createSavedSearch(user, body);
  }

  @Delete('saved-searches/:id')
  deleteSaved(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.leadgen.deleteSavedSearch(user, id);
  }

  // ---- leads import (literal segment before search :id block) ----

  @Post('leads/:id/import')
  @ApiOperation({ summary: 'Import a reviewed lead into the CRM (dedupe + suppression honored)' })
  importLead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.leadgen.importLead(user, id);
  }

  // ---- searches (collection + item; item routes stay last) ----

  @Get('searches')
  listSearches(@CurrentUser() user: any, @Query() query: any) {
    return this.leadgen.listSearches(user, query);
  }

  @Post('searches')
  @ApiOperation({ summary: 'Create and start a lead search job' })
  createSearch(@CurrentUser() user: any, @Body() body: any) {
    return this.leadgen.createSearch(user, body);
  }

  @Get('searches/:id')
  getSearch(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.leadgen.getSearch(user, id);
  }

  @Get('searches/:id/leads')
  listLeads(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    return this.leadgen.listLeads(user, id, query);
  }

  @Post('searches/:id/cancel')
  cancelSearch(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.leadgen.cancelSearch(user, id);
  }
}
