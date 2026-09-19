import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) { super(); }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    const ok = await (super.canActivate(context) as Promise<boolean> | boolean);
    if (!ok) return false;

    const req = context.switchToHttp().getRequest();
    const u = req?.user || {};
    const pending = String(u.paymentStatus || '').toLowerCase() === 'paid_email_verification_pending' ||
      String(u.accountStatus || '').toLowerCase() === 'paid_email_verification_pending';
    const internal = u.isInternal === true || ['admin','super_admin','developer'].includes(String(u.internalRole || '').toLowerCase());
    if (!pending || internal) return true;

    // A paid-but-unverified account may only inspect its identity and complete
    // verification. All CRM/workspace/onboarding/trial-feature APIs fail closed.
    const path = String(req?.originalUrl || req?.url || '').split('?')[0];
    const allowed = [
      '/api/users/me', '/users/me',
      '/api/email-verification/status', '/email-verification/status',
      '/api/email-verification/resend', '/email-verification/resend',
      '/api/email-verification/email', '/email-verification/email',
    ];
    if (allowed.some((x) => path.endsWith(x))) return true;
    throw new ForbiddenException({ code:'EMAIL_VERIFICATION_REQUIRED', message:'Verify your email to activate your Cortexa account.' });
  }
}
