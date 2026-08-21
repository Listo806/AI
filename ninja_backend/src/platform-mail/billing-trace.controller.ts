import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { ConfigService } from '../config/config.service';
import { CustomersAdminService } from './customers-admin.service';

// Read-only, key-guarded billing lifecycle trace so the Paddle checkout/trial
// flow can be verified end-to-end (sandbox or production) WITHOUT an admin
// login. Given a customer email it returns the derived admin status, the
// effective entitlement, the trial end date, the Paddle webhooks we received,
// the recorded payments (revenue) and the lifecycle emails sent. It writes
// nothing and triggers no charges — it only reads what already happened.
//
// SAFETY: hard-disabled unless ONBOARDING_TEST_KEY is set in the environment
// (the same key as the onboarding test endpoint, so no new secret is needed).
// Every call must present that key (header `x-onb-test-key` or body `key`),
// compared in constant time. Clear the env var to switch the endpoint off.
@ApiTags('billing-trace')
@Controller('billing-trace')
export class BillingTraceController {
  constructor(
    private readonly config: ConfigService,
    private readonly customers: CustomersAdminService,
  ) {}

  private expectedKey(): string {
    return String(this.config.get('ONBOARDING_TEST_KEY') || '').trim();
  }

  private keyOk(provided: string): boolean {
    const expected = this.expectedKey();
    if (!expected) return false; // disabled unless configured
    const a = Buffer.from(String(provided || ''));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  @Post('lookup')
  @ApiOperation({
    summary:
      'Read-only billing lifecycle trace for one customer email (key-guarded, test only)',
  })
  async lookup(
    @Body() body: { email?: string; key?: string },
    @Headers('x-onb-test-key') headerKey?: string,
  ) {
    if (!this.expectedKey()) {
      return {
        ok: false,
        error:
          'Billing trace endpoint is disabled. Set ONBOARDING_TEST_KEY in the environment to enable it, then retry with that key.',
      };
    }
    if (!this.keyOk(headerKey || body?.key || '')) {
      return { ok: false, error: 'Invalid or missing test key.' };
    }
    const email = String(body?.email || '').trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { ok: false, error: 'A valid customer email is required.' };
    }
    return this.customers.billingTrace(email);
  }
}
