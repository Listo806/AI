import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { validateRequest } from 'twilio';

/**
 * Verifies the X-Twilio-Signature header on inbound Twilio (WhatsApp) webhooks.
 * Twilio signs the full request URL plus the POST parameters with the account
 * auth token; `validateRequest` reproduces and compares that signature.
 *
 * Behind a proxy (Cloudflare/Render) the signed URL must match the public URL
 * Twilio was configured with. The scheme/host are taken from the forwarded
 * headers, or set TWILIO_WEBHOOK_BASE_URL (e.g. https://backend.cortexaaicrm.com)
 * to pin them explicitly.
 *
 * Rollout safety: WEBHOOK_SIGNATURE_ENFORCE=false logs mismatches without
 * rejecting, so inbound message flow can be confirmed before hard-enforcing.
 */
@Injectable()
export class TwilioWebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(TwilioWebhookSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const enforce =
      (process.env.WEBHOOK_SIGNATURE_ENFORCE ?? 'true').toLowerCase() !==
      'false';
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = req.headers['x-twilio-signature'] as string | undefined;

    if (!authToken) {
      this.logger.error(
        'TWILIO_AUTH_TOKEN is not set; cannot verify WhatsApp webhook signature',
      );
      if (enforce) {
        throw new UnauthorizedException(
          'Webhook signature verification unavailable',
        );
      }
      return true;
    }

    if (!signature) {
      this.logger.warn('Missing X-Twilio-Signature on WhatsApp webhook');
      if (enforce) throw new UnauthorizedException('Missing webhook signature');
      return true;
    }

    const base = process.env.TWILIO_WEBHOOK_BASE_URL;
    const proto = (
      (req.headers['x-forwarded-proto'] as string) ||
      req.protocol ||
      'https'
    )
      .split(',')[0]
      .trim();
    const host =
      (req.headers['x-forwarded-host'] as string) || req.headers['host'];
    const url = base
      ? `${base.replace(/\/$/, '')}${req.originalUrl}`
      : `${proto}://${host}${req.originalUrl}`;
    const params =
      req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)
        ? req.body
        : {};

    const ok = validateRequest(authToken, signature, url, params);
    if (!ok) {
      this.logger.warn(`WhatsApp webhook signature mismatch (url=${url})`);
      if (enforce) throw new UnauthorizedException('Invalid webhook signature');
      return true;
    }

    return true;
  }
}
