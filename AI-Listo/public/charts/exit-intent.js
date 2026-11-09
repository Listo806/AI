(()=>{const overlay=document.getElementById('charts-exit-overlay');if(!overlay)return;
 const seenKey='cortexa_charts_exit_shown_v1';
 const desktop=matchMedia('(hover: hover) and (pointer: fine) and (min-width: 801px)');
 const close=()=>{overlay.hidden=true;document.removeEventListener('keydown',onKey);};
 const onKey=e=>{if(e.key==='Escape')close();};
 overlay.querySelector('.charts-exit-close').addEventListener('click',close);
 // Never use a timer, scroll or click as a trigger.
 let subscriber=true;fetch('https://backend.cortexaaicrm.com/api/charts/entitlement',{headers:localStorage.getItem('listo_access_token')?{Authorization:'Bearer '+localStorage.getItem('listo_access_token')}:{}}).then(r=>r.ok?r.json():null).then(data=>{subscriber=data?!!(data.allowed||data.trialUsed):!!localStorage.getItem('listo_access_token');}).catch(()=>{subscriber=true;});
 document.addEventListener('mouseout',event=>{
  if(!desktop.matches||subscriber||sessionStorage.getItem(seenKey))return;
  if(event.relatedTarget||event.clientY>0||event.clientX<0||event.clientX>innerWidth)return;
  sessionStorage.setItem(seenKey,'1');overlay.hidden=false;document.addEventListener('keydown',onKey);
 });
})();