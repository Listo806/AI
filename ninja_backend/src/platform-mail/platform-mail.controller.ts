import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PlatformMailerService } from './platform-mailer.service';
import { TemplateName } from './templates';
import {
  MANUAL_EMAIL_CATALOG,
  MANUAL_ONLY_CATALOG,
  isManualTemplate,
  isBulkTemplate,
} from './manual-email.catalog';

// Bulk campaigns are sent in ONE admin-selected language (en/es/pt) — never a
// silent default. The selector value is validated here before anything is queued.
const BULK_LANGS = ['en', 'es', 'pt'] as const;
type BulkLang = (typeof BULK_LANGS)[number];
function normalizeBulkLang(v: any): BulkLang | null {
  const l = String(v || '').slice(0, 2).toLowerCase();
  return (BULK_LANGS as readonly string[]).includes(l) ? (l as BulkLang) : null;
}

const TEST_TEMPLATES: TemplateName[] = [
  'welcome',
  'getting_started',
  'abandoned_1',
  'abandoned_2',
  'abandoned_3',
  'payment_failed',
  'subscription_canceled',
  'free_welcome',
  'free_plan_value',
  'free_ai',
  'free_team',
  'free_upgrade',
  'onb_welcome',
  'onb_support',
  'onb_ai',
  'onb_invite_team',
  'onb_connect',
  'onb_system',
  'onb_ready',
  'onb_team',
];

