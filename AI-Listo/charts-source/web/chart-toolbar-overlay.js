/* Single-workspace overlay. Measure actual toolbar/strip geometry; never touch chart data. */
(()=>{
 const desktop=()=>matchMedia('(min-width:761px)').matches;
 function apply(){
  const article=document.querySelector('article');
  if(!article)return;
  const excluded=!desktop()||document.documentElement.classList.contains('chart-embedded')||document.documentElement.classList.contains('multi-chart-mode');
  const shell=article.querySelector('.chart-shell');
  const controls=article.querySelector('#chartIndicatorControls');
  if(!shell||!controls||excluded){article.style.removeProperty('--chart-toolbar-overlap');return;}
  const top=controls.getBoundingClientRect().top;
  const bottom=shell.getBoundingClientRect().top;
  // Shell already has a negative margin; undo the previous overlap when measuring.
  const previous=parseFloat(article.style.getPropertyValue('--chart-toolbar-overlap'))||0;
  const measured=Math.max(0,Math.min(160,Math.round(bottom+previous-top)));
  if(Math.abs(measured-previous)>1)article.style.setProperty('--chart-toolbar-overlap',measured+'px');
 }
 let pending=0;
 function schedule(){if(pending)return;pending=requestAnimationFrame(()=>{pending=0;apply();});}
 function init(){const article=document.querySelector('article');if(!article)return;
  schedule();window.addEventListener('resize',schedule,{passive:true});
  const observer=new ResizeObserver(schedule);
  for(const el of [article.querySelector('#chartIndicatorControls'),article.querySelector('.one-click-control-strip'),article.querySelector('.toolbar')])if(el)observer.observe(el);
  const mutations=new MutationObserver(schedule);mutations.observe(article,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','aria-expanded']});
  document.fonts?.ready?.then(schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
