import { Body, Controller, Delete, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerTwilioService } from './customer-twilio.service';

@Controller('customer-twilio')
export class CustomerTwilioController {
  constructor(private readonly service:CustomerTwilioService){}
  @UseGuards(JwtAuthGuard) @Post('connect') connect(@CurrentUser()u:any,@Query('workspace_id')w:string,@Body()b:any){return this.service.connect(u,w,b)}
  @UseGuards(JwtAuthGuard) @Delete('disconnect') disconnect(@CurrentUser()u:any,@Query('workspace_id')w:string){return this.service.disconnect(u,w)}
  @UseGuards(JwtAuthGuard) @Get('status') status(@CurrentUser()u:any,@Query('workspace_id')w:string){return this.service.status(u,w)}
  @UseGuards(JwtAuthGuard) @Get('numbers') numbers(@CurrentUser()u:any,@Query('workspace_id')w:string){return this.service.numbers(u,w)}
  @UseGuards(JwtAuthGuard) @Post('numbers/refresh') refresh(@CurrentUser()u:any,@Query('workspace_id')w:string){return this.service.syncNumbers(u,w)}
  @UseGuards(JwtAuthGuard) @Post('numbers/select') select(@CurrentUser()u:any,@Query('workspace_id')w:string,@Body()b:any){return this.service.selectNumber(u,w,b)}
  @UseGuards(JwtAuthGuard) @Post('test-call') test(@CurrentUser()u:any,@Query('workspace_id')w:string,@Body()b:any){return this.service.startTest(u,w,b)}
  @UseGuards(JwtAuthGuard) @Get('test-call/:id') testStatus(@CurrentUser()u:any,@Query('workspace_id')w:string,@Param('id')id:string){return this.service.testStatus(u,w,id)}

  private url(req:any){ const proto=String(req.headers['x-forwarded-proto']||req.protocol||'https').split(',')[0].trim(); const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim(); return `${proto}://${host}${req.originalUrl}`; }
  @Post('webhooks/voice') async voice(@Headers('x-twilio-signature')s:string,@Req()req:any,@Res()res:any){const xml=await this.service.voiceWebhook(s,this.url(req),req.body);res.type('text/xml').send(xml)}
  @Post('webhooks/voice-intent') async intent(@Headers('x-twilio-signature')s:string,@Req()req:any,@Res()res:any){const xml=await this.service.voiceIntentWebhook(s,this.url(req),req.body);res.type('text/xml').send(xml)}
  @Post('webhooks/sms') async sms(@Headers('x-twilio-signature')s:string,@Req()req:any,@Res()res:any){const xml=await this.service.smsWebhook(s,this.url(req),req.body);res.type('text/xml').send(xml)}
  @Post('webhooks/test-answer') async answer(@Headers('x-twilio-signature')s:string,@Query('test_id')id:string,@Req()req:any,@Res()res:any){const xml=await this.service.testAnswerWebhook(s,this.url(req),req.body,id);res.type('text/xml').send(xml)}
  @Post('webhooks/call-status') async callback(@Headers('x-twilio-signature')s:string,@Query('test_id')id:string,@Req()req:any,@Res()res:any){await this.service.callStatusWebhook(s,this.url(req),req.body,id);res.status(204).send()}
}
