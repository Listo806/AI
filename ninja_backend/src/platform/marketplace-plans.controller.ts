import { Body, Controller, Get, Post, Param, Headers, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MarketplacePlansService } from './marketplace-plans.service';
@Controller('marketplace/plans')
export class MarketplacePlansController {
  constructor(private readonly plans:MarketplacePlansService){}
  @Get() list(){return this.plans.plans()}
  @Get('mine') @UseGuards(JwtAuthGuard) mine(@CurrentUser() user:any){return this.plans.mine(user.id)}
  @Get('bank-details') bankDetails(){return this.plans.bankDetails()}
  @Post('bank-transfer') @UseGuards(JwtAuthGuard) bankTransfer(@CurrentUser() user:any,@Body() body:{enrollmentId:string}){return this.plans.bankTransfer(user.id,String(body?.enrollmentId||''))}
  @Post('bank-confirmation') @UseGuards(JwtAuthGuard) bankConfirmation(@CurrentUser() user:any,@Body() body:any){return this.plans.submitBankConfirmation(user.id,String(body?.enrollmentId||''),String(body?.bankTransactionReference||''),body?.note)}
  @Get('bank-confirmation/:id') @UseGuards(JwtAuthGuard) bankStatus(@CurrentUser() user:any,@Param('id') id:string){return this.plans.bankRequestStatus(user.id,id)}
  @Get('payment-config') config(){return this.plans.paymentConfig()}
  @Post('checkout') @UseGuards(JwtAuthGuard) checkout(@CurrentUser() user:any,@Body() body:{enrollmentId:string;token:string}){return this.plans.checkout(user.id,String(body?.enrollmentId||''),String(body?.token||''))}
  @Get('payment/:id') @UseGuards(JwtAuthGuard) payment(@CurrentUser() user:any,@Param('id') id:string){return this.plans.paymentStatus(user.id,id)}
  @Post('nuvei-callback') callback(@Body() body:any,@Headers('x-nuvei-token') token?:string){return this.plans.handlePaymentCallback(body,token)}
  @Post('cancel') @UseGuards(JwtAuthGuard) cancel(@CurrentUser() user:any,@Body() body:{enrollmentId:string}){return this.plans.cancel(user.id,String(body?.enrollmentId||''))}
  @Get('billing-history') @UseGuards(JwtAuthGuard) history(@CurrentUser() user:any){return this.plans.billingHistory(user.id)}
  @Post('renew') @UseGuards(JwtAuthGuard) renew(@CurrentUser() user:any,@Body() body:{enrollmentId:string}){return this.plans.renew(user.id,String(body?.enrollmentId||''))}
  @Post('resume') @UseGuards(JwtAuthGuard) resume(@CurrentUser() user:any,@Body() body:{enrollmentId:string}){return this.plans.resume(user.id,String(body?.enrollmentId||''))}
  @Post('enroll') @UseGuards(JwtAuthGuard) enroll(@CurrentUser() user:any,@Body() body:{planKey:string}){return this.plans.enroll(user.id,String(body?.planKey||''))}
}
