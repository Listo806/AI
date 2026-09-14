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

  private async request(
    method: 'POST' | 'GET',
    url: string,
    payload?: any,
  ): Promise<NuveiCallResult> {
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Auth-Token': this.serverAuthToken(),
        },
        body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
      });
    } catch (err: any) {
      this.logger.error(`Nuvei request to ${url} failed: ${err?.message}`);
      return { ok: false, httpStatus: 0, body: null, error: err?.message };
    }
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

  /** GET /v2/card/list/{uid} — list a user's stored cards. */
  async listCards(userId: string): Promise<NuveiCallResult> {
    return this.request(
      'GET',
      `${this.cardsBase()}/v2/card/list/${encodeURIComponent(userId)}`,
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
    const payload: any = {
      user,
      order: {
        installments: 1,
        installments_type: 0,
        vat: 0,
        ...order,
      },
      card: { token },
    };
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
  ): Promise<NuveiCallResult> {
    const payload: any = { transaction: { id: transactionId } };
    if (typeof amount === 'number' && amount > 0) {
      payload.order = { amount };
    }
    return this.request(
      'POST',
      `${this.cardsBase()}/v2/transaction/refund/`,
      payload,
    );
  }

  /**
   * Best-effort server-side verification of a card transaction by id.
   * The card-transaction status query is not fully documented for staging, so
   * callers must treat a non-ok result as "could not verify" (never as failure)
   * and fall back to the recorded order + webhook body match.
   */
  async verifyTransaction(transactionId: string): Promise<NuveiCallResult> {
    return this.request(
      'GET',
      `${this.cardsBase()}/v2/transaction/${encodeURIComponent(transactionId)}`,
    );
  }

  /**
   * POST {noccapi}/linktopay/init_order/ — create a Nuvei "Link to Pay" for a
   * custom (manually-quoted) amount. Used only for Web Solutions quotations.
   */
  async createLinkToPay(input: {
    user: NuveiUser;
    order: NuveiOrder;
    confVars?: any;
  }): Promise<NuveiCallResult> {
    return this.request(
      'POST',
      `${this.nonCardsBase()}/linktopay/init_order/`,
      {
        user: input.user,
        order: {
          installments_type: 0,
          currency: 'USD',
          ...input.order,
        },
        ...(input.confVars ? { conf: input.confVars } : {}),
      },
    );
  }
}
