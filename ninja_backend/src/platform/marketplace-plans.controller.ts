import { Body, Controller, Get, Post, Param, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MarketplacePlansService } from './marketplace-plans.service';
@Controller('marketplace/plans')
export class MarketplacePlansController {
  constructor(private readonly plans:MarketplacePlansService){}
  @Get() list(){return this.plans.plans()}
  @Get('mine') @UseGuards(JwtAuthGuard) mine(@CurrentUser() user:any){return this.plans.mine(user.id)}
  @Get('payment-config') config(){return this.plans.paymentConfig()}
  @Post('checkout') @UseGuards(JwtAuthGuard) checkout(@CurrentUser() user:any,@Body() body:{enrollmentId:string;token:string}){return this.plans.checkout(user.id,String(body?.enrollmentId||''),String(body?.token||''))}
  @Get('payment/:id') @UseGuards(JwtAuthGuard) payment(@CurrentUser() user:any,@Param('id') id:string){return this.plans.paymentStatus(user.id,id)}
  @Post('nuvei-callback') callback(@Body() body:any,@Headers('x-nuvei-token') token?:string){return this.plans.handlePaymentCallback(body,token)}
  @Post('enroll') @UseGuards(JwtAuthGuard) enroll(@CurrentUser() user:any,@Body() body:{planKey:string}){return this.plans.enroll(user.id,String(body?.planKey||''))}
}
