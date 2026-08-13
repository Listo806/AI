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

// Insurance Workspace API. Guards mirror the CRM: JwtAuthGuard authenticates,
// PaymentGuard gates unpaid accounts (super_admin/admin/va are exempt). All
// data access is team-scoped inside the service.
@ApiTags('insurance')
@ApiBearerAuth('JWT-auth')
@Controller('insurance')
@UseGuards(JwtAuthGuard, PaymentGuard)
export class InsuranceController {
  constructor(private readonly insurance: InsuranceService) {}

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
}
