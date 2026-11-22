(()=>{
 function init(){
 const root=document.querySelector('#chartIndicatorControls');if(!root||root.dataset.toolbar43)return;
 const nav=root.querySelector('.chart-navigation'),actions=root.querySelector('.actions');if(!nav||!actions)return;root.dataset.toolbar43='true';
 function menu(group,title,cls){const d=document.createElement('details');d.className='cx43-menu '+cls;const s=document.createElement('summary');s.textContent=title;d.append(s);group.before(d);d.append(group);group.addEventListener('click',e=>{if(e.target.closest('button'))d.open=false;});return d;}
 const history=nav.querySelector('.history-ranges');if(history)menu(history,'History','cx43-history');
 const tf=nav.querySelector('.timeframes');if(tf)menu(tf,'Period','cx43-period');
 const more=document.createElement('details');more.className='cx43-menu cx43-more';more.innerHTML='<summary>More</summary><div class="cx43-panel"></div>';actions.append(more);const panel=more.lastElementChild;
 const slots=new Map();function track(){for(const el of [...actions.children])if(el!==more&&!slots.has(el)){const marker=document.createComment('toolbar slot');el.before(marker);slots.set(el,marker);}}
 function fit(){if(!root.clientWidth)return;track();for(const [el,marker] of slots)if(el.parentNode===panel)marker.after(el);more.hidden=true;root.classList.remove('cx43-compact');const fits=()=>nav.getBoundingClientRect().width+actions.getBoundingClientRect().width+12<=root.clientWidth;
 if(fits())return;more.hidden=false; if(fits()){more.hidden=true;return;}
 const priority=[...slots.keys()].filter(e=>!e.matches('#cortexaAI')).reverse();for(const el of priority){if(fits())break;if(el.getBoundingClientRect().width)panel.prepend(el);}
 if(!fits()){root.classList.add('cx43-compact');}if(!fits()){for(const el of [...actions.children])if(el!==more&&fits()===false&&el.getBoundingClientRect().width)panel.prepend(el);}if(!panel.children.length)more.hidden=true;
 }
 let pending=0;function schedule(){if(!pending)pending=requestAnimationFrame(()=>{pending=0;fit();});}new ResizeObserver(schedule).observe(root);window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);document.addEventListener('pointerdown',e=>{for(const d of root.querySelectorAll('details[open]'))if(!d.contains(e.target))d.open=false;});document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const d of root.querySelectorAll('details[open]'))d.open=false;});schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
