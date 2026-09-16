import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '../config/config.service';

/**
 * Low-level HTTP client for the Nuvei / Datafast (Paymentez) card API.
 *
 * Docs: https://developers.dev.paymentez.com/api/
 *
 * Authentication (server-to-server):
 *   unix_ts          = current time in SECONDS
 *   uniq_token_str   = SERVER_APP_KEY + unix_ts
 *   uniq_token_hash  = sha256_hex(uniq_token_str)
 *   Auth-Token       = base64( SERVER_APP_CODE ";" unix_ts ";" uniq_token_hash )
 * The token is valid for a few seconds, so it is generated per request.
 *
 * This service holds ONLY the transport concerns (auth header, base URLs, JSON
 * request/response). All business logic lives in NuveiService.
 */

export interface NuveiUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  ip_address?: string;
  fiscal_number?: string;
}

export interface NuveiCardInput {
  number: string;
  holder_name: string;
  expiry_month: number;
  expiry_year: number;
  cvc: string;
  type?: string; // vi | mc | ax | di ...
}

export interface NuveiOrder {
  amount: number;
  description: string;
  dev_reference: string;
  vat?: number;
  taxable_amount?: number;
  tax_percentage?: number;
  installments?: number;
  installments_type?: number;
  currency?: string;
}

export interface NuveiCallResult {
  ok: boolean;
  httpStatus: number;
  body: any;
  error?: string;
}

@Injectable()
export class NuveiClientService {
  private readonly logger = new Logger(NuveiClientService.name);

  constructor(private readonly config: ConfigService) {}

  // ---- configuration ---------------------------------------------------

  environment(): 'staging' | 'production' {
    const e = String(this.config.get('NUVEI_ENVIRONMENT') || 'staging')
      .trim()
      .toLowerCase();
    return e === 'production' || e === 'prod' ? 'production' : 'staging';
  }

  /** Cards API base (Add Card, Debit, Refund, 3DS). */
  cardsBase(): string {
    return this.environment() === 'production'
      ? 'https://ccapi.paymentez.com'
      : 'https://ccapi-stg.paymentez.com';
  }

  /** Non-cards API base (Link to Pay, cash/bank/wallets, order verify). */
  nonCardsBase(): string {
    return this.environment() === 'production'
      ? 'https://noccapi.paymentez.com'
      : 'https://noccapi-stg.paymentez.com';
  }

  /** True when the backend (SERVER) credentials are present. */
  isConfigured(): boolean {
    return (
      !!String(this.config.get('NUVEI_SERVER_APP_CODE') || '').trim() &&
      !!String(this.config.get('NUVEI_SERVER_APP_KEY') || '').trim()
    );
  }

  /** Public config the frontend SDK needs (CLIENT app code + environment). */
  publicConfig() {
    return {
      environment: this.environment(),
      clientAppCode:
        String(this.config.get('NUVEI_CLIENT_APP_CODE') || '').trim() || null,
      // The CLIENT app KEY is a publishable key used only by the browser SDK to
      // tokenize a card client-side; it can never move money on its own.
      clientAppKey:
        String(this.config.get('NUVEI_CLIENT_APP_KEY') || '').trim() || null,
      configured: this.isConfigured(),
    };
  }

  private authToken(appCode: string, appKey: string): string {
    const unixTs = String(Math.floor(Date.now() / 1000));
    const uniqTokenHash = crypto
      .createHash('sha256')
      .update(appKey + unixTs)
      .digest('hex');
    return Buffer.from(`${appCode};${unixTs};${uniqTokenHash}`).toString(
      'base64',
    );
  }

  private serverAuthToken(): string {
    const code = String(this.config.get('NUVEI_SERVER_APP_CODE') || '').trim();
    const key = String(this.config.get('NUVEI_SERVER_APP_KEY') || '').trim();
    if (!code || !key) {
      throw new Error(
        'Nuvei is not configured: NUVEI_SERVER_APP_CODE / NUVEI_SERVER_APP_KEY missing.',
      );
    }
    return this.authToken(code, key);
  }

  /** SERVER application code (the one that signs debits / refunds). */
  serverAppCode(): string {
    return String(this.config.get('NUVEI_SERVER_APP_CODE') || '').trim();
  }

  /**
   * Link-to-Pay application. Nuvei issues a SEPARATE application for Link to
   * Pay (a different code and key from the cards application), so its requests
   * must be signed with it and its callbacks verified against it. Falls back to
   * the cards server application while the dedicated pair is not configured.
   */
  linkToPayAppCode(): string {
    return (
      String(this.config.get('NUVEI_LTP_APP_CODE') || '').trim() ||
      this.serverAppCode()
    );
  }

  /** True once a dedicated Link to Pay application is configured. */
  hasSeparateLinkToPayApp(): boolean {
    const code = String(this.config.get('NUVEI_LTP_APP_CODE') || '').trim();
    return !!code && code !== this.serverAppCode();
  }

