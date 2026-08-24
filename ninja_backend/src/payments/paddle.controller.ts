import {
  Controller,
  Get,
  Post,
  Req,
  Headers,
  HttpCode,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PaddleService } from './paddle.service';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments/paddle')
export class PaddleController {
  constructor(
    private readonly paddleService: PaddleService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('config/status')
  @UseGuards(JwtAuthGuard)
  async getConfigStatus() {
    return this.paddleService.getConfigStatus();
  }

  // Purchase-conversion guard. The frontend polls this after a Paddle checkout;
  // it returns { fire: true } exactly once, only after the signature-verified
  // webhook has flipped this user to active, so the Google Ads Purchase tag
  // fires once on a confirmed payment and never on a Thank You page refresh.
  @Post('purchase-conversion/claim')
  @UseGuards(JwtAuthGuard)
  async claimPurchaseConversion(@CurrentUser() user: any) {
    return this.paymentsService.claimPurchaseConversion(user?.id);
  }

  // Public: the frontend Paddle.js checkout reads the client-side token, the
  // environment, and the price ids from here (the client token is publishable).
  @Get('config')
  getConfig() {
    return this.paddleService.getPublicConfig();
  }

  // AI purchase options for the "Add AI Credits" popup: the 100/200/400 one-time
  // packs (priced/mapped by each price's REAL Paddle amount, never guessed) plus
  // the recurring Unlimited AI subscription.
  @Get('ai-purchase-options')
  @UseGuards(JwtAuthGuard)
  async aiPurchaseOptions(@CurrentUser() user: any) {
    return this.paddleService.getAiPurchaseOptions(user);
  }

  // One-time (admin) setup: create the product + prices for our billing model.
  // Returns the price ids to store as env vars. Guarded to admins/owners.
  @Post('setup-plans')
  @UseGuards(JwtAuthGuard)
  async setupPlans(@CurrentUser() user: any) {
    const role = String(user?.role || '').toLowerCase();
    if (!['admin', 'super_admin', 'owner', 'developer'].includes(role)) {
      throw new ForbiddenException('Admins only');
    }
    return this.paddleService.setupPlans();
  }


  // Safe production setup for the new $7 / $14 / $21 starting charges.
  // It derives the existing product from PADDLE_PRICE_TEAM/SOLO/GROWTH and
  // creates ONLY the three one-time prices. Existing recurring prices are untouched.
  @Post('setup-starting-prices')
  @UseGuards(JwtAuthGuard)
  async setupStartingPrices(@CurrentUser() user: any) {
    const role = String(user?.role || '').toLowerCase();

    if (!['admin', 'super_admin', 'owner', 'developer'].includes(role)) {
      throw new ForbiddenException('Admins only');
    }

    return this.paddleService.setupStartingPrices();
  }

  // One-time (admin) setup for Paddle's NATIVE PAID TRIALS. Creates one monthly
  // price per plan that charges $7/$14/$21 for a 14-day trial and then renews at
  // $197/$347/$497 — a single clean checkout line. Returns the three
  // PADDLE_PRICE_*_PAIDTRIAL ids to store as env vars. Existing prices untouched.
  @Post('setup-paid-trial-prices')
  @UseGuards(JwtAuthGuard)
  async setupPaidTrialPrices(@CurrentUser() user: any) {
    const role = String(user?.role || '').toLowerCase();
    if (!['admin', 'super_admin', 'owner', 'developer'].includes(role)) {
      throw new ForbiddenException('Admins only');
    }
    return this.paddleService.setupPaidTrialPrices();
  }

  @Get('client-token')
  @UseGuards(JwtAuthGuard)
  async getClientToken() {
    const token = await this.paddleService.getClientToken();
    // If token is null, frontend will automatically fall back to vendor ID
    return { clientToken: token };
  }

  // Paddle webhook receiver. Verifies the signature against the raw body, then
  // processes the event idempotently. Answers 200 on accept; an unmatched status
  // event throws (5xx) so Paddle retries until checkout has linked the account.
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: any,
    @Headers('paddle-signature') signature: string,
  ) {
    const raw = req.rawBody; // Buffer; rawBody is enabled in main.ts
    const valid = this.paddleService.verifyWebhookSignature(signature, raw);
    if (!valid) {
      // Invalid/forged signature: accept and drop so Paddle stops retrying.
      return { received: true };
    }
    await this.paymentsService.processPaddleWebhook(req.body);
    return { received: true };
  }
}