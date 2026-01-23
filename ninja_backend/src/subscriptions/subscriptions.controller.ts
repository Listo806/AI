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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionEnforcementService } from './services/subscription-enforcement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaRestrictionGuard } from '../auth/guards/va-restriction.guard';
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
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiBody({ type: UpdatePlanDto })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  async updatePlan(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan deleted successfully' })
  async deletePlan(@Param('id') id: string) {
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

  @Get('team/:teamId/features')
  @ApiOperation({ summary: 'Get team subscription features and limits' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Subscription features retrieved successfully' })
  async getTeamFeatures(@Param('teamId') teamId: string) {
    return this.enforcementService.getTeamFeatures(teamId);
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