  private linkToPayAppKey(): string {
    return (
      String(this.config.get('NUVEI_LTP_APP_KEY') || '').trim() ||
      String(this.config.get('NUVEI_SERVER_APP_KEY') || '').trim()
    );
  }

  /**
   * Key for a given application code, used to check the `stoken` Nuvei sends
   * in its webhook (md5 of transaction_id_app_code_user_id_app_key). Both the
   * SERVER and the CLIENT (browser tokenization) apps can originate events.
   */
  appKeyFor(appCode: string): string | null {
    const code = String(appCode || '').trim();
    if (!code) return null;
    if (code === this.serverAppCode()) {
      return String(this.config.get('NUVEI_SERVER_APP_KEY') || '').trim() || null;
    }
    if (code === this.linkToPayAppCode()) {
      return this.linkToPayAppKey() || null;
    }
    if (code === String(this.config.get('NUVEI_CLIENT_APP_CODE') || '').trim()) {
      return String(this.config.get('NUVEI_CLIENT_APP_KEY') || '').trim() || null;
    }
    return null;
  }

  private async request(
    method: 'POST' | 'GET',
    url: string,
    payload?: any,
    app: 'server' | 'linktopay' = 'server',
  ): Promise<NuveiCallResult> {
    let res: Response;
    // A hung gateway must never hang a checkout: fail the call after 45s so
    // the caller can treat it as "unconfirmed" instead of waiting forever.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 45_000);
    try {
      res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Auth-Token':
            app === 'linktopay'
              ? this.authToken(this.linkToPayAppCode(), this.linkToPayAppKey())
              : this.serverAuthToken(),
        },
        body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
        signal: ac.signal,
      });
    } catch (err: any) {
      clearTimeout(timer);
      this.logger.error(`Nuvei request to ${url} failed: ${err?.message}`);
      return { ok: false, httpStatus: 0, body: null, error: err?.message };
    }
    clearTimeout(timer);
    const text = await res.text().catch(() => '');
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }
    if (!res.ok) {
      this.logger.warn(
        `Nuvei ${method} ${url} -> HTTP ${res.status}: ${text.slice(0, 300)}`,
      );
    }
    return { ok: res.ok, httpStatus: res.status, body };
  }

  // ---- endpoints -------------------------------------------------------

  /** POST /v2/card/add — tokenize a card server-side (returns card.token). */
  async addCard(
    user: NuveiUser,
    card: NuveiCardInput,
    sessionId?: string,
  ): Promise<NuveiCallResult> {
    return this.request('POST', `${this.cardsBase()}/v2/card/add`, {
      user,
      card,
      ...(sessionId ? { session_id: sessionId } : {}),
    });
  }

  /** POST /v2/card/delete — forget a stored token. */
  async deleteCard(userId: string, token: string): Promise<NuveiCallResult> {
    return this.request('POST', `${this.cardsBase()}/v2/card/delete`, {
      user: { id: userId },
      card: { token },
    });
  }

  /** GET /v2/card/list?uid=... — list a user's stored cards. */
  async listCards(userId: string): Promise<NuveiCallResult> {
    return this.request(
      'GET',
      `${this.cardsBase()}/v2/card/list?uid=${encodeURIComponent(userId)}`,
    );
  }

  /**
   * POST /v2/transaction/debit/ — charge a stored token.
   * `extraParams` carries the 3DS2 objects (threeDS2_data + browser_info) for
   * customer-present web charges; omit it for scheduled recurrence (no 3DS).
   */
  async debit(
    user: NuveiUser,
    order: NuveiOrder,
    token: string,
    extraParams?: any,
  ): Promise<NuveiCallResult> {
    const o: any = { installments: 1, installments_type: 0, ...order };
    // `vat` is REQUIRED by this Datafast/Ecuador account and must be consistent
    // with taxable_amount + the account's tax rate (IVA 15%): amount is tax-
    // inclusive, so taxable_amount = amount / 1.15 and vat = amount - taxable.
    // Rate is overridable via NUVEI_VAT_RATE for other tax configurations.
    if (o.vat == null) {
      const rate = Number(this.config.get('NUVEI_VAT_RATE') || '0.15');
      const amt = Number(o.amount) || 0;
      const taxable =
        o.taxable_amount != null
          ? Number(o.taxable_amount)
          : Number((amt / (1 + rate)).toFixed(2));
      o.taxable_amount = taxable;
      o.vat = Number((amt - taxable).toFixed(2));
    }
    const payload: any = { user, order: o, card: { token } };
    if (extraParams) payload.extra_params = extraParams;
    return this.request(
      'POST',
      `${this.cardsBase()}/v2/transaction/debit/`,
      payload,
    );
  }

  /** POST /v2/transaction/refund/ — full or partial refund of a card txn. */
  async refund(
    transactionId: string,
    amount?: number,
    app: 'server' | 'linktopay' = 'server',
  ): Promise<NuveiCallResult> {
    const payload: any = { transaction: { id: transactionId } };
    if (typeof amount === 'number' && amount > 0) {
      payload.order = { amount };
    }
    return this.request(
      'POST',
      `${this.cardsBase()}/v2/transaction/refund/`,
      payload,
      app,
    );
  }

  /**
   * GET /v2/transaction/<id>/ — "Transaction Info": the authoritative current
   * status of a card transaction (success / failure / pending / expired /
   * canceled + status_detail). Used to finalize 3DS / review flows and to
   * double-check a callback. Callers must treat a non-ok result as "could not
   * verify" (never as a decline).
   */
  async verifyTransaction(transactionId: string): Promise<NuveiCallResult> {
    return this.request(
      'GET',
      `${this.cardsBase()}/v2/transaction/${encodeURIComponent(transactionId)}/`,
    );
  }

  /**
   * POST /v2/3ds/auth_continue/ — after the 3DS "method" (fingerprint) iframe
   * has been rendered for ~5s (authentication return_code 50 / status_detail
   * 35), continue the authentication. May answer with a challenge.
   */
  async threeDsContinue(transactionId: string): Promise<NuveiCallResult> {
    return this.request('POST', `${this.cardsBase()}/v2/3ds/auth_continue/`, {
      transaction: { id: transactionId },
    });
  }

  /**
   * POST /v2/3ds/auth_verify/ — submit the CRes the ACS posted to our term_url
   * so Nuvei can validate the challenge result and complete the debit.
   */
  async threeDsVerify(transactionId: string, cres: string): Promise<NuveiCallResult> {
    return this.request('POST', `${this.cardsBase()}/v2/3ds/auth_verify/`, {
      transaction: { id: transactionId },
      cres,
    });
  }

  /**
   * POST {noccapi}/linktopay/init_order/ — create a Nuvei "Link to Pay" for a
   * custom (manually-quoted) amount. Used only for Web Solutions quotations.
   */
  async createLinkToPay(input: {
    user: NuveiUser & { name?: string; last_name?: string };
    order: NuveiOrder;
    configuration: {
      partial_payment?: boolean;
      expiration_days?: number;
      allowed_payment_methods?: string[];
      success_url: string;
      failure_url: string;
      pending_url: string;
      review_url: string;
    };
  }): Promise<NuveiCallResult> {
    const rate = Number(this.config.get('NUVEI_VAT_RATE') || '0.15');
    const o: any = { installments_type: 0, currency: 'USD', ...input.order };
    // Same tax rule as card debits: the amount is tax inclusive (IVA 15%), and
    // Nuvei's documented Link-to-Pay body carries vat, taxable_amount and
    // tax_percentage together.
    if (o.vat == null) {
      const amt = Number(o.amount) || 0;
      const taxable = Number((amt / (1 + rate)).toFixed(2));
      o.taxable_amount = taxable;
      o.vat = Number((amt - taxable).toFixed(2));
    }
    if (o.tax_percentage == null) {
      o.tax_percentage = Number((rate * 100).toFixed(2));
    }
    return this.request(
      'POST',
      `${this.nonCardsBase()}/linktopay/init_order/`,
      {
        user: {
          id: input.user.id,
          email: input.user.email,
          name: input.user.name || input.user.first_name || 'Customer',
          last_name: input.user.last_name || '-',
        },
        order: o,
        configuration: {
          partial_payment: false,
          expiration_time: 36000,
          allowed_payment_methods: ['All'],
          ...input.configuration,
        },
      },
      'linktopay',
    );
  }

  /**
   * POST /v2/transaction/verify — Nuvei's MANDATORY verification method for
   * Diners-group cards and any card whose issuer asks for an extra check
   * (one-time password, authorization code, amount). `type` is one of
   * BY_AMOUNT, BY_AUTH_CODE, BY_OTP.
   */
  async verifyWithValue(
    userId: string,
    transactionId: string,
    type: string,
    value: string,
    moreInfo = true,
  ): Promise<NuveiCallResult> {
    return this.request('POST', `${this.cardsBase()}/v2/transaction/verify`, {
      user: { id: String(userId) },
      transaction: { id: String(transactionId) },
      type,
      value,
      more_info: moreInfo,
    });
  }

  /**
   * POST /v2/transaction/init_reference/ — Nuvei's hosted Checkout for a
   * one-time payment: returns a checkout_url to send the customer to, plus the
   * reference the callback will carry.
   */
  async initReference(input: {
    user: NuveiUser;
    order: NuveiOrder;
    locale?: string;
  }): Promise<NuveiCallResult> {
    const rate = Number(this.config.get('NUVEI_VAT_RATE') || '0.15');
    const o: any = { installments_type: 0, currency: 'USD', ...input.order };
    if (o.vat == null) {
      const amt = Number(o.amount) || 0;
      const taxable = Number((amt / (1 + rate)).toFixed(2));
      o.taxable_amount = taxable;
      o.vat = Number((amt - taxable).toFixed(2));
    }
    if (o.tax_percentage == null) {
      o.tax_percentage = Number((rate * 100).toFixed(2));
    }
    return this.request('POST', `${this.cardsBase()}/v2/transaction/init_reference/`, {
      locale: String(input.locale || 'en'),
      user: input.user,
      order: o,
    });
  }
}
