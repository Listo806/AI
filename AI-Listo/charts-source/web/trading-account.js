'use strict';
(()=>{
 if(window.ChartEmbed)return;
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const menu=document.getElementById('chartAccountMenu');if(!menu)return;
 const entry=make('button','','Connect Trading Account');entry.type='button';entry.id='connectTradingAccount';menu.querySelector('strong').after(entry);
 const dialog=make('dialog','trading-account-dialog');dialog.id='tradingAccountDialog';dialog.setAttribute('aria-labelledby','tradingAccountTitle');document.body.append(dialog);
 let platform='MT5',broker='',server='',accountType='Demo',step=0,returnFocus=null;
 const catalog=['IC Markets','Pepperstone','XM','Exness','FP Markets','Other broker'];
 function field(label,control){const row=make('label','trading-account-field');row.append(make('span','',label),control);return row;}
 function button(text,action,cls=''){const b=make('button',cls,text);b.type='button';b.onclick=action;return b;}
 function render(){
  dialog.replaceChildren();const head=make('div','trading-account-header'),title=make('h2','','Connect Trading Account');title.id='tradingAccountTitle';const close=button('×',()=>dialog.close(),'trading-account-close');close.setAttribute('aria-label','Close trading account connection');head.append(title,close);dialog.append(head);
  const status=make('div','trading-account-status','○ Not connected');dialog.append(status);
  const progress=make('div','trading-account-steps');['Broker','Server','Sign in'].forEach((v,i)=>{const s=make('span',i===step?'current':'',(i+1)+' '+v);if(i===step)s.setAttribute('aria-current','step');progress.append(s);});dialog.append(progress);
  if(step===0){
   dialog.append(make('p','trading-account-intro','Find your broker to connect an existing trading account.'));
   const platforms=make('div','trading-account-platforms');platforms.setAttribute('role','group');platforms.setAttribute('aria-label','Trading platform');for(const p of ['MT4','MT5']){const b=button(p,()=>{platform=p;render();});b.setAttribute('aria-pressed',String(platform===p));platforms.append(b);}dialog.append(platforms);
   const search=make('input');search.type='search';search.placeholder='Search your broker';search.setAttribute('aria-label','Search your broker');search.autocomplete='off';const list=make('div','trading-account-results');list.setAttribute('aria-label','Broker choices');
   function results(){list.replaceChildren();const q=search.value.trim(),matches=catalog.filter(n=>n!=='Other broker'&&n.toLowerCase().includes(q.toLowerCase()));for(const name of matches)list.append(button(name,()=>{broker=name;server='';step=1;render();},'trading-account-result'));if(q&&!matches.some(n=>n.toLowerCase()===q.toLowerCase()))list.append(button('Use broker name: '+q,()=>{broker=q;server='';step=1;render();},'trading-account-result'));if(!q)list.append(make('p','trading-account-note','Enter your broker’s name if it is not listed.'));}
   search.oninput=results;dialog.append(search,list,make('p','trading-account-note','Broker names are selection shortcuts. Available servers and account access must be verified during connection.'));results();requestAnimationFrame(()=>search.focus());
  }else if(step===1){
   dialog.append(make('p','trading-account-selection',broker+' · '+platform));dialog.append(make('p','trading-account-intro','Select the account type and enter the exact server shown in MetaTrader.'));
   const types=make('div','trading-account-platforms');for(const t of ['Demo','Live']){const b=button(t,()=>{accountType=t;for(const n of types.children)n.setAttribute('aria-pressed',String(n===b));});b.setAttribute('aria-pressed',String(accountType===t));types.append(b);}dialog.append(types);
   const input=make('input');input.placeholder='Search or enter server name';input.setAttribute('aria-label','Broker server');input.value=server;input.autocomplete='off';const result=make('div','trading-account-results');
   function update(){server=input.value.trim();result.replaceChildren();if(server)result.append(button(server,()=>{step=2;render();},'trading-account-result'));else result.append(make('p','trading-account-note','Use the server name supplied by your broker.'));}input.oninput=update;dialog.append(field('Broker server',input),result);update();dialog.append(button('Back',()=>{step=0;render();}));requestAnimationFrame(()=>input.focus());
  }else{
   dialog.append(make('p','trading-account-selection',broker+' · '+platform+' · '+accountType));dialog.append(make('p','trading-account-server',server));
   const login=make('input');login.placeholder='Trading account login';login.autocomplete='off';login.setAttribute('aria-label','Trading account login');const password=make('input');password.type='password';password.placeholder='Password';password.disabled=true;password.setAttribute('aria-label','Trading account password');
   dialog.append(field('Login',login),field('Password',password));const connect=button('Connect',()=>{},'trading-account-primary');connect.disabled=true;dialog.append(connect,make('p','trading-account-note','No broker connection is configured. Credentials are not submitted or saved.'),button('Back',()=>{step=1;render();}));
  }
 }
 entry.onclick=()=>{returnFocus=entry;document.getElementById('chartAccountMenu').hidden=true;document.getElementById('chartAccountButton').setAttribute('aria-expanded','false');step=0;render();dialog.showModal();};
 dialog.addEventListener('close',()=>{dialog.replaceChildren();broker='';server='';document.getElementById('chartAccountButton').focus();});
})();
