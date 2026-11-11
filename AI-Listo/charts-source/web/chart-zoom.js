/* Chart gap zoom: UI only; delegates to the existing chart zoom handlers. */
(()=>{
  const setup=()=>{
    if(document.getElementById('chartGapZoom'))return;
    const shell=document.querySelector('.chart-shell');
    const price=document.getElementById('priceChart');
    const rsiHeader=shell?.querySelector('.rsi-header');
    if(!shell||!price||!rsiHeader)return;
    const control=document.createElement('div');
    control.id='chartGapZoom'; control.className='chart-gap-zoom';
    control.setAttribute('role','group');control.setAttribute('aria-label','Chart zoom');
    for(const [symbol,description,target] of [['−','Zoom out','zoomOut'],['+','Zoom in','zoomIn']]){
      const button=document.createElement('button');button.type='button';button.textContent=symbol;
      button.title=description;button.setAttribute('aria-label',description);
      button.addEventListener('click',()=>document.getElementById(target)?.click());control.append(button);
    }
    document.body.append(control);
    let raf=0;
    const position=()=>{
      raf=0;
      if(!price.isConnected||!rsiHeader.isConnected){control.hidden=true;return;}
      const p=price.getBoundingClientRect(),r=rsiHeader.getBoundingClientRect();
      const visible=p.width>0&&p.height>0&&r.width>0&&r.height>0;
      control.hidden=!visible;
      if(!visible)return;
      const mid=(p.bottom+r.top)/2;
      control.style.left=`${Math.round(p.left+p.width/2-26)}px`;
      control.style.top=`${Math.round(mid-12)}px`;
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(position)};
    const observer=new ResizeObserver(schedule);observer.observe(price);observer.observe(rsiHeader);
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('scroll',schedule,{passive:true,capture:true});
    new MutationObserver(schedule).observe(shell,{attributes:true,attributeFilter:['class','style'],subtree:false});
    position();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
