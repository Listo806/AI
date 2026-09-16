import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NuveiService } from './nuvei.service';

// Money-moving admin actions (refund, payment links) are for real platform
// admins only — never a customer "owner" account.
const TRUE_ADMIN_ROLES = ['admin', 'super_admin', 'developer'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function requireUuid(value: any, what = 'id'): string {
  const v = String(value || '').trim();
  if (!UUID_RE.test(v)) throw new BadRequestException(`A valid ${what} is required.`);
  return v;
}

@Controller('nuvei')
export class NuveiController {
  constructor(private readonly nuvei: NuveiService) {}

  // Public config for the checkout page (environment + CLIENT app code + plans).
  @Get('config')
  config() {
    return this.nuvei.publicConfig();
  }

  // Current user's Nuvei subscription snapshot (checkout polling, account page).
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
    return this.nuvei.subscriptionDetails(
      requireUuid(id, 'subscription id'),
      user?.id,
      this.isTrueAdmin(user),
    );
  }

  // STAGING-ONLY test hook: simulate the 14-day trial ending and run the
  // recurring sweep now. Refused when NUVEI_ENVIRONMENT is production.
  @Post('subscription/:id/simulate-trial-end')
  @UseGuards(JwtAuthGuard)
  async simulateTrialEnd(@CurrentUser() user: any, @Param('id') id: string) {
    return this.nuvei.simulateTrialEnd(
      requireUuid(id, 'subscription id'),
      user?.id,
      this.isTrueAdmin(user),
    );
  }

  private isTrueAdmin(user: any): boolean {
    return TRUE_ADMIN_ROLES.includes(String(user?.role || '').toLowerCase());
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

  // The user's saved cards (never the token itself). Lets the checkout reuse
  // a card Nuvei reports as "already added" for this user.
  @Get('cards')
  @UseGuards(JwtAuthGuard)
  async cards(@CurrentUser() user: any) {
    return this.nuvei.listSavedCards(user?.id);
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
      testScenario: body?.testScenario,
    });
  }

  // 3DS "method" step done in the browser (hidden iframe rendered ~5s):
  // continue the authentication and get either a challenge or the outcome.
  @Post('3ds/continue')
  @UseGuards(JwtAuthGuard)
  async threeDsContinue(@CurrentUser() user: any, @Body() body: any) {
    return this.nuvei.threeDsContinue(
      requireUuid(body?.subscriptionId, 'subscription id'),
      user?.id,
    );
  }

  /**
   * 3DS term_url: the bank's ACS posts the challenge result (CRes) here through
   * the customer's browser (form POST; some ACS implementations GET). We hand
   * the CRes to Nuvei, finalize the activation from the transaction's real
   * status, and send the browser back to the checkout page, which polls.
   * Public by design; it can only ever redirect to our own checkout.
   */
  @Post('3ds/return/:id')
  async threeDsReturnPost(
    @Param('id') id: string,
    @Body() body: any,
    @Query() query: any,
    @Res() res: any,
  ) {
    return this.threeDsReturn(id, { ...(query || {}), ...(body || {}) }, res);
  }

  @Get('3ds/return/:id')
  async threeDsReturnGet(@Param('id') id: string, @Query() query: any, @Res() res: any) {
    return this.threeDsReturn(id, query || {}, res);
  }

  private async threeDsReturn(id: string, form: any, res: any) {
    let redirect = 'https://www.cortexaaicrm.com/checkout?plan=solo&threeds=return';
    try {
      const out = await this.nuvei.threeDsReturn(requireUuid(id, 'subscription id'), form);
      redirect = out.redirect || redirect;
    } catch (err: any) {
      // Never strand the customer on a blank page: the checkout will poll and
      // show the real outcome.
    }
    res.redirect(302, redirect);
  }

  // Replace the billed card (own subscription; admins any). A past_due or
  // suspended subscription is retried immediately with the new card.
  @Post('subscription/:id/card')
  @UseGuards(JwtAuthGuard)
  async updateCard(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.nuvei.updateCard(
      requireUuid(id, 'subscription id'),
      user?.id,
      requireUuid(body?.cardId, 'card id'),
      this.isTrueAdmin(user),
    );
  }

  // Nuvei's MANDATORY verification step (one-time password / authorization
  // code / amount) for cards whose issuer asks for it, Diners group included.
  @Post('subscription/:id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.nuvei.verifyPayment({
      subscriptionId: requireUuid(id, 'subscription id'),
      userId: user?.id,
      isAdmin: this.isTrueAdmin(user),
      type: String(body?.type || 'BY_OTP'),
      value: String(body?.value || body?.code || ''),
    });
  }

  // Forget a stored card (Nuvei Delete Card + the local record).
  @Delete('cards/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCard(@CurrentUser() user: any, @Param('id') id: string) {
    return this.nuvei.deleteSavedCard(requireUuid(id, 'card id'), user?.id);
  }

  // Nuvei hosted Checkout for a ONE-TIME payment: returns the checkout URL.
  @Post('checkout-reference')
  @UseGuards(JwtAuthGuard)
  async checkoutReference(@CurrentUser() user: any, @Body() body: any) {
    return this.nuvei.createCheckoutReference({
      userId: user?.id,
      amount: Number(body?.amount),
      description: String(body?.description || 'Cortexa payment'),
      locale: body?.locale,
    });
  }

  // Cancel the user's own subscription (access continues until the paid
  // period ends unless `immediately` is true).
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@CurrentUser() user: any, @Body() body: any) {
    return this.nuvei.cancel(
      requireUuid(body?.subscriptionId, 'subscription id'),
      user?.id,
      body?.immediately === true,
    );
  }

  /**
   * Nuvei verified callback / webhook. Public endpoint. Confirmation of service
   * happens here (not on any frontend redirect). Idempotent. Answers 200 when
   * processed (or a duplicate), 203 when the signature is bad (Nuvei's
   * documented token error) and 409 when processing failed so Nuvei retries.
   */
  @Post('callback')
  async callback(
    @Body() body: any,
    @Headers('x-nuvei-token') token: string,
    @Headers('auth-token') authToken: string,
    @Res({ passthrough: true }) res: any,
  ) {
    const out = await this.nuvei.handleCallback(body, token || authToken);
    res.status(out.httpStatus || 200);
    return out;
  }

  // Admin: refund a transaction (full, or partial with `amount`).
  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async refund(@CurrentUser() user: any, @Body() body: any) {
    this.requireTrueAdmin(user);
    const raw = body?.amount;
    return this.nuvei.refund({
      transactionId: String(body?.transactionId || ''),
      amount: raw === undefined || raw === null || raw === '' ? undefined : Number(raw),
      adminId: user?.id,
    });
  }

  // Admin: create a Link-to-Pay for a custom Web Solutions quotation.
  @Post('link-to-pay')
  @UseGuards(JwtAuthGuard)
  async linkToPay(@CurrentUser() user: any, @Body() body: any) {
    this.requireTrueAdmin(user);
    return this.nuvei.createLinkToPay({
      amount: Number(body?.amount),
      customerName: String(body?.customerName || ''),
      customerEmail: String(body?.customerEmail || ''),
      description: String(body?.description || ''),
      reference: body?.reference,
      adminId: user?.id,
    });
  }

  private requireTrueAdmin(user: any) {
    if (!this.isTrueAdmin(user)) {
      throw new ForbiddenException('Admins only');
    }
  }
}
