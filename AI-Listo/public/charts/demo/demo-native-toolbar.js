(()=>{
'use strict';
const $=id=>document.getElementById(id), actions=document.querySelector('.market-heading .actions');
if(!actions||actions.dataset.demoFixed==='3')return;actions.dataset.demoFixed='3';
const make=(label,id)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.id=id;b.className='demo-native-extra';return b;};
const dialog=(title,content)=>{let d=$('demoActionDialog');if(!d){d=document.createElement('dialog');d.id='demoActionDialog';d.className='demo-native-dialog';document.body.append(d);}d.replaceChildren();const h=document.createElement('div');h.className='demo-native-dialog-head';const t=document.createElement('strong');t.textContent=title;const x=make('Close','');x.addEventListener('click',()=>d.close());h.append(t,x);d.append(h,content);d.showModal();};
const pane=(text)=>{const p=document.createElement('p');p.textContent=text;return p;};
const group=actions.querySelector('.market-tools');
const calendar=make('▦ Calendar','demoCalendar');
const terminal=make('▤ Terminal','demoTerminal');
const ai=make('✦ Cortexa AI','demoAI');
// Restore native buttons: do not replace them or their event listeners.
const charts=$('viewChartsButton'),full=$('chartFullscreenButton'),styles=actions.querySelector('.chart-styles'),reset=$('reset');
if(group)group.after(calendar);else actions.prepend(calendar);
if(charts)calendar.after(charts);
if(full)(charts||calendar).after(full);
if(full)full.after(terminal);else (charts||calendar).after(terminal);
if(styles)terminal.after(styles);
if(reset)reset.after(ai);else actions.append(ai);
// Keep all real native controls. Never remove them from the DOM.
const nativeMarket=group?.querySelector('button:first-child'),nativeIndicators=group?.querySelector('button:last-child');
if(nativeMarket)nativeMarket.textContent='☷ Market';
if(nativeIndicators)nativeIndicators.textContent='⌁ Indicators';
if(charts)charts.textContent='▦ Charts';
if(full)full.textContent='⛶ Full screen';
if(reset)reset.textContent='Reset';
calendar.addEventListener('click',()=>{const box=document.createElement('div');box.append(pane('Economic Calendar · offline demo'),pane('Live economic events are intentionally unavailable. This demo makes no network requests.'));const now=document.createElement('p');now.textContent='Current UTC: '+new Date().toISOString().replace('T',' ').slice(0,16);box.append(now);dialog('Economic Calendar',box);});
let terminalPane=null;terminal.addEventListener('click',()=>{if(!terminalPane){terminalPane=document.createElement('section');terminalPane.id='demoOfflineTerminal';terminalPane.className='demo-offline-terminal';const h=document.createElement('div');h.className='demo-native-dialog-head';const title=document.createElement('strong');title.textContent='Terminal · simulated account';const x=make('×','');x.onclick=()=>{terminalPane.hidden=true;terminal.setAttribute('aria-pressed','false');};h.append(title,x);terminalPane.append(h,pane('No broker connected. Positions, orders and account balances are not available in this offline demo.'));document.querySelector('article').append(terminalPane);}terminalPane.hidden=!terminalPane.hidden;terminal.setAttribute('aria-pressed',String(!terminalPane.hidden));});
ai.addEventListener('click',()=>{const box=document.createElement('div');box.append(pane('Cortexa AI preview · offline mode'),pane('AI requests are disabled in this public demo to protect customer accounts and live APIs.'));const selected=document.querySelector('#markets button.active, #markets button[aria-pressed="true"]');if(selected)box.append(pane('Selected market: '+selected.textContent.trim()));dialog('Cortexa AI',box);});
})();