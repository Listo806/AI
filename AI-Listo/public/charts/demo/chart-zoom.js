/* Persistent compact zoom controls beside Market; preserve ChartZoom API. */
(()=>{
 function init(){
  if(document.getElementById('chartGapZoom'))return;
  const actions=document.querySelector('.market-heading .actions');
  if(!actions)return;
  const control=document.createElement('div');control.id='chartGapZoom';control.className='chart-gap-zoom';control.setAttribute('role','group');control.setAttribute('aria-label','Chart zoom');
  for(const [direction,label,symbol] of [['out','Zoom out','−'],['in','Zoom in','+']]){
   const b=document.createElement('button');b.type='button';b.textContent=symbol;b.title=label;b.setAttribute('aria-label',label);
   b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(window.ChartZoom?.change)window.ChartZoom.change(direction);else document.getElementById(direction==='in'?'zoomIn':'zoomOut')?.click();});control.append(b);
  }
  actions.prepend(control);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
