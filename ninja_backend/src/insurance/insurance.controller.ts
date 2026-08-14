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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { InsuranceService } from './insurance.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';
import { CreateInsuranceClaimDto } from './dto/create-insurance-claim.dto';
import { UpdateInsuranceClaimDto } from './dto/update-insurance-claim.dto';
import { CreateInsuranceQuoteDto } from './dto/create-insurance-quote.dto';
import { UpdateInsuranceQuoteDto } from './dto/update-insurance-quote.dto';
import { CreateInsuranceRenewalDto } from './dto/create-insurance-renewal.dto';
import { UpdateInsuranceRenewalDto } from './dto/update-insurance-renewal.dto';
import { CreateInsuranceCarrierDto } from './dto/create-insurance-carrier.dto';
import { UpdateInsuranceCarrierDto } from './dto/update-insurance-carrier.dto';
import { CreateInsuranceCommissionDto } from './dto/create-insurance-commission.dto';
import { UpdateInsuranceCommissionDto } from './dto/update-insurance-commission.dto';

// Insurance Workspace API. Guards mirror the CRM: JwtAuthGuard authenticates,
// PaymentGuard gates unpaid accounts (super_admin/admin/va are exempt). All
// data access is team-scoped inside the service.
@ApiTags('insurance')
@ApiBearerAuth('JWT-auth')
@Controller('insurance')
@UseGuards(JwtAuthGuard, PaymentGuard)
export class InsuranceController {
  constructor(private readonly insurance: InsuranceService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard KPIs, breakdowns, upcoming renewals, activity' })
  async stats(@CurrentUser() user: any) {
    return this.insurance.getStats(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('reports')
  @ApiOperation({
    summary: 'Analytics: premium by type, claims/loss, commissions, renewals, new business',
  })
  async reports(@CurrentUser() user: any) {
    return this.insurance.getReports(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('contacts')
  @ApiOperation({
    summary: "Search the account's existing contacts to link to a policy",
  })
  async searchContacts(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.insurance.searchContacts(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      search,
    );
  }

  @Get('policies')
  @ApiOperation({ summary: 'List policies for the caller\'s account (paginated, filterable)' })
  async listPolicies(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('policyType') policyType?: string,
    @Query('carrierId') carrierId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.insurance.findAllPolicies(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, policyType, carrierId, page, limit },
    );
  }

  @Post('policies')
  @ApiOperation({ summary: 'Create a policy in the caller\'s account' })
  async createPolicy(
    @Body() dto: CreateInsurancePolicyDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.createPolicy(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('policies/:id')
  @ApiOperation({ summary: 'Get one policy (team-scoped)' })
  async getPolicy(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.findOnePolicy(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('policies/:id')
  @ApiOperation({ summary: 'Update a policy (team-scoped)' })
  async updatePolicy(
    @Param('id') id: string,
    @Body() dto: UpdateInsurancePolicyDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.updatePolicy(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('policies/:id')
  @ApiOperation({ summary: 'Delete a policy (team-scoped)' })
  async removePolicy(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.removePolicy(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Claims ────────────────────────────────────────────────────────────────

  @Get('claims')
  @ApiOperation({ summary: 'List claims for the account (paginated, filterable)' })
  async listClaims(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('policyId') policyId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.insurance.findAllClaims(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, policyId, page, limit },
    );
  }

  @Post('claims')
  @ApiOperation({ summary: 'Create a claim (must link to a policy)' })
  async createClaim(
    @Body() dto: CreateInsuranceClaimDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.createClaim(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('claims/:id')
  @ApiOperation({ summary: 'Get one claim (team-scoped)' })
  async getClaim(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.findOneClaim(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('claims/:id')
  @ApiOperation({ summary: 'Update a claim (team-scoped)' })
  async updateClaim(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceClaimDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.updateClaim(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('claims/:id')
  @ApiOperation({ summary: 'Delete a claim (team-scoped)' })
  async removeClaim(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.removeClaim(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Quotes ────────────────────────────────────────────────────────────────

  @Get('quotes')
  @ApiOperation({ summary: 'List quotes for the account (paginated, filterable)' })
  async listQuotes(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.insurance.findAllQuotes(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('quotes')
  @ApiOperation({ summary: 'Create a quote' })
  async createQuote(
    @Body() dto: CreateInsuranceQuoteDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.createQuote(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('quotes/:id')
  @ApiOperation({ summary: 'Get one quote (team-scoped)' })
  async getQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.findOneQuote(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('quotes/:id')
  @ApiOperation({ summary: 'Update a quote (team-scoped)' })
  async updateQuote(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceQuoteDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.updateQuote(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Post('quotes/:id/convert')
  @ApiOperation({ summary: 'Convert an accepted quote into a policy' })
  async convertQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.convertQuoteToPolicy(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('quotes/:id')
  @ApiOperation({ summary: 'Delete a quote (team-scoped)' })
  async removeQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.removeQuote(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Renewals ──────────────────────────────────────────────────────────────

  @Get('renewals')
  @ApiOperation({ summary: 'List renewals for the account (paginated, filterable)' })
  async listRenewals(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.insurance.findAllRenewals(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('renewals')
  @ApiOperation({ summary: 'Create a renewal (must link to a policy)' })
  async createRenewal(
    @Body() dto: CreateInsuranceRenewalDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.createRenewal(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('renewals/:id')
  @ApiOperation({ summary: 'Get one renewal (team-scoped)' })
  async getRenewal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.findOneRenewal(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('renewals/:id')
  @ApiOperation({ summary: 'Update a renewal (team-scoped)' })
  async updateRenewal(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceRenewalDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.updateRenewal(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Post('renewals/:id/renew')
  @ApiOperation({ summary: 'Create the renewed policy term from a renewal' })
  async renewPolicy(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.renewPolicy(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('renewals/:id')
  @ApiOperation({ summary: 'Delete a renewal (team-scoped)' })
  async removeRenewal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.removeRenewal(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Carriers ──────────────────────────────────────────────────────────────

  @Get('carriers/search')
  @ApiOperation({ summary: 'Search carriers to link (typeahead)' })
  async searchCarriers(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.insurance.searchCarriers(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      search,
    );
  }

  @Get('carriers')
  @ApiOperation({ summary: 'List carriers (paginated)' })
  async listCarriers(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.insurance.findAllCarriers(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, page, limit },
    );
  }

  @Post('carriers')
  @ApiOperation({ summary: 'Add a carrier' })
  async createCarrier(
    @Body() dto: CreateInsuranceCarrierDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.createCarrier(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('carriers/:id')
  @ApiOperation({ summary: 'Get one carrier (team-scoped)' })
  async getCarrier(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.findOneCarrier(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('carriers/:id')
  @ApiOperation({ summary: 'Update a carrier (team-scoped)' })
  async updateCarrier(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceCarrierDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.updateCarrier(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('carriers/:id')
  @ApiOperation({ summary: 'Delete a carrier (team-scoped)' })
  async removeCarrier(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.removeCarrier(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  // ─── Commissions ───────────────────────────────────────────────────────────

  @Get('commissions')
  @ApiOperation({ summary: 'List commissions (paginated, filterable)' })
  async listCommissions(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.insurance.findAllCommissions(
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
      { search, status, page, limit },
    );
  }

  @Post('commissions')
  @ApiOperation({ summary: 'Create a commission (must link to a policy)' })
  async createCommission(
    @Body() dto: CreateInsuranceCommissionDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.createCommission(
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Get('commissions/:id')
  @ApiOperation({ summary: 'Get one commission (team-scoped)' })
  async getCommission(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.findOneCommission(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Put('commissions/:id')
  @ApiOperation({ summary: 'Update a commission (team-scoped)' })
  async updateCommission(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceCommissionDto,
    @CurrentUser() user: any,
  ) {
    return this.insurance.updateCommission(
      id,
      dto,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }

  @Delete('commissions/:id')
  @ApiOperation({ summary: 'Delete a commission (team-scoped)' })
  async removeCommission(@Param('id') id: string, @CurrentUser() user: any) {
    return this.insurance.removeCommission(
      id,
      user.id,
      user.teamId ?? null,
      user.role ?? 'owner',
    );
  }
}
