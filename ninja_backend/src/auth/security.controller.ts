import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { SecurityService } from './security.service';

@Controller('security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  constructor(private readonly security: SecurityService) {}
  private meta(req:any){ return { ip: String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(), userAgent:req.headers['user-agent'] || null, location:req.headers['cf-ipcity'] || null }; }
  @Get('status') status(@CurrentUser() u:any){ return this.security.status(u.id); }
  @Post('2fa/setup') setup(@CurrentUser() u:any){ return this.security.begin2fa(u); }
  @Post('2fa/confirm') confirm(@CurrentUser() u:any,@Body() b:any,@Req() req:any){ return this.security.confirm2fa(u.id,b.code,this.meta(req)); }
  @Post('2fa/disable') disable(@CurrentUser() u:any,@Body() b:any,@Req() req:any){ return this.security.disable2fa(u.id,b.code,this.meta(req)); }
  @Post('recovery-codes') recovery(@CurrentUser() u:any,@Body() b:any,@Req() req:any){ return this.security.generateRecoveryCodes(u.id,b.code,this.meta(req)); }
  @Get('sessions') sessions(@CurrentUser() u:any){ return this.security.sessions(u.id,u.sessionId); }
  @Delete('sessions/:id') revoke(@CurrentUser() u:any,@Param('id') id:string){ return this.security.revokeSession(u.id,id,u.sessionId); }
  @Post('sessions/revoke-others') revokeOthers(@CurrentUser() u:any){ return this.security.revokeOthers(u.id,u.sessionId); }
  @Get('activity') activity(@CurrentUser() u:any,@Query('limit') limit?:string){ return this.security.recentActivity(u.id,Number(limit)||20); }
}
