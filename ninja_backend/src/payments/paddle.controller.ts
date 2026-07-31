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
