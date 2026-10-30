import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { EcuadorBankCheckoutService } from './ecuador-bank-checkout.service';
@Controller('ecuador/bank-checkout')
export class EcuadorBankCheckoutController {
  constructor(private readonly checkout:EcuadorBankCheckoutService) {}
  @Get('bank-details') bankDetails(){return this.checkout.bankDetails();}
  @Post('create') @UseGuards(JwtAuthGuard) create(@CurrentUser() u:any,@Body() b:any){return this.checkout.create(u.id,String(b?.planKey||''));}
  @Post(':id/confirm') @UseGuards(JwtAuthGuard) confirm(@CurrentUser() u:any,@Param('id') id:string,@Body() b:any){return this.checkout.confirm(u.id,id,String(b?.bankTransactionReference||''));}
  @Get(':id') @UseGuards(JwtAuthGuard) mine(@CurrentUser() u:any,@Param('id') id:string){return this.checkout.mine(u.id,id);}
  @Get('admin/requests') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN) list(){return this.checkout.list();}
  @Post('admin/:id/review') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN) review(@CurrentUser() u:any,@Param('id') id:string,@Body() b:any){return this.checkout.review(id,u.id,b?.approve===true,String(b?.note||''));}
}
