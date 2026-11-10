// Authenticated chart-display engine. Client OHLC is untrusted and NEVER used for AI evidence.
async function engineResponse(request,env){
 const secret=env.CHARTS_TRUSTED_PROXY_SECRET;
 if(request.method!=='POST')return Response.json({error:'METHOD'},{status:405});
 if(typeof secret!=='string'||secret.length<32||request.headers.get('x-cortexa-proxy-secret')!==secret)return Response.json({error:'UNAUTHORIZED'},{status:401});
 if(!/^[-a-zA-Z0-9_:.@]{1,160}$/.test(request.headers.get('x-cortexa-authenticated-user')||''))return Response.json({error:'UNAUTHORIZED'},{status:401});
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'ORIGIN'},{status:403});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'CONTENT_TYPE'},{status:415});
 const declared=Number(request.headers.get('content-length'));if(declared>900000)return Response.json({error:'TOO_LARGE'},{status:413});
 let bytes=0,text='';try{const reader=request.body.getReader(),decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>900000){await reader.cancel();return Response.json({error:'TOO_LARGE'},{status:413});}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}catch{return Response.json({error:'BODY'},{status:400});}
 try{
 const data=JSON.parse(text);
 if(!data||!Object.hasOwn(Heisenberg.durations,data.frame)||!Array.isArray(data.bars)||data.bars.length>1000||data.bars.length<1)return Response.json({error:'CONTEXT'},{status:400});
 const settings={...Heisenberg.defaults};for(const [k,defaultValue] of Object.entries(settings)){
   if(data.settings?.[k]===undefined)continue;const value=data.settings[k];
   if(typeof defaultValue==='boolean'){if(typeof value!=='boolean')throw Error('SETTING');}
   else if(!Number.isFinite(value)||value<0||value>1000)throw Error('SETTING');
   settings[k]=value;
 }
 const parseBars=(bars,frame)=>{if(!Array.isArray(bars)||bars.length>1000)return null;let last=-Infinity;const result=[];for(const b of bars){if(!b||![b.time,b.open,b.high,b.low,b.close].every(Number.isFinite)||b.time<=last||b.low<=0||b.low>Math.min(b.open,b.close)||b.high<Math.max(b.open,b.close)||b.high<b.low||b.time>Date.now()+86400000||(b.volume!==null&&b.volume!==undefined&&(!Number.isFinite(b.volume)||b.volume<0)))throw Error('BAR');last=b.time;result.push({time:b.time,date:new Date(b.time).toISOString(),endTime:b.time+Heisenberg.durations[frame],open:b.open,high:b.high,low:b.low,close:b.close,volume:b.volume??null});}return result;};
 const bars=parseBars(data.bars,data.frame),frames={};
 for(const [tf,entry] of Object.entries(data.frames||{})){if(!Object.hasOwn(Heisenberg.durations,tf))continue;const valid=parseBars(entry,tf);if(valid)frames[tf]={bars:valid};}
 const output=Heisenberg.compute(bars,frames,data.frame,settings,Date.now());
 return Response.json(output,{headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
 }catch{return Response.json({error:'INVALID_ENGINE_CONTEXT'},{status:400});}
}

module.exports = { engineResponse };
