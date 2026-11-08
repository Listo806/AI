'use strict';
const Heisenberg = {
  defaults: {tramaLength:20,snakeSmooth:6,snakeWidthAtr:.75,cooldownBars:20,bbLength:20,bbMult:2,rsiLength:14,rsiMaLength:9,vwapDevMult:1.5,rocLength:3,candlePowerMult:.6,useMTFFilter:true,useRsiRegimeFilter:true,bullRsiThreshold:45,bearRsiThreshold:55,showFullAlignment:true},
  durations: {'1min':60000,'5min':300000,'15min':900000,'30min':1800000,'1h':3600000,'4h':14400000,'1day':86400000},
  ema(values,length) {
    let previous=null;
    return values.map(value=>{if(!Number.isFinite(value))return null;previous=previous===null?value:previous+(2/(length+1))*(value-previous);return previous;});
  },
  atr(bars,length=14) {
    const result=Array(bars.length).fill(null);let sum=0,previous=null;
    bars.forEach((bar,index)=>{const range=index?Math.max(bar.high-bar.low,Math.abs(bar.high-bars[index-1].close),Math.abs(bar.low-bars[index-1].close)):bar.high-bar.low;if(index<length){sum+=range;if(index===length-1)previous=sum/length;}else previous=(previous*(length-1)+range)/length;result[index]=previous;});return result;
  },
  sessionVWAP(bars) {
    let session='',volume=0,total=0,missing=false;
    return bars.map(bar=>{const day=bar.date.slice(0,10);if(day!==session){session=day;volume=0;total=0;missing=false;}if(!Number.isFinite(bar.volume))missing=true;if(missing)return null;volume+=bar.volume;total+=bar.close*bar.volume;return volume>0?total/volume:null;});
  },
  trendSeries(bars,config) {return {trama:this.ema(bars.map(b=>b.close),config.tramaLength),vwap:this.sessionVWAP(bars)};},
  compute(bars,frameEntries,frame,settings={},now=Date.now()) {
    const config={...this.defaults,...settings},close=bars.map(b=>b.close),trama=this.ema(close,config.tramaLength),vwap=this.sessionVWAP(bars),atr=this.atr(bars),rsi=Indicators.rsi(close,config.rsiLength),rsiMA=Indicators.sma(rsi,config.rsiMaLength),bb=Indicators.bollinger(close,config.bbLength,config.bbMult);
    const center=this.ema(trama.map((value,i)=>Number.isFinite(vwap[i])?(value+vwap[i])/2:null),config.snakeSmooth);
    const upper=center.map((v,i)=>Number.isFinite(v)&&Number.isFinite(atr[i])?v+atr[i]*config.snakeWidthAtr:null),lower=center.map((v,i)=>Number.isFinite(v)&&Number.isFinite(atr[i])?v-atr[i]*config.snakeWidthAtr:null);
    const deviation=bb.upper.map((v,i)=>v===null?null:(v-bb.middle[i])/config.bbMult);
    const vwapUpper=vwap.map((v,i)=>Number.isFinite(v)&&Number.isFinite(deviation[i])?v+deviation[i]*config.vwapDevMult:null),vwapLower=vwap.map((v,i)=>Number.isFinite(v)&&Number.isFinite(deviation[i])?v-deviation[i]*config.vwapDevMult:null);
    const frames=['5min','15min','30min','1h','4h'];
    const series=Object.fromEntries(['1min',...frames].map(tf=>{const entry=frameEntries[tf];return [tf,entry&&!entry.reference?{bars:entry.bars,...this.trendSeries(entry.bars,config)}:null];}));
    function state(tf,at){const data=series[tf];if(!data)return 'Unavailable';let low=0,high=data.bars.length-1,found=-1;while(low<=high){const mid=(low+high)>>1;if(data.bars[mid].time+Heisenberg.durations[tf]<=at){found=mid;low=mid+1;}else high=mid-1;}if(found<0||at-(data.bars[found].time+Heisenberg.durations[tf])>Heisenberg.durations[tf]*3)return 'Unavailable';const a=data.trama[found],b=data.vwap[found];if(!Number.isFinite(a)||!Number.isFinite(b))return 'Unavailable';return a>b?'Bullish':a<b?'Bearish':'Neutral';}
    const signals=[],alignment=[],bias=trama.map((v,i)=>!Number.isFinite(vwap[i])?'Neutral':v>vwap[i]?'Bullish':v<vwap[i]?'Bearish':'Neutral');let lastBuy=null,lastSell=null,previousFullBull=false,previousFullBear=false;
    bars.forEach((bar,i)=>{const at=bar.time+(this.durations[frame]||86400000);if(at>now)return;const states=frames.map(tf=>state(tf,at)),bullCount=states.filter(v=>v==='Bullish').length,bearCount=states.filter(v=>v==='Bearish').length,fullBull=bullCount===5,fullBear=bearCount===5;
      if(config.showFullAlignment&&fullBull&&!previousFullBull)alignment.push({index:i,side:'BUY'});if(config.showFullAlignment&&fullBear&&!previousFullBear)alignment.push({index:i,side:'SELL'});previousFullBull=fullBull;previousFullBear=fullBear;
      if(!i||!Number.isFinite(center[i])||!Number.isFinite(center[i-1])||!Number.isFinite(atr[i]))return;
      const bull=bias[i]==='Bullish',bear=bias[i]==='Bearish',bullTrend=bull&&center[i]>center[i-1]&&bar.close>center[i],bearTrend=bear&&center[i]<center[i-1]&&bar.close<center[i];
      const roc=i>=config.rocLength?(bar.close/bars[i-config.rocLength].close-1)*100:0,strong=Math.abs(bar.close-bar.open)>atr[i]*config.candlePowerMult;
      const buyRaw=(bullTrend&&(bar.close>bars[i-1].close||bar.low<=center[i]))||(bull&&roc>0&&strong&&bar.close>center[i]);
      const sellRaw=(bearTrend&&(bar.close<bars[i-1].close||bar.high>=center[i]))||(bear&&roc<0&&strong&&bar.close<center[i]);
      if(buyRaw&&(!config.useMTFFilter||bullCount>=3)&&(!config.useRsiRegimeFilter||(Number.isFinite(rsi[i])&&rsi[i]>config.bullRsiThreshold))&&(lastBuy===null||i-lastBuy>config.cooldownBars)){signals.push({index:i,side:'BUY'});lastBuy=i;}
      if(sellRaw&&(!config.useMTFFilter||bearCount>=3)&&(!config.useRsiRegimeFilter||(Number.isFinite(rsi[i])&&rsi[i]<config.bearRsiThreshold))&&(lastSell===null||i-lastSell>config.cooldownBars)){signals.push({index:i,side:'SELL'});lastSell=i;}
    });
    return {trama,vwap,atr,rsi,rsiMA,bb,center,upper,lower,vwapUpper,vwapLower,bias,signals,alignment,table:Object.fromEntries(['1min',...frames].map(tf=>[tf,state(tf,now)]))};
  }
};
if(typeof module!=='undefined')module.exports=Heisenberg;
