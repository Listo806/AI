import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NuveiService } from './nuvei.service';

const ADMIN_ROLES = ['admin', 'super_admin', 'owner', 'developer'];

function clientIp(req: any): string {
  const fwd = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return (
    fwd ||
    req?.headers?.['cf-connecting-ip'] ||
    req?.headers?.['x-real-ip'] ||
    req?.ip ||
    req?.socket?.remoteAddress ||
    ''
  );
}

@Controller('nuvei')
export class NuveiController {
  constructor(private readonly nuvei: NuveiService) {}

  // Public config for the checkout page (environment + CLIENT app code + plans).
  @Get('config')
  config() {
    return this.nuvei.publicConfig();
  }

  // Current user's Nuvei subscription snapshot (optional, for the account page).
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async subscription(@CurrentUser() user: any) {
    return this.nuvei.getUserSubscription(user?.id);
  }

  // Audit view: card (last4), every transaction with transaction_ID +
  // authorization_code, and the confirmation-email log. Owners: own sub only.
  @Get('subscription/:id/details')
  @UseGuards(JwtAuthGuard)
  async subscriptionDetails(@CurrentUser() user: any, @Param('id') id: string) {
    return this.nuvei.subscriptionDetails(String(id), user?.id, this.isTrueAdmin(user));
  }

  // STAGING-ONLY test hook: simulate the 14-day trial ending and run the
  // recurring sweep now. Refused when NUVEI_ENVIRONMENT is production.
  @Post('subscription/:id/simulate-trial-end')
  @UseGuards(JwtAuthGuard)
  async simulateTrialEnd(@CurrentUser() user: any, @Param('id') id: string) {
    return this.nuvei.simulateTrialEnd(String(id), user?.id, this.isTrueAdmin(user));
  }

  private isTrueAdmin(user: any): boolean {
    return ['admin', 'super_admin', 'developer'].includes(
      String(user?.role || '').toLowerCase(),
    );
  }

  /**
   * Server-side Add Card. Tokenizes a card and stores the encrypted token.
   * Used by QA with the staging test cards; in the live browser flow the card is
   * tokenized client-side and only the token id reaches `activate`.
   */
  @Post('card')
  @UseGuards(JwtAuthGuard)
  async addCard(@CurrentUser() user: any, @Body() body: any) {
    return this.nuvei.addCard({
      userId: user?.id,
      number: String(body?.number || ''),
      holderName: String(body?.holderName || body?.holder_name || ''),
      expiryMonth: Number(body?.expiryMonth || body?.expiry_month),
      expiryYear: Number(body?.expiryYear || body?.expiry_year),
      cvc: String(body?.cvc || ''),
      type: body?.type,
    });
  }

  /**
   * Store a token from the Paymentez browser SDK (the PCI-safe primary path).
   * The card is entered in Nuvei's iframe; only the token id arrives here.
   */
  @Post('save-token')
  @UseGuards(JwtAuthGuard)
  async saveToken(@CurrentUser() user: any, @Body() body: any) {
    return this.nuvei.saveClientToken({
      userId: user?.id,
      token: String(body?.token || ''),
      bin: body?.bin,
      last4: body?.last4 || body?.number,
      brand: body?.brand || body?.type,
      holderName: body?.holderName || body?.holder_name,
      expiryMonth: body?.expiryMonth || body?.expiry_month,
      expiryYear: body?.expiryYear || body?.expiry_year,
      status: body?.status,
      transactionReference: body?.transactionReference || body?.transaction_reference,
    });
  }

  // Begin a subscription: charge activation (3DS) on the stored card, start the
  // trial, and provision the plan on approval.
  @Post('activate')
  @UseGuards(JwtAuthGuard)
  async activate(@CurrentUser() user: any, @Body() body: any, @Req() req: any) {
    return this.nuvei.startActivation({
      userId: user?.id,
      planKey: String(body?.planKey || body?.plan || ''),
      cardId: String(body?.cardId || ''),
      consentIp: clientIp(req),
      browserInfo: body?.browserInfo,
      termUrl: body?.termUrl,
    });
  }

  // Cancel the user's own subscription.
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@CurrentUser() user: any, @Body() body: any) {
    return this.nuvei.cancel(String(body?.subscriptionId || ''), user?.id);
  }

  /**
   * Nuvei verified callback / webhook. Public endpoint. Confirmation of service
   * happens here (not on any frontend redirect). Idempotent; always 200 so Nuvei
   * stops retrying a processed event.
   */
  @Post('callback')
  @HttpCode(200)
  async callback(
    @Body() body: any,
    @Headers('x-nuvei-token') token: string,
    @Headers('auth-token') authToken: string,
  ) {
    return this.nuvei.handleCallback(body, token || authToken);
  }

  // Admin: refund a transaction.
  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async refund(@CurrentUser() user: any, @Body() body: any) {
    this.requireAdmin(user);
    return this.nuvei.refund({
      transactionId: String(body?.transactionId || ''),
      amount: body?.amount != null ? Number(body.amount) : undefined,
      adminId: user?.id,
    });
  }

  // Admin: create a Link-to-Pay for a custom Web Solutions quotation.
  @Post('link-to-pay')
  @UseGuards(JwtAuthGuard)
  async linkToPay(@CurrentUser() user: any, @Body() body: any) {
    this.requireAdmin(user);
    return this.nuvei.createLinkToPay({
      amount: Number(body?.amount),
      customerName: String(body?.customerName || ''),
      customerEmail: String(body?.customerEmail || ''),
      description: String(body?.description || ''),
      reference: body?.reference,
      adminId: user?.id,
    });
  }

  private requireAdmin(user: any) {
    if (!ADMIN_ROLES.includes(String(user?.role || '').toLowerCase())) {
      throw new ForbiddenException('Admins only');
    }
  }
}
