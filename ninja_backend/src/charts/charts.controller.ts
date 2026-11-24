import { Logger, Controller, Get, Post, Body, Req, Res, UseGuards, ForbiddenException, ServiceUnavailableException, UnauthorizedException, BadRequestException, Query, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityService } from '../auth/security.service';
import { AuthService } from '../auth/auth.service';
import { createHmac, timingSafeEqual } from 'crypto';
import { ChartsSubscriptionService } from './charts-subscription.service';
import { ChartsAiService } from './charts-ai.service';

@Controller('charts')
export class ChartsController {
  constructor(private readonly security: SecurityService, private readonly auth: AuthService, private readonly chartsAi: ChartsAiService, private readonly subscriptions: ChartsSubscriptionService) {}

  private readonly marketLogger = new Logger('ChartsMarket');

  // Browser-safe market-data relay: provider credentials and CORS stay server-side.
  // Only supported symbols/intervals can be requested; never proxy arbitrary URLs.
  private readonly marketSymbols = new Set(['USD/JPY','XAG/USD','GBP/JPY','XAU/USD']);
  private readonly marketIntervals: Record<string,string> = {'1min':'1m','5min':'5m','15min':'15m','30min':'30m','1h':'1h','4h':'4h','1day':'1d'};
  private async marketJson(url: URL): Promise<any> {
    let upstream: Response;
    try { upstream = await fetch(url, {signal: AbortSignal.timeout(12000), redirect:'error',headers:{accept:'application/json'}}); }
    catch (error) {
      this.marketLogger.error(`Upstream request failed: ${url.pathname} (${error instanceof Error ? error.message : String(error)})`);
      throw new ServiceUnavailableException('Market data provider temporarily unavailable');
    }
    if (!upstream.ok) {
      this.marketLogger.error(`Upstream returned HTTP ${upstream.status} for ${url.pathname}`);
      throw new HttpException({error:'Market data provider unavailable'},upstream.status===429?429:503);
    }
    if (!(upstream.headers.get('content-type')||'').toLowerCase().includes('json')) {
      this.marketLogger.error(`Upstream returned non-JSON content (${upstream.headers.get('content-type') || 'unknown'}) for ${url.pathname}`);
      throw new ServiceUnavailableException('Market data provider returned a non-JSON response');
    }
    const raw=await upstream.text();
    if(raw.length>2000000)throw new ServiceUnavailableException('Market data response too large');
    try {return JSON.parse(raw);}catch {
      this.marketLogger.error(`Upstream returned invalid JSON for ${url.pathname}`);
      throw new ServiceUnavailableException('Market data provider returned invalid JSON');
    }
  }
  @Get('market/candles')
  async marketCandles(@Query('symbol') symbol: string, @Query('interval') interval: string, @Res({passthrough:true}) res:any) {
    if(!this.marketSymbols.has(symbol)||!Object.prototype.hasOwnProperty.call(this.marketIntervals,interval))
      throw new BadRequestException('Unsupported market symbol or interval');
    res.setHeader('Cache-Control','public, max-age=15');
    const url=new URL('https://biquote.io/api/'+symbol.replace('/','')+'/ohlc');
    url.searchParams.set('interval',this.marketIntervals[interval]);url.searchParams.set('limit','1000');
    return this.marketJson(url);
  }
  @Get('market/quotes')
  async marketQuotes(@Query('symbol') requested: string|string[], @Res({passthrough:true}) res:any) {
    const symbols=[...new Set((Array.isArray(requested)?requested:[requested]).filter(Boolean))];
    if(!symbols.length||symbols.length>4||symbols.some(s=>!this.marketSymbols.has(s)))
      throw new BadRequestException('Unsupported market symbols');
    res.setHeader('Cache-Control','no-store');
    const url=new URL('https://biquote.io/api/latest');
    for(const symbol of symbols)url.searchParams.append('symbols',symbol.replace('/',''));
    const raw=await this.marketJson(url);
    const rows=Array.isArray(raw)?raw:Array.isArray(raw?.ticks)?raw.ticks:Array.isArray(raw?.data)?raw.data:[];
    const quotes=rows.flatMap((q:any)=>{
      const symbol=symbols.find(s=>s.replace('/','')===q?.symbol);
      const bid=Number(q?.bid),ask=Number(q?.ask),timestamp=Date.parse(q?.timestamp);
      return symbol&&bid>0&&ask>=bid&&Number.isFinite(timestamp)
        ?[{symbol,bid,ask,price:(bid+ask)/2,timestamp,dayDiffPercent:Number.isFinite(Number(q.dayDiffPercent))?Number(q.dayDiffPercent):null}]:[];
    });
    if(!quotes.length)throw new ServiceUnavailableException('No valid market quotes available');
    return {quotes};
  }
  private secret() {
    const secret = process.env.CHARTS_SESSION_SECRET;
    if (!secret || secret.length < 32) throw new ServiceUnavailableException('Charts session secret is not configured');
    return secret;
  }
  private async owner(id: string) {
    const allowed = process.env.CHARTS_OWNER_USER_ID;
    if (allowed && id===allowed) return;
    const access=await this.subscriptions.access(id);
    if (!access.paidActive) throw new ForbiddenException('Charts requires an active paid subscription');
  }
  private sign(payload: string) { return createHmac('sha256', this.secret()).update(payload).digest('base64url'); }
  @Post('session')
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Res({passthrough:true}) res: any) {
    await this.owner(String(req.user?.id || ''));
    const sid = req.user?.sessionId || req.user?.sid || null;
    if (!sid) throw new UnauthorizedException('Please sign in again to open Charts');
    // Recheck owner and session at the validation endpoint on every request.
    const payload = Buffer.from(JSON.stringify({id:req.user.id, sid, exp:Date.now()+10*60*1000})).toString('base64url');
    const token = `${payload}.${this.sign(payload)}`;
    res.setHeader('Set-Cookie', `cortexa_charts=${token}; Path=/charts; Domain=.cortexaaicrm.com; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    res.setHeader('Cache-Control','no-store');
    return {ok:true,redirect:'/charts/app/'};
  }
  private async validateChartsSession(req: any): Promise<string> {
    const token = /(?:^|;\s*)cortexa_charts=([^;]+)/.exec(String(req.headers.cookie || ''))?.[1] || '';
    const [payload,signature,...extra] = token.split('.');
    if (!payload || !signature || extra.length) throw new UnauthorizedException();
    const expected = Buffer.from(this.sign(payload)); const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected,supplied)) throw new UnauthorizedException();
    let session: any;
    try { session = JSON.parse(Buffer.from(payload,'base64url').toString()); } catch { throw new UnauthorizedException(); }
    if (!session?.id || !Number.isFinite(session.exp) || session.exp < Date.now()) throw new UnauthorizedException();
    await this.owner(String(session.id));
    if (!(await this.auth.validateUser(session.id))) throw new UnauthorizedException();
    if (!session.sid || !(await this.security.sessionValid(session.id,session.sid))) throw new UnauthorizedException();
    return String(session.id);
  }
  @Get('validate')
  async validate(@Req() req: any, @Res({passthrough:true}) res: any) {
    res.setHeader('Cache-Control','no-store');
    return {ok:true,userId:await this.validateChartsSession(req)};
  }
  // Private Netlify-to-Render analysis endpoint. Never expose this secret to the browser.
  @Post('analysis/internal')
  async internalAnalysis(@Req() req: any, @Body() body: unknown) {
    const expected = process.env.CHARTS_TRUSTED_PROXY_SECRET;
    const supplied = String(req.headers['x-cortexa-proxy-secret'] || '');
    if (!expected || expected.length < 32 || supplied.length !== expected.length ||
        !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied)))
      throw new UnauthorizedException('Trusted Charts proxy required');
    const user = String(req.headers['x-cortexa-authenticated-user'] || '');
    if (!user || !/^[-a-zA-Z0-9_:.@]{1,160}$/.test(user)) throw new UnauthorizedException();
    await this.owner(user);
    return this.chartsAi.analyze(body, user);
  }
  @Post('analysis')
  async analysis(@Req() req: any, @Res() res: any, @Body() body: unknown) {
    return this.proxyCharts(req,res,body,'analysis');
  }
  @Post('engine')
  async engine(@Req() req: any, @Res() res: any, @Body() body: unknown) {
    return this.proxyCharts(req,res,body,'engine');
  }
  private async proxyCharts(req: any, res: any, body: unknown, endpoint: 'analysis'|'engine') {
    res.setHeader('Cache-Control','no-store');
    const userId=await this.validateChartsSession(req);
    // Browser calls must be same-origin; never trust client-supplied identity headers.
    const origin=String(req.headers.origin||'');
    if(origin!=='https://www.cortexaaicrm.com' && origin!=='https://cortexaaicrm.com')
      throw new ForbiddenException('Invalid Charts request origin');
    const referer=String(req.headers.referer||'');
    if(!referer.startsWith(origin+'/charts/'))throw new ForbiddenException('Invalid Charts referrer');
    const raw=JSON.stringify(body);
    if(!raw || raw==='undefined' || Buffer.byteLength(raw,'utf8')>(endpoint==='engine'?900000:180000))throw new BadRequestException('Invalid analysis request size');
    const secret=process.env.CHARTS_TRUSTED_PROXY_SECRET;
    const upstream=process.env.CHARTS_WORKER_ORIGIN;
    if(!secret||secret.length<32||!upstream)throw new ServiceUnavailableException('Charts AI proxy is not configured');
    let target:URL;
    try {
      target=new URL(upstream);
      if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||target.pathname!=='/')
        throw Error();
    }catch{throw new ServiceUnavailableException('Invalid Charts Worker origin');}
    target.pathname='/api/'+endpoint;
    let response:Response;
    try{
      response=await fetch(target,{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{
        'content-type':'application/json',
        'origin':target.origin,
        'x-cortexa-proxy-secret':secret,
        'x-cortexa-authenticated-user':userId,
      },body:raw});
    }catch{throw new ServiceUnavailableException('Charts AI is temporarily unavailable');}
    // Bound upstream response even if a gateway or edge is compromised.
    const reader=response.body?.getReader();
    if(!reader)throw new ServiceUnavailableException('Empty Charts AI response');
    const chunks:Uint8Array[]=[];let bytes=0;
    try{
      while(true){
        const {done,value}=await reader.read();
        if(done)break;
        bytes+=value.byteLength;
        if(bytes>(endpoint==='engine'?600000:45000))throw new ServiceUnavailableException('Charts AI response too large');
        chunks.push(value);
      }
    }finally{await reader.cancel().catch(()=>undefined);}
    const output=Buffer.concat(chunks.map(c=>Buffer.from(c)));
    res.status(response.status);
    res.type('application/json');
    return res.send(output);
  }
}
