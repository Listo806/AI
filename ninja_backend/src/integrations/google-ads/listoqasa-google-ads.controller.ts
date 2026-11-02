import { Controller, Get, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { ListoqasaGoogleAdsService } from './listoqasa-google-ads.service';

@Controller('integrations/listoqasa/google-ads')
@UseGuards(JwtAuthGuard)
export class ListoqasaGoogleAdsController {
  constructor(private readonly service: ListoqasaGoogleAdsService) {}
  private requireAdmin(req: any) {
    const role = req.user?.role;
    if (!['owner', 'admin', 'super_admin'].includes(role)) throw new ForbiddenException('Administrator access required');
  }
  @Get('connect') connect(@Req() req: any) { this.requireAdmin(req); return this.service.connectUrl(); }
  @Public() @Get('callback') callback(@Query('code') code: string, @Query('state') state: string) {
    return this.service.callback(code, state);
  }
  @Get('status') status(@Req() req: any) { this.requireAdmin(req); return this.service.status(); }
  @Get('verify-purchase-action') verify(@Req() req: any) { this.requireAdmin(req); return this.service.verifyConversionAction(); }
}
