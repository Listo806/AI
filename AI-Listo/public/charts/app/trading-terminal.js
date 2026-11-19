'use strict';
(()=>{
 if(window.ChartEmbed)return;
 const $=id=>document.getElementById(id),make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const anchor=$('chartFullscreenButton')||$('viewChartsButton');if(!anchor)return;
 const toggle=make('button','view-charts-button','▤ Terminal');toggle.id='terminalToggle';toggle.type='button';toggle.setAttribute('aria-controls','tradingTerminal');anchor.after(toggle);
 const terminal=make('section','trading-terminal');terminal.id='tradingTerminal';terminal.setAttribute('aria-label','Trading terminal');terminal.hidden=true;
 const divider=make('div','terminal-divider');divider.tabIndex=0;divider.setAttribute('role','separator');divider.setAttribute('aria-orientation','horizontal');divider.setAttribute('aria-label','Resize trading terminal');divider.title='Drag to resize. Arrow Up or Down adjusts height.';divider.append(make('span','','═'));
 const header=make('div','terminal-header'),collapse=make('button','terminal-collapse','▾');collapse.type='button';collapse.title='Close Terminal';collapse.setAttribute('aria-label','Close Terminal');header.append(collapse);
 const tabs=make('div','terminal-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Terminal views');const buttons=new Map();
 const badge=make('span','terminal-demo-badge','DEMO PREVIEW · SAMPLE DATA');badge.title='No broker connected. These are sample orders only.';
 header.append(tabs,badge);
 const viewport=make('div','terminal-table-wrap');viewport.id='terminalTable';viewport.setAttribute('role','tabpanel');viewport.tabIndex=0;
 const table=make('table','terminal-table');viewport.append(table);
 const summary=make('div','terminal-account-summary');summary.setAttribute('aria-label','Sample account summary');
 const notice=make('div','terminal-notice');notice.setAttribute('role','status');notice.textContent='Sample orders only — MetaTrader is not connected.';
 terminal.append(divider,header,viewport,notice);document.querySelector('article').append(terminal);
 let opened=false,active='positions',height=275;try{const n=Number(localStorage.getItem('cortexa-terminal-height'));if(n>=150&&n<=1000)height=n;}catch{}
 // Deliberately fixed sample data: never sent to a broker or priced from a live feed.
 const positions=[
 {id:10004521,time:'09:14:26',type:'Buy',size:.50,symbol:'USDJPY',entry:'158.267',sl:'158.050',tp:'158.650',price:'158.311',commission:-3.5,swap:-.4,profit:22,margin:200},
 {id:10004522,time:'09:27:11',type:'Sell',size:1,symbol:'XAGUSD',entry:'53.480',sl:'53.900',tp:'52.900',price:'53.192',commission:-7,swap:-.2,profit:288,margin:300},
 {id:10004523,time:'09:33:47',type:'Buy',size:.30,symbol:'XAUUSD',entry:'4118.600',sl:'4110.000',tp:'4135.000',price:'4126.175',commission:-2.1,swap:-.9,profit:227.25,margin:350},
 {id:10004524,time:'09:41:02',type:'Sell',size:.80,symbol:'EURUSD',entry:'1.08372',sl:'1.08650',tp:'1.07800',price:'1.08431',commission:-5.6,swap:-.4,profit:-47.2,margin:200},
 {id:10004525,time:'09:46:18',type:'Buy',size:.40,symbol:'GBPJPY',entry:'211.665',sl:'211.200',tp:'212.600',price:'211.776',commission:-2.8,swap:-1.1,profit:41.6,margin:150}
 ];
 const pending=[{id:10004526,time:'09:50:00',type:'Buy limit',size:.20,symbol:'EURUSD',entry:'1.08000',sl:'1.07700',tp:'1.08600',price:'1.08431',commission:0,swap:0,profit:0}];const history=[];let balance=10000;
 const money=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});const net=r=>r.profit+r.commission+r.swap;
 function bounds(){const article=document.querySelector('article'),controls=$('chartIndicatorControls'),top=controls.getBoundingClientRect().bottom,room=article.getBoundingClientRect().bottom-top;return {min:Math.min(150,Math.max(100,room-100)),max:Math.max(150,room-125)};}
 function size(value){const {min,max}=bounds();const current=Math.max(min,Math.min(max,value));terminal.style.height=current+'px';divider.setAttribute('aria-valuemin',String(Math.round(min)));divider.setAttribute('aria-valuemax',String(Math.round(max)));divider.setAttribute('aria-valuenow',String(Math.round(current)));return current;}
 function setOpen(value){opened=value;terminal.hidden=!value;toggle.textContent='▤ Terminal';toggle.title=value?'Close Terminal':'Open Terminal';toggle.setAttribute('aria-expanded',String(value));toggle.setAttribute('aria-pressed',String(value));toggle.classList.toggle('active',value);document.body.classList.toggle('terminal-open',value);if(value)size(height);window.dispatchEvent(new Event('resize'));}
 toggle.onclick=()=>setOpen(!opened);collapse.onclick=()=>setOpen(false);toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-pressed','false');
 function render(){
  for(const [key,b] of buttons){b.setAttribute('aria-selected',String(key===active));b.tabIndex=key===active?0:-1;}
  viewport.setAttribute('aria-labelledby','terminal-tab-'+active);table.replaceChildren();const head=make('thead'),hr=make('tr');
  for(const label of ['Order','Time','Type','Size','Symbol','Entry Price','SL','TP','Current Price','Commission','Swap','Profit',active==='history'?'Status':'']){const th=make('th','',label);th.scope='col';hr.append(th);}head.append(hr);table.append(head);
  const body=make('tbody'),rows=active==='positions'?positions:active==='pending'?pending:history;
  for(const row of rows){const tr=make('tr');const values=[row.id,'2026.11.08 '+row.time,row.type,row.size.toFixed(2),row.symbol,row.entry,row.sl,row.tp,row.price,money(row.commission),money(row.swap),money(row.profit)];
   values.forEach((v,i)=>{const td=make('td',i===2?(row.type.startsWith('Buy')?'terminal-positive':'terminal-negative'):i===11?(row.profit>=0?'terminal-positive':'terminal-negative'):'',String(v));tr.append(td);});
   const action=make('td');if(active==='history')action.textContent=row.status;else{const b=make('button','terminal-close-order','×');b.type='button';const cancel=active==='pending';b.title=(cancel?'Cancel sample order ':'Close sample position ')+row.id;b.setAttribute('aria-label',b.title);b.onclick=()=>{rows.splice(rows.indexOf(row),1);history.push({...row,status:cancel?'Cancelled':'Closed'});if(!cancel)balance+=net(row);notice.textContent=cancel?'Sample pending order cancelled. No broker action was sent.':'Sample position closed. No broker action was sent.';render();};action.append(b);}tr.append(action);body.append(tr);
  }
  if(!rows.length){const tr=make('tr'),td=make('td','terminal-empty',active==='history'?'No sample history yet.':active==='pending'?'No sample pending orders.':'No open sample positions.');td.colSpan=13;tr.append(td);body.append(tr);}table.append(body);
  const foot=make('tfoot'),tr=make('tr'),accountCell=make('td','terminal-account-cell');accountCell.colSpan=11;accountCell.append(summary);tr.append(accountCell);const total=rows.reduce((n,r)=>n+r.profit,0),profitCell=make('td',total>=0?'terminal-positive':'terminal-negative',money(total));profitCell.setAttribute('aria-label','Combined profit or loss');tr.append(profitCell,make('td'));foot.append(tr);table.append(foot);
  const floating=positions.reduce((n,r)=>n+net(r),0),equity=balance+floating,margin=positions.reduce((n,r)=>n+r.margin,0);summary.replaceChildren();for(const [label,value]of [['Balance','$'+money(balance)],['Equity','$'+money(equity)],['Margin','$'+money(margin)],['Free Margin','$'+money(equity-margin)],['Margin Level',margin?money(equity/margin*100)+'%':'—']]){const item=make('span');item.append(make('span','',label+' '),make('b','',value));summary.append(item);}
 }
 for(const [key,label]of [['positions','Positions'],['pending','Pending Orders'],['history','History']]){const b=make('button','',label);b.id='terminal-tab-'+key;b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-controls',viewport.id);b.onclick=()=>{active=key;render();};b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const keys=[...buttons.keys()],index=keys.indexOf(key);active=keys[(index+(e.key==='ArrowRight'?1:2))%3];render();buttons.get(active).focus();};buttons.set(key,b);tabs.append(b);}
 let drag=null;
 function saveHeight(){try{localStorage.setItem('cortexa-terminal-height',String(Math.round(height)));}catch{}}
 divider.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();drag={y:e.clientY,height:terminal.getBoundingClientRect().height};divider.setPointerCapture(e.pointerId);document.body.classList.add('terminal-resizing');};
 divider.onpointermove=e=>{if(drag)height=size(drag.height+drag.y-e.clientY);};
 const stop=()=>{if(!drag)return;drag=null;document.body.classList.remove('terminal-resizing');saveHeight();window.dispatchEvent(new Event('resize'));};divider.onpointerup=stop;divider.onpointercancel=stop;divider.onlostpointercapture=stop;
 divider.onkeydown=e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const {min,max}=bounds();height=size(e.key==='Home'?min:e.key==='End'?max:height+(e.key==='ArrowUp'?20:-20));saveHeight();window.dispatchEvent(new Event('resize'));};
 window.addEventListener('resize',()=>{if(opened)size(height);});render();
})();
