import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Verifies the X-Hub-Signature-256 header on inbound Meta (Instagram/Messenger)
 * webhooks. Meta signs the raw request body with HMAC-SHA256 keyed by the app
 * secret and sends `sha256=<hex>`.
 *
 * Requires `rawBody: true` on the Nest app (already enabled in main.ts).
 *
 * Rollout safety: set WEBHOOK_SIGNATURE_ENFORCE=false to log mismatches without
 * rejecting (useful right after enabling on live traffic to confirm signatures
 * line up before hard-enforcing). Defaults to enforcing.
 */
@Injectable()
export class MetaWebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(MetaWebhookSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const enforce =
      (process.env.WEBHOOK_SIGNATURE_ENFORCE ?? 'true').toLowerCase() !==
      'false';
    const appSecret = process.env.META_APP_SECRET;
    const header = req.headers['x-hub-signature-256'] as string | undefined;
    const raw: Buffer | undefined = req.rawBody;

    if (!appSecret) {
      this.logger.error(
        'META_APP_SECRET is not set; cannot verify Meta webhook signature',
      );
      if (enforce) {
        throw new UnauthorizedException(
          'Webhook signature verification unavailable',
        );
      }
      return true;
    }

    if (!header || !raw) {
      this.logger.warn('Missing X-Hub-Signature-256 or raw body on Meta webhook');
      if (enforce) throw new UnauthorizedException('Missing webhook signature');
      return true;
    }

    const expected =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(raw).digest('hex');
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!ok) {
      this.logger.warn('Meta webhook signature mismatch');
      if (enforce) throw new UnauthorizedException('Invalid webhook signature');
      return true;
    }

    return true;
  }
}
