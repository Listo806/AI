/* Toolbar gap controls. Uses the chart renderer's center-anchored ChartZoom API. */
(()=>{
 function setup(){
  if(document.getElementById('chartGapZoom'))return;
  const toolbar=document.querySelector('.chart-navigation')||document.querySelector('.toolbar');
  if(!toolbar)return;
  const control=document.createElement('div');control.id='chartGapZoom';control.className='chart-gap-zoom';
  control.setAttribute('role','group');control.setAttribute('aria-label','Chart zoom');
  const icons={out:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',in:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>'};
  for(const [direction,label] of [['out','Zoom out'],['in','Zoom in']]){
   const button=document.createElement('button');button.type='button';button.innerHTML=icons[direction];
   button.title=label;button.setAttribute('aria-label',label);
   for(const event of ['pointerdown','mousedown','touchstart','dblclick'])button.addEventListener(event,e=>e.stopPropagation());
   button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.ChartZoom?.change(direction);});
   control.append(button);
  }
  document.body.append(control);
  let raf=0;
  function position(){
   raf=0;
   const navigation=document.querySelector('.chart-navigation')||document.querySelector('.timeframes');
   const watch=document.querySelector('.market-tools')||document.querySelector('.actions');
   if(!navigation||!watch){control.hidden=true;return;}
   const a=navigation.getBoundingClientRect(),b=watch.getBoundingClientRect();
   const gap=b.left-a.right;
   // Do not overlay any existing control when the viewport is too narrow.
   control.hidden=gap<52||a.height===0||b.height===0;
   if(control.hidden)return;
   control.style.left=Math.round(a.right+gap/2-26)+'px';
   control.style.top=Math.round((b.top+b.bottom)/2-12)+'px';
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(position);}
  window.addEventListener('resize',schedule,{passive:true});
  new MutationObserver(schedule).observe(toolbar,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
