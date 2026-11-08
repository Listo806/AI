import { Controller, Get, Post, Req, Res, UseGuards, ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityService } from '../auth/security.service';
import { AuthService } from '../auth/auth.service';
import { createHmac, timingSafeEqual } from 'crypto';

@Controller('charts')
export class ChartsController {
  constructor(private readonly security: SecurityService, private readonly auth: AuthService) {}
  private secret() {
    const secret = process.env.CHARTS_SESSION_SECRET;
    if (!secret || secret.length < 32) throw new ServiceUnavailableException('Charts session secret is not configured');
    return secret;
  }
  private owner(id: string) {
    const allowed = process.env.CHARTS_OWNER_USER_ID;
    if (!allowed) throw new ServiceUnavailableException('Charts owner is not configured');
    if (id !== allowed) throw new ForbiddenException('Charts access is restricted');
  }
  private sign(payload: string) { return createHmac('sha256', this.secret()).update(payload).digest('base64url'); }
  @Post('session')
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Res({passthrough:true}) res: any) {
    this.owner(String(req.user?.id || ''));
    const sid = req.user?.sessionId || req.user?.sid || null;
    if (!sid) throw new UnauthorizedException('Please sign in again to open Charts');
    // Recheck owner and session at the validation endpoint on every request.
    const payload = Buffer.from(JSON.stringify({id:req.user.id, sid, exp:Date.now()+10*60*1000})).toString('base64url');
    const token = `${payload}.${this.sign(payload)}`;
    res.setHeader('Set-Cookie', `cortexa_charts=${token}; Path=/charts; Domain=.cortexaaicrm.com; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    res.setHeader('Cache-Control','no-store');
    return {ok:true,redirect:'/charts/app/'};
  }
  @Get('validate')
  async validate(@Req() req: any, @Res({passthrough:true}) res: any) {
    res.setHeader('Cache-Control','no-store');
    const token = /(?:^|;\s*)cortexa_charts=([^;]+)/.exec(String(req.headers.cookie || ''))?.[1] || '';
    const [payload,signature,...extra] = token.split('.');
    if (!payload || !signature || extra.length) throw new UnauthorizedException();
    const expected = Buffer.from(this.sign(payload)); const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected,supplied)) throw new UnauthorizedException();
    let session: any;
    try { session = JSON.parse(Buffer.from(payload,'base64url').toString()); } catch { throw new UnauthorizedException(); }
    if (!session?.id || !Number.isFinite(session.exp) || session.exp < Date.now()) throw new UnauthorizedException();
    this.owner(String(session.id));
    if (!(await this.auth.validateUser(session.id))) throw new UnauthorizedException();
    if (!session.sid || !(await this.security.sessionValid(session.id,session.sid))) throw new UnauthorizedException();
    return {ok:true,userId:String(session.id)};
  }
}
