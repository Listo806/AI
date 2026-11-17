(()=>{
 const overlay=document.getElementById('charts-exit-overlay');if(!overlay)return;
 const key='charts_exit_offer_shown_v3';
 const desktop=matchMedia('(hover:hover) and (pointer:fine) and (min-width:801px)');
 const token=localStorage.getItem('listo_access_token');
 const apiBase='https://backend.cortexaaicrm.com/api';
 let eligible=false,checking=false,shown=false;
 const close=()=>{overlay.hidden=true;document.removeEventListener('keydown',escape);};
 const escape=e=>{if(e.key==='Escape')close();};
 overlay.querySelectorAll('.charts-exit-close,.charts-exit-dismiss').forEach(b=>b.addEventListener('click',close));
 // A public Pricing visit does not qualify. Only an authenticated Charts-created account can.
 async function check(){
  if(!token||checking)return false;checking=true;
  try{const r=await fetch(apiBase+'/charts/exit-offer-eligibility',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
   eligible=r.ok&&(await r.json()).eligible===true;
  }catch{eligible=false;}finally{checking=false;}return eligible;
 }
 check();
 document.addEventListener('mouseout',async e=>{
  if(shown||!desktop.matches||!token||sessionStorage.getItem(key)||e.relatedTarget||e.clientY>0||e.clientX<0||e.clientX>innerWidth)return;
  // Check again at the moment of exit so a completed purchase suppresses the offer.
  if(!(await check())||shown||sessionStorage.getItem(key))return;
  shown=true;sessionStorage.setItem(key,'1');overlay.hidden=false;document.addEventListener('keydown',escape);
 });
})();
