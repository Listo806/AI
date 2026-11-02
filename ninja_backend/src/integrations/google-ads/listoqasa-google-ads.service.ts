import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { DatabaseService } from '../../database/database.service';

/** Completely separate ListoQasa OAuth credentials, tokens and Ads account. */
@Injectable()
export class ListoqasaGoogleAdsService {
  private readonly logger = new Logger(ListoqasaGoogleAdsService.name);
  constructor(private readonly db: DatabaseService) {}
  private customer() {
    const id = (process.env.LISTOQASA_GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, '');
    if (!/^\d{10}$/.test(id)) throw new ServiceUnavailableException('LISTOQASA_GOOGLE_ADS_CUSTOMER_ID must be 10 digits');
    return id;
  }
  private client() {
    const { LISTOQASA_GOOGLE_ADS_CLIENT_ID: id, LISTOQASA_GOOGLE_ADS_CLIENT_SECRET: secret, LISTOQASA_GOOGLE_ADS_REDIRECT_URI: redirect } = process.env;
    if (!id || !secret || !redirect) throw new ServiceUnavailableException('ListoQasa OAuth credentials/redirect missing');
    return new google.auth.OAuth2(id, secret, redirect);
  }
  private stateSecret() {
    const secret = process.env.LISTOQASA_GOOGLE_ADS_STATE_SECRET;
    if (!secret) throw new ServiceUnavailableException('LISTOQASA_GOOGLE_ADS_STATE_SECRET missing');
    return secret;
  }
  async schema() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS listoqasa_google_ads_connection (
      id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), customer_id text NOT NULL,
      refresh_token text NOT NULL, connected_at timestamptz NOT NULL DEFAULT now())`);
  }
  connectUrl() {
    this.customer();
    const payload = Buffer.from(JSON.stringify({ purpose: 'listoqasa', exp: Date.now() + 600000 })).toString('base64url');
    const mac = createHmac('sha256', this.stateSecret()).update(payload).digest('base64url');
    return { url: this.client().generateAuthUrl({ access_type: 'offline', prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/adwords'], state: `${payload}.${mac}` }) };
  }
  private checkState(state: string) {
    const [payload, signature, extra] = (state || '').split('.');
    if (!payload || !signature || extra) throw new BadRequestException('Invalid state');
    const expected = createHmac('sha256', this.stateSecret()).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new BadRequestException('Invalid state');
    let parsed: any;
    try { parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { throw new BadRequestException('Invalid state'); }
    if (parsed.purpose !== 'listoqasa' || !Number.isFinite(parsed.exp) || parsed.exp < Date.now()) throw new BadRequestException('Expired state');
  }
  /** Logs only allowlisted Google Ads diagnostic fields. Never log request/response headers, URL or tokens. */
  logApiError(operation: string, error: any) {
    const data = error?.response?.data;
    const details = Array.isArray(data?.error?.details) ? data.error.details : [];
    const failures = details.flatMap((d: any) => Array.isArray(d?.errors) ? d.errors : []).slice(0, 5)
      .map((e: any) => ({ code: e?.errorCode, message: typeof e?.message === 'string' ? e.message.slice(0, 350) : undefined,
        fieldPath: e?.location?.fieldPathElements?.map((f: any) => f.fieldName).filter(Boolean).slice(0, 5) }));
    const requestId = error?.response?.headers?.['request-id'] || data?.error?.requestId || details.find((d: any) => d?.requestId)?.requestId;
    this.logger.error(JSON.stringify({ operation, httpStatus: error?.response?.status, code: data?.error?.code,
      status: data?.error?.status, message: typeof data?.error?.message === 'string' ? data.error.message.slice(0, 350) : undefined,
      requestId, failures }));
  }
  private headers(accessToken: string) {
    const token = process.env.LISTOQASA_GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!token) throw new ServiceUnavailableException('ListoQasa developer token not configured');
    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}`, 'developer-token': token, 'Content-Type': 'application/json' };
    const manager = (process.env.LISTOQASA_GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '');
    // Do not send an unused backup account as login-customer-id.
    if (manager) headers['login-customer-id'] = manager;
    return headers;
  }
  async callback(code: string, state: string) {
    this.checkState(state);
    if (!code) throw new BadRequestException('Missing OAuth code');
    const oauth = this.client();
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token || !tokens.access_token) throw new BadRequestException('Google did not provide offline authorization');
    const customer = this.customer();
    try {
      await axios.post(`https://googleads.googleapis.com/${process.env.LISTOQASA_GOOGLE_ADS_API_VERSION || 'v24'}/customers/${customer}/googleAds:search`,
        { query: 'SELECT customer.id FROM customer LIMIT 1' }, { headers: this.headers(tokens.access_token), timeout: 15000 });
    } catch (error: any) {
      this.logApiError('listoqasa.connect.validation', error);
      throw new BadRequestException('ListoQasa Google Ads API validation failed; inspect sanitized backend diagnostics');
    }
    await this.schema();
    await this.db.query(`INSERT INTO listoqasa_google_ads_connection(id,customer_id,refresh_token)
      VALUES(1,$1,$2) ON CONFLICT(id) DO UPDATE SET customer_id=EXCLUDED.customer_id,refresh_token=EXCLUDED.refresh_token,connected_at=now()`,
      [customer, tokens.refresh_token]);
    return { connected: true, customerId: customer };
  }
  async status() {
    await this.schema();
    const row = (await this.db.query('SELECT customer_id,connected_at FROM listoqasa_google_ads_connection WHERE id=1')).rows[0];
    return { connected: Boolean(row), customerId: row?.customer_id || null, connectedAt: row?.connected_at || null };
  }
  async verifyConversionAction() {
    await this.schema();
    const customer = this.customer();
    const action = (process.env.LISTOQASA_GOOGLE_ADS_OFFLINE_PURCHASE_ACTION_ID || '').trim();
    if (!/^\d+$/.test(action)) throw new ServiceUnavailableException('ListoQasa offline conversion action ID missing');
    const row = (await this.db.query('SELECT refresh_token FROM listoqasa_google_ads_connection WHERE id=1 AND customer_id=$1', [customer])).rows[0];
    if (!row) throw new ServiceUnavailableException('ListoQasa Google Ads OAuth connection missing');
    const oauth = this.client(); oauth.setCredentials({ refresh_token: row.refresh_token });
    const access = (await oauth.getAccessToken()).token;
    if (!access) throw new ServiceUnavailableException('ListoQasa OAuth refresh failed');
    try {
      const response = await axios.post(`https://googleads.googleapis.com/${process.env.LISTOQASA_GOOGLE_ADS_API_VERSION || 'v24'}/customers/${customer}/googleAds:search`,
        { query: `SELECT conversion_action.id,conversion_action.name,conversion_action.type,conversion_action.category,conversion_action.status FROM conversion_action WHERE conversion_action.id = ${action} LIMIT 1` },
        { headers: this.headers(access), timeout: 15000 });
      const record = response.data?.results?.[0]?.conversionAction;
      return { found: Boolean(record), id: action, type: record?.type, category: record?.category, status: record?.status,
        uploadEligible: record?.type === 'UPLOAD_CLICKS' && record?.category === 'PURCHASE' && record?.status === 'ENABLED' };
    } catch (error: any) {
      this.logApiError('listoqasa.conversion_action.verify', error);
      throw new BadRequestException('ListoQasa conversion action verification failed; inspect sanitized backend diagnostics');
    }
  }
}