// Admin-only visibility into platform lifecycle email delivery (welcome +
// abandoned-signup): what was sent, skipped, or errored, and to whom. Also a
// test-send endpoint so any template can be verified to any address on demand.
@ApiTags('admin')
@Controller('admin/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class PlatformMailController {
  constructor(private readonly mailer: PlatformMailerService) {}

  @Get('log')
  @ApiOperation({ summary: 'Recent platform email delivery log (admin)' })
  @ApiQuery({ name: 'limit', required: false })
  async log(@Query('limit') limit?: string) {
    const data = await this.mailer.recentLog(Number(limit) || 100);
    return { data };
  }

  @Post('test-send')
  @ApiOperation({
    summary: 'Send a test of any lifecycle email to any address (admin)',
  })
  async testSend(
    @Body() body: { to?: string; template?: string; language?: string },
  ) {
    const to = String(body?.to || '').trim();
    const template = String(body?.template || 'welcome') as TemplateName;
    const language = String(body?.language || 'en')
      .slice(0, 2)
      .toLowerCase();

    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return { ok: false, error: 'A valid recipient email is required.' };
    }
    if (!TEST_TEMPLATES.includes(template)) {
      return { ok: false, error: 'Unknown template.' };
    }

    const result = await this.mailer.sendTestEmail({ to, template, language });
    return {
      ok: result.sent,
      status: result.status,
      reason: result.reason,
    };
  }

  @Post('test-free-onboarding')
  @ApiOperation({
    summary: 'Send all 5 Free-onboarding emails to any address (admin)',
  })
  async testFreeOnboarding(@Body() body: { to?: string; language?: string }) {
    const to = String(body?.to || '').trim();
    const language = String(body?.language || 'en')
      .slice(0, 2)
      .toLowerCase();

    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return { ok: false, error: 'A valid recipient email is required.' };
    }

    const results = await this.mailer.sendFreeOnboardingTest(to, language);
    return { ok: results.every((r) => r.sent), results };
  }

  @Post('test-onboarding')
  @ApiOperation({
    summary:
      'Send all 7 onboarding-sequence emails (Day 0/1/2/4/6/9/12) to any address (admin)',
  })
  async testOnboarding(@Body() body: { to?: string; language?: string }) {
    const to = String(body?.to || '').trim();
    const language = String(body?.language || 'en')
      .slice(0, 2)
      .toLowerCase();

    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return { ok: false, error: 'A valid recipient email is required.' };
    }

    const results = await this.mailer.sendOnboardingTest(to, language);
    return { ok: results.every((r) => r.sent), results };
  }

  // ── Manual single-customer template sender (customer detail "Send Email") ──

  @Get('templates')
  @ApiOperation({
    summary: 'List the templates an admin can send to one customer (dropdown)',
  })
  templates() {
    // Bulk-only promotions are excluded from the single-customer dropdown.
    return { data: MANUAL_ONLY_CATALOG };
  }

  @Post('preview-customer')
  @ApiOperation({
    summary:
      "Render a template for one customer in their language (preview, no send)",
  })
  async previewCustomer(
    @Body() body: { userId?: string; template?: string },
  ) {
    const userId = String(body?.userId || '').trim();
    const template = String(body?.template || '');
    if (!userId) return { ok: false, error: 'A customer is required.' };
    if (!isManualTemplate(template)) {
      return { ok: false, error: 'Unknown or non-sendable template.' };
    }
    return this.mailer.previewCustomerEmail(userId, template as TemplateName);
  }

  @Post('send-customer')
  @ApiOperation({
    summary: 'Send ONE template email to ONE customer (manual, logged, deduped)',
  })
  async sendCustomer(
    @CurrentUser() user: any,
    @Body()
    body: { userId?: string; template?: string; idempotencyKey?: string },
  ) {
    const userId = String(body?.userId || '').trim();
    const template = String(body?.template || '');
    const idempotencyKey = String(body?.idempotencyKey || '').trim() || null;
    if (!userId) return { ok: false, status: 'error', error: 'A customer is required.' };
    if (!isManualTemplate(template)) {
      return { ok: false, status: 'error', error: 'Unknown or non-sendable template.' };
    }
    const adminId = user?.id || user?.userId || user?.sub || null;
    return this.mailer.sendManualToCustomer({
      userId,
      template: template as TemplateName,
      adminId,
      idempotencyKey,
    });
  }

  // ── Bulk email campaigns (admin) ──────────────────────────────────────────

  @Get('bulk/templates')
  @ApiOperation({ summary: 'Templates allowed for BULK sending (dropdown)' })
  bulkTemplates() {
    return { data: MANUAL_EMAIL_CATALOG.filter((e) => e.bulkAllowed !== false) };
  }

  @Post('bulk/preview')
  @ApiOperation({
    summary:
      'Render a bulk template in the SELECTED language for review (no send)',
  })
  async bulkPreview(
    @Body() body: { template?: string; language?: string; userId?: string },
  ) {
    const template = String(body?.template || '');
    const language = normalizeBulkLang(body?.language);
    if (!isBulkTemplate(template)) {
      return { ok: false, error: 'Unknown or non-bulk template.' };
    }
    if (!language) {
      return { ok: false, error: 'Choose a language (English, Spanish or Portuguese).' };
    }
    try {
      return await this.mailer.previewBulkTemplate({
        template: template as TemplateName,
        language,
        userId: String(body?.userId || '').trim() || null,
      });
    } catch (err: any) {
      return {
        ok: false,
        error: `Could not build the preview: ${String(err?.message || 'unknown error').slice(0, 300)}`,
      };
    }
  }

  @Post('bulk/estimate')
  @ApiOperation({
    summary: 'Estimate a bulk send: eligible / suppressed / invalid + languages',
  })
  async bulkEstimate(
    @Body() body: { userIds?: string[]; template?: string; mode?: string },
  ) {
    const template = String(body?.template || '');
    const userIds = Array.isArray(body?.userIds) ? body.userIds : [];
    const isCustom = String(body?.mode || '') === 'custom' || template === '__custom__';
    // Estimate only categorizes recipients (eligible/suppressed/invalid); it does
    // not depend on the template, so a custom campaign skips the template check.
    if (!isCustom && !isBulkTemplate(template)) {
      return { ok: false, error: 'Unknown or non-bulk template.' };
    }
    if (!userIds.length) {
      return { ok: false, error: 'Select at least one customer.' };
    }
    try {
      const est = await this.mailer.estimateBulkCampaign(userIds);
      return { ok: true, ...est };
    } catch (err: any) {
      return {
        ok: false,
        error: `Could not prepare the send: ${String(err?.message || 'unknown error').slice(0, 300)}`,
      };
    }
  }

  @Post('bulk/send')
  @ApiOperation({
    summary: 'Create a bulk campaign and queue eligible recipients (idempotent)',
  })
  async bulkSend(
    @CurrentUser() user: any,
    @Body()
    body: {
      userIds?: string[];
      template?: string;
      clientToken?: string;
      language?: string;
      // Custom (admin-written) campaign: mode='custom' with an authored subject +
      // body HTML (own text + uploaded images + a CTA button).
      mode?: string;
      subject?: string;
      html?: string;
    },
  ) {
    const template = String(body?.template || '');
    const userIds = Array.isArray(body?.userIds) ? body.userIds : [];
    const clientToken = String(body?.clientToken || '').trim() || null;
    const adminId = user?.id || user?.userId || user?.sub || null;
    const isCustom = String(body?.mode || '') === 'custom' || template === '__custom__';

    if (!userIds.length) {
      return { ok: false, error: 'Select at least one customer.' };
    }

    // ── CUSTOM campaign: admin-authored subject + HTML, sent to everyone ──
    if (isCustom) {
      const subject = String(body?.subject || '').trim();
      const html = String(body?.html || '').trim();
      if (!subject) return { ok: false, error: 'Enter a subject for your email.' };
      if (!html) {
        return { ok: false, error: 'Add some content (text, an image, or a button) before sending.' };
      }
      // Language is just a label for a custom email (the content is fixed); default
      // to English when not chosen.
      const clang = normalizeBulkLang(body?.language) || 'en';
      try {
        return await this.mailer.createBulkCampaign({
          template: '__custom__' as TemplateName,
          userIds,
          adminId,
          clientToken,
          language: clang,
          isCustom: true,
          customSubject: subject,
          customHtml: html,
        });
      } catch (err: any) {
        return {
          ok: false,
          error: `Could not start the campaign: ${String(err?.message || 'unknown error').slice(0, 300)}`,
        };
      }
    }

    // ── Template campaign (existing) ──
    // Language is REQUIRED — the whole campaign is sent in this one language. We
    // never silently fall back to English.
    const language = normalizeBulkLang(body?.language);
    if (!isBulkTemplate(template)) {
      return { ok: false, error: 'Unknown or non-bulk template.' };
    }
    if (!language) {
      return {
        ok: false,
        error: 'Select the campaign language (English, Spanish or Portuguese) before sending.',
      };
    }
    try {
      return await this.mailer.createBulkCampaign({
        template: template as TemplateName,
        userIds,
        adminId,
        clientToken,
        language,
      });
    } catch (err: any) {
      return {
        ok: false,
        error: `Could not start the campaign: ${String(err?.message || 'unknown error').slice(0, 300)}`,
      };
    }
  }

  @Get('history')
  @ApiOperation({
    summary: 'Every email Cortexa recorded for one address (auto/manual/bulk)',
  })
  @ApiQuery({ name: 'email', required: true })
  async history(@Query('email') email?: string) {
    return this.mailer.emailHistoryForAddress(String(email || ''));
  }

  @Get('audit')
  @ApiOperation({
    summary: 'Full send audit for one day (YYYY-MM-DD): totals, distribution, templates',
  })
  @ApiQuery({ name: 'date', required: true })
  async audit(@Query('date') date?: string) {
    try {
      return await this.mailer.emailSendAudit(String(date || ''));
    } catch (err: any) {
      return {
        ok: false,
        error: `Audit failed: ${String(err?.message || 'unknown error').slice(0, 300)}`,
      };
    }
  }

  @Get('bulk/campaigns')
  @ApiOperation({ summary: 'Recent bulk campaigns (admin)' })
  @ApiQuery({ name: 'limit', required: false })
  async bulkCampaigns(@Query('limit') limit?: string) {
    const data = await this.mailer.listBulkCampaigns(Number(limit) || 25);
    return { data };
  }

  @Get('bulk/campaigns/:id')
  @ApiOperation({ summary: 'Bulk campaign status + live sent/failed counts' })
  async bulkCampaign(@Param('id') id: string) {
    const data = await this.mailer.getBulkCampaign(String(id || '').trim());
    if (!data) return { ok: false, error: 'Campaign not found.' };
    return { ok: true, campaign: data };
  }
}
