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
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: SubscriptionPlansService,
  ) {}

  @Get('plans')
  async getPlans(@Query('activeOnly') activeOnly?: string) {
    return this.plansService.findAll(activeOnly === 'true');
  }

  @Get('plans/:id')
  async getPlan(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Post('plans')
  async createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.plansService.create(createPlanDto);
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) {
    await this.plansService.delete(id);
    return { message: 'Plan deleted successfully' };
  }

  @Post()
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.create(createSubscriptionDto, user.id);
  }

  @Get('team/:teamId')
  async getTeamSubscription(@Param('teamId') teamId: string) {
    return this.subscriptionsService.findByTeamId(teamId);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: { immediately?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.cancel(id, user.id, body.immediately || false);
  }

  @Post('team/:teamId/billing-portal')
  async createBillingPortalSession(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    const url = await this.subscriptionsService.createBillingPortalSession(teamId, user.id);
    return { url };
  }
}
