import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Delete,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionEnforcementService } from './services/subscription-enforcement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaRestrictionGuard } from '../auth/guards/va-restriction.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('subscriptions')
@ApiBearerAuth('JWT-auth')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, VaRestrictionGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: SubscriptionPlansService,
    private readonly enforcementService: SubscriptionEnforcementService,
  ) {}

  // Plan CRUD affects platform-wide billing; restrict to admin-tier roles
  // (same set used by payments/paddle setup-plans).
  private assertPlanAdmin(user: any) {
    const role = String(user?.role || '').toLowerCase();
    if (!['admin', 'super_admin', 'owner', 'developer'].includes(role)) {
      throw new ForbiddenException('Only admins can manage subscription plans');
    }
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiQuery({ name: 'activeOnly', required: false, type: String, description: 'Filter only active plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async getPlans(@Query('activeOnly') activeOnly?: string) {
    return this.plansService.findAll(activeOnly === 'true');
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiBody({ type: CreatePlanDto })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  async createPlan(
    @Body() createPlanDto: CreatePlanDto,
    @CurrentUser() user: any,
  ) {
    this.assertPlanAdmin(user);
    return this.plansService.create(createPlanDto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiBody({ type: UpdatePlanDto })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @CurrentUser() user: any,
  ) {
    this.assertPlanAdmin(user);
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  async deletePlan(@Param('id') id: string, @CurrentUser() user: any) {
    this.assertPlanAdmin(user);
    await this.plansService.delete(id);
    return { message: 'Plan deleted successfully' };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.create(createSubscriptionDto, user.id);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get team subscription' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  async getTeamSubscription(@Param('teamId') teamId: string) {
    return this.subscriptionsService.findByTeamId(teamId);
  }

  @Post('team/:teamId/select-plan')
  @ApiOperation({ summary: 'Select a plan for the team (no payment)' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiBody({ schema: { type: 'object', properties: { planId: { type: 'string' } }, required: ['planId'] } })
  @ApiResponse({ status: 200, description: 'Plan selected successfully' })
  @ApiResponse({ status: 403, description: 'Only team owner can select plan' })
  async selectPlan(
    @Param('teamId') teamId: string,
    @Body() body: { planId: string },
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.selectPlanForTeam(teamId, body.planId, user.id);
  }

  @Get('team/:teamId/features')
  @ApiOperation({ summary: 'Get team subscription features and limits' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Subscription features retrieved successfully' })
  async getTeamFeatures(@Param('teamId') teamId: string) {
    return this.enforcementService.getTeamFeatures(teamId);
  }

  @Get('my-addons')
  @ApiOperation({ summary: "Active add-ons for the current user's team" })
  @ApiResponse({ status: 200, description: 'e.g. { addons: [], leadGenerator: false }' })
  async getMyAddons(@CurrentUser() user: any) {
    return this.subscriptionsService.getTeamAddons(user?.teamId);
  }

  @Post('addons/lead-generator/purchase')
  @ApiOperation({
    summary: 'Purchase the Lead Generator add-on for the current team',
  })
  @ApiResponse({ status: 201, description: 'Add-on purchased and unlocked' })
  async purchaseLeadGenerator(@CurrentUser() user: any) {
    this.assertPlanAdmin(user); // owner/admin/super_admin/developer only
    return this.subscriptionsService.purchaseAddon(user?.teamId, 'lead_generator');
  }

  @Post('seats/add')
  @ApiOperation({ summary: 'Buy one extra $97/month team seat' })
  @ApiResponse({ status: 201, description: 'Seat added; returns extraSeats' })
  async addSeat(@CurrentUser() user: any) {
    this.assertPlanAdmin(user);
    return this.subscriptionsService.addSeat(user?.teamId);
  }

  @Post('seats/remove')
  @ApiOperation({ summary: 'Remove one paid team seat' })
  @ApiResponse({ status: 201, description: 'Seat removed; returns extraSeats' })
  async removeSeat(@CurrentUser() user: any) {
    this.assertPlanAdmin(user);
    return this.subscriptionsService.removeSeat(user?.teamId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiBody({ schema: { type: 'object', properties: { immediately: { type: 'boolean' } } } })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancel(
    @Param('id') id: string,
    @Body() body: { immediately?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.cancel(id, user.id, body.immediately || false);
  }

  @Post('team/:teamId/billing-portal')
  @ApiOperation({ summary: 'Create billing portal session' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Billing portal URL generated successfully' })
  async createBillingPortalSession(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    const url = await this.subscriptionsService.createBillingPortalSession(teamId, user.id);
    return { url };
  }
}
