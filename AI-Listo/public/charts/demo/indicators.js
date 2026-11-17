'use strict';
const Indicators = {
  sma(values, period) {
    return values.map((_, i) => {
      if (i < period - 1) return null;
      const group = values.slice(i - period + 1, i + 1);
      return group.every(Number.isFinite) ? group.reduce((a, b) => a + b, 0) / period : null;
    });
  },
  movingAverage(values,period,type='SMA') {
    if(type==='SMA')return this.sma(values,period);
    let previous=null;const finite=[];
    return values.map(value=>{
      if(!Number.isFinite(value))return null;
      finite.push(value);if(finite.length>period)finite.shift();
      if(type==='WMA')return finite.length<period?null:finite.reduce((s,v,i)=>s+v*(i+1),0)/(period*(period+1)/2);
      if(type==='RMA'&&previous===null){if(finite.length<period)return null;previous=finite.reduce((s,v)=>s+v,0)/period;}
      else previous=previous===null?value:previous+(type==='RMA'?1/period:2/(period+1))*(value-previous);
      return previous;
    });
  },
  bollinger(values, period, multiplier) {
    const middle = this.sma(values, period);
    const deviation = middle.map((mean, i) => mean === null ? null : Math.sqrt(values.slice(i - period + 1, i + 1).reduce((sum, value) => sum + (value - mean) ** 2, 0) / period));
    return {middle, upper: middle.map((v, i) => v === null ? null : v + multiplier * deviation[i]), lower: middle.map((v, i) => v === null ? null : v - multiplier * deviation[i])};
  },
  bollingerAdvanced(bars, period, multiplier, type='SMA', source='close') {
    const values=bars.map(b=>source==='hl2'?(b.high+b.low)/2:source==='hlc3'?(b.high+b.low+b.close)/3:source==='ohlc4'?(b.open+b.high+b.low+b.close)/4:b[source]);
    const sma=this.sma(values,period);let previous=null;
    const middle=values.map((value,i)=>{
      if(type==='SMA')return sma[i];
      if(type==='EMA'){previous=previous===null?value:previous+2/(period+1)*(value-previous);return previous;}
      if(type==='SMMA (RMA)'){if(previous===null){if(sma[i]===null)return null;previous=sma[i];}else previous+=(value-previous)/period;return previous;}
      if(i<period-1)return null;
      const group=values.slice(i-period+1,i+1);
      if(type==='WMA')return group.reduce((s,v,j)=>s+v*(j+1),0)/(period*(period+1)/2);
      const volumes=bars.slice(i-period+1,i+1).map(b=>b.volume);if(volumes.some(v=>!Number.isFinite(v)||v<0))return null;
      const total=volumes.reduce((s,v)=>s+v,0);return total>0?group.reduce((s,v,j)=>s+v*volumes[j],0)/total:null;
    });
    const dev=sma.map((mean,i)=>mean===null?null:Math.sqrt(values.slice(i-period+1,i+1).reduce((s,v)=>s+(v-mean)**2,0)/period));
    return {middle,upper:middle.map((v,i)=>v===null||dev[i]===null?null:v+multiplier*dev[i]),lower:middle.map((v,i)=>v===null||dev[i]===null?null:v-multiplier*dev[i])};
  },
  vwapBands(bars, anchor, period, multiplier) {
    const middle = this.vwap(bars, anchor);
    const deviations = this.bollinger(bars.map(bar => bar.close), period, multiplier);
    const upper = middle.map((value, index) => Number.isFinite(value) && deviations.upper[index] !== null
      ? value + deviations.upper[index] - deviations.middle[index] : null);
    const lower = middle.map((value, index) => Number.isFinite(value) && deviations.lower[index] !== null
      ? value + deviations.lower[index] - deviations.middle[index] : null);
    return { middle, upper, lower };
  },
  autoVwap(bars, settings, frame) {
    const n=bars.length, middle=Array(n).fill(null), deviation=Array(n).fill(null);
    if(!n)return {middle,deviation};
    let anchor=settings.anchor==='auto'?(frame==='1day'?'month':'session'):settings.anchor;
    const group=date=>{const d=new Date(date),year=d.getUTCFullYear(),month=d.getUTCMonth();
      if(anchor==='session'){
        const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:settings.sessionTimezone||'Etc/UTC',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
        const [h,m]=(settings.sessionStart||'00:00').split(':').map(Number);const localDay=new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)));
        if(Number(parts.hour)*60+Number(parts.minute)<h*60+m)localDay.setUTCDate(localDay.getUTCDate()-1);
        return localDay.toISOString().slice(0,10);
      }
      if(anchor==='week'){d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
      if(anchor==='month')return date.slice(0,7);
      if(anchor==='quarter')return year+'-'+Math.floor(month/3);
      if(anchor==='year')return String(year);
      if(anchor==='decade')return String(Math.floor(year/10));
      if(anchor==='century')return String(Math.floor(year/100));return 'history';};
    let first=0;
    if(['high','low','volume'].includes(anchor)){
      first=Math.max(0,n-settings.length);
      for(let i=first+1;i<n;i++)if(anchor==='high'?bars[i].high>=bars[first].high:anchor==='low'?bars[i].low<=bars[first].low:bars[i].volume>=bars[first].volume)first=i;
    }else{const lastGroup=group(bars[n-1].date);while(first<n&&group(bars[first].date)!==lastGroup)first++;}
    let weight=0,mean=0,m2=0,missing=false;
    for(let i=first;i<n;i++){
      const b=bars[i],v=b.volume;
      if(!Number.isFinite(v)||v<0)missing=true;
      if(missing)continue;
      const source=settings.source;
      const price=source==='hlc3'?(b.high+b.low+b.close)/3:source==='hl2'?(b.high+b.low)/2:source==='ohlc4'?(b.open+b.high+b.low+b.close)/4:b[source];
      if(v>0){const total=weight+v,delta=price-mean;mean+=delta*v/total;m2+=v*delta*(price-mean);weight=total;}
      if(weight>0){middle[i]=mean;deviation[i]=settings.mode==='percentage'?mean*.01:Math.sqrt(Math.max(0,m2/weight));}
    }
    return {middle,deviation};
  },
  // LuxAlgo TRAMA: rolling-extrema changes, squared SMA regularity, recursive AMA.
  // Source attribution: LuxAlgo, Trend Regularity Adaptive Moving Average (Pine v4).
  trama(bars, length, source='close') {
    const events=[],result=[];let previousHigh=null,previousLow=null,previous=null;
    for(let i=0;i<bars.length;i++){
      const window=bars.slice(Math.max(0,i-length+1),i+1);
      const high=Math.max(...window.map(b=>b.high)),low=Math.min(...window.map(b=>b.low));
      events.push(previousHigh!==null&&(high>previousHigh||low<previousLow)?1:0);
      const b=bars[i],price=source==='hl2'?(b.high+b.low)/2:source==='hlc3'?(b.high+b.low+b.close)/3:source==='ohlc4'?(b.open+b.high+b.low+b.close)/4:b[source];
      const tc=i>=length-1?(events.slice(i-length+1,i+1).reduce((a,v)=>a+v,0)/length)**2:null;
      const value=tc===null||previous===null?price:previous+tc*(price-previous);
      result.push(value);previous=value;previousHigh=high;previousLow=low;
    }
    return result;
  },
  rsi(values, period) {
    const result = Array(values.length).fill(null);
    if (values.length <= period) return result;
    let gain = 0, loss = 0;
    for (let i = 1; i <= period; i++) {const change = values[i] - values[i - 1]; gain += Math.max(change, 0); loss += Math.max(-change, 0);}
    gain /= period; loss /= period;
    const value = () => loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
    result[period] = value();
    for (let i = period + 1; i < values.length; i++) {const change = values[i] - values[i - 1]; gain = (gain * (period - 1) + Math.max(change, 0)) / period; loss = (loss * (period - 1) + Math.max(-change, 0)) / period; result[i] = value();}
    return result;
  },
  vwap(bars, anchor) {
    let priceVolume = 0, volume = 0, previousGroup = '', missing = false;
    return bars.map(bar => {
      const group = anchor === 'month' ? bar.date.slice(0, 7) : anchor === 'session' ? bar.date.slice(0, 10) : 'history';
      if (group !== previousGroup) {priceVolume = 0; volume = 0; missing = false; previousGroup = group;}
      if (!Number.isFinite(bar.volume) || bar.volume < 0) missing = true;
      if (missing) return null;
      priceVolume += bar.close * bar.volume;
      volume += bar.volume;
      return volume > 0 ? priceVolume / volume : null;
    });
  }
};
if (typeof module !== 'undefined') module.exports = Indicators;
