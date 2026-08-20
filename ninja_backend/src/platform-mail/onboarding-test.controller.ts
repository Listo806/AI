import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { ConfigService } from '../config/config.service';
import { PlatformMailerService } from './platform-mailer.service';

// Purpose-scoped, test-only endpoint so the new onboarding sequence can be
// verified in a real inbox WITHOUT an admin login. It can do exactly ONE thing:
// send the 7 onboarding test emails to a chosen address and read back their own
// log rows. It exposes no customer, billing, subscription, or account data and
// touches no other admin function.
//
// SAFETY: hard-disabled unless ONBOARDING_TEST_KEY is set in the environment.
// Every call must present that key (header `x-onb-test-key` or body `key`),
// compared in constant time. Clear the env var to switch the endpoint off again.
@ApiTags('onboarding-test')
@Controller('onboarding-test')
export class OnboardingTestController {
  constructor(
    private readonly config: ConfigService,
    private readonly mailer: PlatformMailerService,
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

  @Post('run')
  @ApiOperation({
    summary:
      'Send all 7 onboarding test emails to one address (key-guarded, test only)',
  })
  async run(
    @Body() body: { to?: string; language?: string; key?: string },
    @Headers('x-onb-test-key') headerKey?: string,
  ) {
    if (!this.expectedKey()) {
      return {
        ok: false,
        error:
          'Onboarding test endpoint is disabled. Set ONBOARDING_TEST_KEY in the environment to enable it, then retry with that key.',
      };
    }
    if (!this.keyOk(headerKey || body?.key || '')) {
      return { ok: false, error: 'Invalid or missing test key.' };
    }
    const to = String(body?.to || '').trim();
    const language = String(body?.language || 'en')
      .slice(0, 2)
      .toLowerCase();
    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return { ok: false, error: 'A valid recipient email is required.' };
    }

    const results = await this.mailer.sendOnboardingTest(to, language);
    const log = await this.mailer.onboardingTestLog(to);
    // status per email: 'sent' = provider accepted (key valid + sender verified);
    // 'error' = provider rejected, reason carries the exact SendGrid message;
    // 'skipped' = no email provider configured in this environment.
    const anySkipped = results.some((r) => r.status === 'skipped');
    const providerConfigured = !anySkipped;
    return { ok: results.every((r) => r.sent), providerConfigured, results, log };
  }
}
