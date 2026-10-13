import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/apiClient';
import { fetchNuveiConfig } from '../api/nuveiApi';
import { mountNuveiForm } from './checkout/nuveiSdk';
import { useAuth } from '../context/AuthContext';

const labels = {
  en: { title:'Product plans', monthly:'Monthly', yearly:'Yearly', enroll:'Create pending enrollment', cancel:'Cancel renewal', pending:'Payment pending', annual:'Annual price awaiting approval', login:'Please sign in to continue', error:'Request failed', active:'Active subscriptions', note:'Card entry uses Nuvei secure checkout; this page never collects card numbers.' },
  es: { title:'Planes de productos', monthly:'Mensual', yearly:'Anual', enroll:'Crear inscripción pendiente', cancel:'Cancelar renovación', pending:'Pago pendiente', annual:'Precio anual pendiente de aprobación', login:'Inicie sesión para continuar', error:'Solicitud fallida', active:'Suscripciones activas', note:'Los datos de tarjeta se introducen en el pago seguro de Nuvei; esta página no recoge números de tarjeta.' },
  pt: { title:'Planos de produtos', monthly:'Mensal', yearly:'Anual', enroll:'Criar inscrição pendente', cancel:'Cancelar renovação', pending:'Pagamento pendente', annual:'Preço anual aguardando aprovação', login:'Entre na sua conta para continuar', error:'Falha na solicitação', active:'Assinaturas ativas', note:'Os dados do cartão são inseridos no checkout seguro da Nuvei; esta página não coleta números de cartão.' }
};
export default function ProductBillingPlans() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = (i18n.language || 'en').slice(0,2);
  const t = labels[lang] || labels.en;
  const [autoRenew,setAutoRenew]=useState(false);
  const [plans,setPlans]=useState([]), [mine,setMine]=useState([]), [interval,setInterval]=useState('monthly');
  const [busy,setBusy]=useState(''), [message,setMessage]=useState('');
  const [checkout,setCheckout]=useState(null), [config,setConfig]=useState(null), [ready,setReady]=useState(false);
  const submitRef=useRef(null);
  const [formVersion,setFormVersion]=useState(0);
  useEffect(()=>{fetchNuveiConfig().then(setConfig).catch(()=>setConfig({enabled:false}));},[]);
  useEffect(()=>{
    if (!checkout || !config?.enabled) return;
    let alive=true;
    setReady(false);submitRef.current=null;
    (async()=>{
      try {
        const form=await mountNuveiForm({containerSelector:'#product-nuvei-form',
          environment:config.environment,appCode:config.clientAppCode,appKey:config.clientAppKey,
          user:{id:checkout.userId,email:checkout.email},locale:lang,country:'ECU',
          onIncomplete:()=>setMessage('Complete the secure card form')});
        if(!alive)return;
        submitRef.current=form.submit;
        form.ready.then(ok=>{if(alive)setReady(Boolean(ok));});
        const card=await form.done;
        if(!alive)return;
        if(!card?.token)throw new Error('Nuvei did not return a card token');
        const result=await apiClient.request('/product-billing/checkout',{method:'POST',body:JSON.stringify({enrollmentId:checkout.id,token:card.token})});
        if(!alive)return;
        setMessage(result?.message||`Payment status: ${result?.status||'pending'}`);
        setCheckout(null);await refresh();
      }catch(e){if(alive){setMessage(e.message||t.error);setReady(false);}}
    })();
    return()=>{alive=false;submitRef.current=null;};
  },[checkout?.id,config?.enabled,formVersion]);

  const refresh=async()=>{
    try { const catalog=await apiClient.request('/product-billing/catalog');setPlans(Array.isArray(catalog)?catalog:[]); } catch(e){setMessage(e.message||t.error);}
    try {const subs=await apiClient.request('/product-billing/mine');setMine(Array.isArray(subs)?subs:[]);} catch (_) { /* catalog remains visible for visitors */ }
  };
  useEffect(()=>{refresh();},[]);
  const enroll=async(plan)=>{
    setBusy(plan.key);setMessage('');
    try {
      const parent = plan.addon ? mine.find(s => s.status === 'active' &&
        ['marketplace_agents.essential','marketplace_agents.growth'].includes(s.plan_key) &&
        new Date(s.period_end) > new Date()) : null;
      if (plan.addon && !parent) {setMessage('An active Marketplace Agents plan is required for this add-on.');return;}
      const enrollment=await apiClient.request('/product-billing/enroll',{method:'POST',body:JSON.stringify({planKey:plan.key,interval:plan.addon?'monthly':interval,autoRenew,...(parent?{parentId:parent.id}:{})})});
      if(!user?.id||!user?.email)throw new Error(t.login);
      setCheckout({id:enrollment.id,userId:user.id,email:user.email});
      setMessage(`${t.pending}: ${enrollment.id}`);
      await refresh();
    }catch(e){setMessage(e.message||t.error);}finally{setBusy('');}
  };
  const cancel=async(id)=>{
    setBusy(id);try{await apiClient.request(`/product-billing/cancel/${id}`,{method:'POST'});await refresh();}catch(e){setMessage(e.message||t.error);}finally{setBusy('');}
  };
  return <main style={{maxWidth:1100,margin:'40px auto',padding:24}}>
    <h1>{t.title}</h1><p>{t.note}</p>
    <label>{t.monthly} / {t.yearly}: <select value={interval} onChange={e=>setInterval(e.target.value)}><option value="monthly">{t.monthly}</option><option value="yearly">{t.yearly}</option></select></label>
    <label><input type="checkbox" checked={autoRenew} onChange={e=>setAutoRenew(e.target.checked)}/> I authorize automatic recurring Nuvei charges at the selected billing interval until I cancel.</label>
    {message&&<p role="status">{message}</p>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginTop:24}}>
      {plans.map(p=><section key={p.key} style={{border:'1px solid #ddd',borderRadius:12,padding:20}}>
        <h2>{p.key.split('.').pop().replaceAll('_',' ')}</h2><p>{p.category.replaceAll('_',' ')}</p>
        <strong>{interval==='monthly'?`$${p.monthlyPrice} USD / ${t.monthly}`:(p.annualApprovedPrice?`$${p.annualApprovedPrice} USD / ${t.yearly}`:`${t.annual} ($${p.annualReviewPrice||0} review only)`)}</strong>
        <p>{p.addon?'AI CRM add-on':p.limit===null?'Unlimited listings':`${p.limit} listings`}</p>
        <button type="button" disabled={busy===p.key||(interval==='yearly'&&!p.annualApprovedPrice)} onClick={()=>enroll(p)}>{t.enroll}</button>
      </section>)}
    </div>
    {checkout&&<section style={{marginTop:24,padding:24,border:'1px solid #ddd',borderRadius:12}}>
      <h2>Nuvei secure payment</h2>
      <p>{checkout.id}</p>
      <div id="product-nuvei-form" key={formVersion} style={{minHeight:190}}/>
      <button type="button" disabled={!ready} onClick={()=>submitRef.current?.()}>Pay securely</button>
      <button type="button" onClick={()=>{setCheckout(null);setFormVersion(v=>v+1)}}>Cancel</button>
    </section>}
    <h2>{t.active}</h2>{mine.map(s=><div key={s.id} style={{padding:12,borderBottom:'1px solid #ddd'}}>
      <strong>{s.plan_key}</strong> — {s.status} {s.period_end&&`(${new Date(s.period_end).toLocaleDateString()})`}
      {s.status==='active'&&!s.cancel_at_period_end&&<button style={{marginLeft:12}} disabled={busy===s.id} onClick={()=>cancel(s.id)}>{t.cancel}</button>}
    </div>)}
  </main>;
}
