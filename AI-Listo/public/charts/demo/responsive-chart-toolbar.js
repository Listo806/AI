(()=>{
 const root=document.querySelector('#chartIndicatorControls');if(!root)return;
 const nav=root.querySelector('.chart-navigation'),actions=root.querySelector('.actions');if(!nav||!actions)return;
 function dropdown(group,title){if(!group)return;const d=document.createElement('details');d.className='cx-toolbar-menu';const s=document.createElement('summary');s.textContent=title;group.before(d);d.append(s,group);group.addEventListener('click',e=>{if(e.target.closest('button'))d.open=false;});return d;}
 dropdown(nav.querySelector('.history-ranges'),'History');
 const tf=nav.querySelector('.timeframes');const tfMenu=dropdown(tf,'Period');tfMenu?.classList.add('cx-period-menu');
 const more=document.createElement('details');more.className='cx-toolbar-menu cx-more-menu';const summary=document.createElement('summary');summary.textContent='More';const panel=document.createElement('div');panel.className='cx-more-panel';more.append(summary,panel);actions.append(more);
 const original=[...actions.children].filter(el=>el!==more);const placeholders=new Map(original.map(el=>{const marker=document.createComment('toolbar slot');el.before(marker);return [el,marker];}));
 const restore=()=>{for(const [el,marker] of placeholders)marker.after(el);};
 const fits=()=>nav.getBoundingClientRect().width+actions.getBoundingClientRect().width+12<=root.clientWidth;
 const fit=()=>{restore();more.hidden=true;root.classList.remove('cx-compact-period');if(fits())return;root.classList.add('cx-compact-period');if(fits())return;more.hidden=false;const priority=original.filter(el=>!el.matches('#cortexaAI,#demoAI')).reverse();for(const el of priority){if(fits())break;panel.prepend(el);}if(!panel.children.length)more.hidden=true;};
 let pending=0;const schedule=()=>{if(!pending)pending=requestAnimationFrame(()=>{pending=0;fit();});};new ResizeObserver(schedule).observe(root);window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);document.addEventListener('pointerdown',e=>{for(const d of root.querySelectorAll('details[open]'))if(!d.contains(e.target))d.open=false;});document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const d of root.querySelectorAll('details[open]'))d.open=false;});schedule();
})();
