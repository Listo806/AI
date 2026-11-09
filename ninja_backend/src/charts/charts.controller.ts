import { Controller, Get, Post, Req, Res, UseGuards, ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityService } from '../auth/security.service';
import { AuthService } from '../auth/auth.service';
import { createHmac, timingSafeEqual } from 'crypto';
import { ChartsSubscriptionService } from './charts-subscription.service';
import { Body, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('charts')
export class ChartsController {
  constructor(private readonly security: SecurityService, private readonly auth: AuthService, private readonly subscriptions: ChartsSubscriptionService) {}
  private secret() {
    const secret = process.env.CHARTS_SESSION_SECRET;
    if (!secret || secret.length < 32) throw new ServiceUnavailableException('Charts session secret is not configured');
    return secret;
  }
  @Post('trial/start') @UseGuards(JwtAuthGuard)
  startTrial(@Req() req:any) { return this.subscriptions.startTrial(String(req.user.id)); }
  @Get('entitlement') @UseGuards(JwtAuthGuard)
  entitlement(@Req() req:any) { return this.subscriptions.access(String(req.user.id)); }
  @Post('checkout') @UseGuards(JwtAuthGuard)
  checkout(@Req() req:any,@Body() body:{billing:string}) {return this.subscriptions.createOrder(String(req.user.id),String(body?.billing||''));}
  @Get('orders') @UseGuards(JwtAuthGuard)
  orders(@Req() req:any) {return this.subscriptions.myOrders(String(req.user.id));}
  @Post('orders/:id/receipt') @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('receipt',{limits:{fileSize:5*1024*1024}}))
  receipt(@Req() req:any,@Param('id') id:string,@Body() body:any,@UploadedFile() receipt?:Express.Multer.File) {return this.subscriptions.submitReceipt(String(req.user.id),id,String(body?.bankTransactionReference||''),receipt);}
  @Get('admin/orders') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN)
  adminOrders(@Query('status') status?:string) {return this.subscriptions.adminOrders(status);}
  @Get('admin/orders/:id/receipt') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN)
  async adminReceipt(@Param('id') id:string,@Res() res:any) {const r=await this.subscriptions.adminReceipt(id);res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',r.receipt_mime);res.setHeader('Content-Disposition','attachment; filename=receipt');return res.send(r.receipt_data);}
  @Post('admin/orders/:id/review') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN)
  review(@Param('id') id:string,@Req() req:any,@Body() body:any) {return this.subscriptions.review(id,String(req.user.id),body?.approve===true,String(body?.note||''));}
  private sign(payload: string) { return createHmac('sha256', this.secret()).update(payload).digest('base64url'); }
  @Post('session')
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Res({passthrough:true}) res: any) {
    if (!(await this.subscriptions.access(String(req.user?.id || '')).then(x=>x.allowed))) throw new ForbiddenException('Charts subscription or trial required');
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
    if (!(await this.subscriptions.access(String(session.id)).then(x=>x.allowed))) throw new ForbiddenException('Charts subscription or trial required');
    if (!(await this.auth.validateUser(session.id))) throw new UnauthorizedException();
    if (!session.sid || !(await this.security.sessionValid(session.id,session.sid))) throw new UnauthorizedException();
    return {ok:true,userId:String(session.id)};
  }
}
