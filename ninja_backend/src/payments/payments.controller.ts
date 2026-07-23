import { Controller, Post, Get, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PayPalService } from './paypal.service';
import { ConfigService } from '../config/config.service';

@Controller('payment')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paypalService: PayPalService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-checkout')
  createCheckout(@Body() body: { userId: string }) {
    return this.paymentsService.createCheckout(body.userId);
  }

  @Post('payment-success')
  paymentSuccess(@Body() body: { userId: string }) {
    return this.paymentsService.paymentSuccess(body.userId);
  }

  // One-time setup: creates the PayPal product + one plan per tier. Call once
  // per environment (sandbox, then live) and store the returned ids as env
  // vars: PAYPAL_PLAN_SOLO / PAYPAL_PLAN_TEAM / PAYPAL_PLAN_GROWTH.
  @Post('paypal/setup-plans')
  setupPlans() {
    return this.paypalService.setupPlans();
  }

  // The front end fetches the client id + the plan id for the selected tier.
  @Get('paypal/plans')
  getPlans() {
    return {
      clientId: this.configService.get('PAYPAL_CLIENT_ID') || null,
      mode: this.configService.get('PAYPAL_MODE') || 'sandbox',
      plans: {
        solo: this.configService.get('PAYPAL_PLAN_SOLO') || null,
        team: this.configService.get('PAYPAL_PLAN_TEAM') || null,
        growth: this.configService.get('PAYPAL_PLAN_GROWTH') || null,
      },
    };
  }

  // After the customer approves the subscription in PayPal, the front end
  // sends the subscription id here. We verify it with PayPal, then activate
  // the account.
  @Post('paypal/confirm-subscription')
  async confirmSubscription(
    @Body() body: { userId: string; subscriptionId: string; plan: string },
  ) {
    const subscription = await this.paypalService.getSubscription(
      body.subscriptionId,
    );
    const status = subscription?.status;
    if (status !== 'ACTIVE' && status !== 'APPROVED') {
      return { success: false, status: status || 'UNKNOWN' };
    }
    await this.paymentsService.activateSubscription(
      body.userId,
      body.subscriptionId,
      body.plan,
    );
    return { success: true, status };
  }
}
