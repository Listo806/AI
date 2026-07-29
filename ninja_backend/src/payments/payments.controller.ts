import { Controller, Post, Get, Body, Headers, HttpCode } from '@nestjs/common';
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

  // PayPal webhook receiver. Verifies the signature, then processes the event
  // idempotently and updates the user's subscription status. Always answers
  // 200 so PayPal does not retry events we have already accepted.
  @Post('paypal/webhook')
  @HttpCode(200)
  async paypalWebhook(@Headers() headers: any, @Body() body: any) {
    let valid: boolean;
    try {
      valid = await this.paypalService.verifyWebhook(headers, body);
    } catch (err: any) {
      // Could not verify (missing webhook id or transient PayPal error). Throw
      // so we answer 5xx and PayPal retries, rather than dropping a real event.
      console.error(
        'PayPal webhook could not be verified, will retry:',
        body?.id,
        err?.message,
      );
      throw err;
    }
    if (!valid) {
      // Definitively invalid signature (forged). Accept and drop silently.
      console.error(
        'PayPal webhook signature invalid, dropping event',
        body?.id,
        body?.event_type,
      );
      return { received: true };
    }
    // processPayPalWebhook throws for a status event that matches no user yet,
    // which becomes a 5xx so PayPal retries until checkout links the account.
    await this.paymentsService.processPayPalWebhook(body);
    return { received: true };
  }
}
