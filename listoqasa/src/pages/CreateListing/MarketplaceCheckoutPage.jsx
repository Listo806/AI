import { attachMarketplaceAdClick } from '../../api/marketplaceAdAttribution';
import React,{useEffect,useRef,useState} from 'react';
import {useNavigate,useSearchParams} from 'react-router-dom';
import {getMarketplaceUser,marketplaceRequest} from '../../api/marketplaceApi';

import {Copy, Check, Landmark, UserRound, Layers, Info, ShieldCheck, Mail, Phone, Pencil} from 'lucide-react';
import './MarketplaceCheckoutPage.css';
const TITLES={'owner-standard':'Standard','owner-enhanced':'Enhanced Exposure','owner-maximum':'Maximum Exposure','agent-essential':'Essential','agent-growth':'Growth','owner-free-launch':'Free Launch','agent-free-launch':'Free Launch'};
export default function MarketplaceCheckoutPage(){
 const [query]=useSearchParams(),navigate=useNavigate(),user=getMarketplaceUser();
 const requestedInterval=query.get('billing')==='quarterly'?'quarterly':query.get('billing')==='yearly'?'yearly':'monthly';
 const [copiedField,setCopiedField]=useState(''); const [editing,setEditing]=useState(false);
 const planKey=/^(owner|agent|developer|vacation)-/.test(query.get('plan')||'')?query.get('plan'):null;
 const [enrollment,setEnrollment]=useState(null),[plans,setPlans]=useState([]),[bank,setBank]=useState(null),[bankReference,setBankReference]=useState('');
 const [status,setStatus]=useState('loading'),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[agree,setAgree]=useState(false);
 const [receipt,setReceipt]=useState(null); const [bankTxRef,setBankTxRef]=useState('');const [bankNote,setBankNote]=useState('');
 const [profile,setProfile]=useState({name:'',email:'',phone:''});const gateway=useRef(null),mounted=useRef(false),active=useRef(true);
 const price=enrollment?.price_cents!=null?Number(enrollment.price_cents)/100:plans.find(p=>p.key===planKey)?.priceCents/100;
 const amount=Number.isFinite(price)?`$${price.toFixed(2)}`:'—';
 const isAgentTaxed=['agent-essential','agent-growth'].includes(planKey);
 const isTaxed=isAgentTaxed || ['owner-standard','owner-enhanced','owner-maximum'].includes(planKey);
 const basePrice=isTaxed && Number.isFinite(price)?Math.round(price/1.16*100)/100:null;
 const ivaAmount=basePrice!=null?Math.round((price-basePrice)*100)/100:null;
 useEffect(()=>{if(!user){navigate('/marketplace/login?next='+encodeURIComponent('/es-ec/marketplace/checkout?plan='+encodeURIComponent(planKey||'')+'&billing='+requestedInterval),{replace:true});return;}
 setProfile({name:user.fullName||user.full_name||user.name||[user.firstName,user.lastName].filter(Boolean).join(' ')||'',email:user.email||'',phone:user.phone||user.phone_number||''});},[user?.id,navigate,planKey]);
 useEffect(()=>{active.current=true;Promise.all([marketplaceRequest('/marketplace/plans/mine'),marketplaceRequest('/marketplace/plans'),marketplaceRequest('/marketplace/plans/bank-details').catch(()=>null)]).then(([r,p,b])=>{
 if(!active.current)return;setPlans(Array.isArray(p)?p:p.data||[]);setBank(b?.configured?b:null);
 const list=Array.isArray(r.data)?r.data:Array.isArray(r.enrollments)?r.enrollments:[];
 const found=list.find(x=>x.id===sessionStorage.getItem('listoqasa_pending_enrollment')&&x.plan_key===planKey&&x.billing_interval===requestedInterval)||list.find(x=>x.plan_key===planKey&&x.billing_interval===requestedInterval&&x.status==='pending_payment')||list.find(x=>x.plan_key===planKey&&x.billing_interval===requestedInterval&&x.status==='active')||list.find(x=>x.plan_key===planKey&&x.billing_interval===requestedInterval);
 if(found){void attachMarketplaceAdClick(found.id).catch(()=>false);setEnrollment(found);if(found.payment_reference)setBankReference(found.payment_reference);setStatus(found.status);if(found.status==='active')navigate('/marketplace/purchase-confirmation?enrollmentId='+encodeURIComponent(found.id),{replace:true});}else setStatus('not_started');
 }).catch(e=>active.current&&setError(e.message));return()=>{active.current=false};},[planKey,navigate]);
 const check=async(id=enrollment?.id)=>{if(!id)return;const r=await marketplaceRequest('/marketplace/plans/payment/'+encodeURIComponent(id));if(!active.current)return;setStatus(r.status);
 if(r.status==='active'){sessionStorage.removeItem('listoqasa_pending_enrollment');navigate('/marketplace/purchase-confirmation?enrollmentId='+encodeURIComponent(id),{replace:true});}
 if(r.status==='failed')setError('Payment was declined. Please contact support before trying again.');};
 useEffect(()=>{if(!enrollment?.id||status!=='pending_payment')return;const t=setInterval(()=>check(enrollment.id).catch(()=>{}),4000);return()=>clearInterval(t);},[enrollment?.id,status]);
 const paymentStarted=!!enrollment?.payment_reference;
 const confirmTransfer=async()=>{if(!enrollment?.id||busy||!agree||bankTxRef.trim().length<4)return;setBusy(true);setError('');try{const body=new FormData();body.append('enrollmentId',enrollment.id);body.append('bankTransactionReference',bankTxRef.trim());body.append('note',bankNote);if(receipt)body.append('receipt',receipt);await marketplaceRequest('/marketplace/plans/bank-confirmation',{method:'POST',body});navigate('/marketplace/payment-pending?enrollmentId='+encodeURIComponent(enrollment.id));}catch(e){setError(e.message)}finally{setBusy(false)}};
 const copy=async(value,field)=>{if(!value||!navigator.clipboard)return;try{await navigator.clipboard.writeText(String(value));setCopiedField(field)}catch{setError('No se pudo copiar automáticamente. Selecciona y copia el valor.')}};
 const CopyButton=({value,field,label})=><button type="button" className="lq-copy-button" onClick={()=>copy(value,field)} disabled={!value} aria-label={`Copiar ${label}`} title={copiedField===field?'Copiado':`Copiar ${label}`}>{copiedField===field?<Check size={15}/>:<Copy size={15}/>}</button>;
 const transfer=async()=>{if(!bank?.configured||!planKey)return;setBusy(true);setError('');try{let e=enrollment;if(!e){const created=await marketplaceRequest('/marketplace/plans/enroll',{method:'POST',body:JSON.stringify({planKey,interval:requestedInterval})});e=created.enrollment;setEnrollment(e);sessionStorage.setItem('listoqasa_pending_enrollment',e.id)}await attachMarketplaceAdClick(e.id).catch(()=>false);const r=await marketplaceRequest('/marketplace/plans/bank-transfer',{method:'POST',body:JSON.stringify({enrollmentId:e.id})});setBankReference(r.reference);setMessage('Referencia generada. El plan se activa únicamente después de verificar la transferencia.');}catch(e){setError(e.message)}finally{setBusy(false)}};
 useEffect(()=>{if(!user||!bank?.configured||!planKey||bankReference||busy||status==='loading'||status==='active')return;let cancelled=false;const start=async()=>{try{let e=enrollment;if(!e){const created=await marketplaceRequest('/marketplace/plans/enroll',{method:'POST',body:JSON.stringify({planKey,interval:requestedInterval})});e=created.enrollment;if(cancelled)return;setEnrollment(e);sessionStorage.setItem('listoqasa_pending_enrollment',e.id)}const r=await marketplaceRequest('/marketplace/plans/bank-transfer',{method:'POST',body:JSON.stringify({enrollmentId:e.id})});if(!cancelled)setBankReference(r.reference||e.payment_reference||'');}catch(err){if(!cancelled)setError(err.message)}};start();return()=>{cancelled=true}},[user?.id,bank?.configured,planKey,requestedInterval,status]);
 const currentPlan=plans.find(p=>p.key===planKey);
 const period=requestedInterval==='yearly'?'anual':requestedInterval==='quarterly'?'trimestral':'mensual';
 const planUrl=planKey?.startsWith('vacation-')?'/es/vacation-rental-plans?country=EC':planKey?.startsWith('developer-')?'/es/developer-plans?country=EC':planKey?.startsWith('agent-')?'/es/agent-plans?country=EC':'/es/owner-plans?country=EC';
 return <main className="lq-checkout lq-approved">
 <div className="lq-columns"><div className="lq-left">
 <section className="lq-panel lq-customer"><div className="lq-heading"><span className="lq-symbol"><UserRound size={23}/></span><div><h2>Tu información</h2><p>Datos de tu cuenta.</p></div><button type="button" className="lq-edit" onClick={()=>setEditing(!editing)}>{editing?'Listo':'Editar'} <Pencil size={15}/></button></div>
 <label>Nombre completo<div className="lq-field"><UserRound size={17}/><input value={profile.name} readOnly={!editing} onChange={e=>setProfile({...profile,name:e.target.value})}/></div></label>
 <label>Correo electrónico<div className="lq-field"><Mail size={17}/><input value={profile.email} readOnly/></div></label>
 <label>Número de teléfono<div className="lq-field"><Phone size={17}/><input value={profile.phone} readOnly={!editing} onChange={e=>setProfile({...profile,phone:e.target.value})}/></div></label>
 {editing&&<p className="lq-hint">Para guardar cambios permanentes, actualiza tu perfil desde tu cuenta.</p>}
 </section>
 <section className="lq-panel lq-plan"><div className="lq-heading"><span className="lq-symbol"><Layers size={23}/></span><div><h2>Tu plan seleccionado</h2><p>Revisa los detalles de tu plan.</p></div><a href={planUrl}>Cambiar plan ↗</a></div><h3>{currentPlan?.name||TITLES[planKey]||planKey||'Plan no seleccionado'}</h3><p>Facturación {period}</p><p>{currentPlan?.maxListings==null?'Publicaciones activas ilimitadas':`${currentPlan.maxListings} publicaciones activas`}</p>
 {isTaxed&&basePrice!=null&&<p>Subtotal: ${basePrice.toFixed(2)} · IVA (16%): ${ivaAmount.toFixed(2)}</p>}
 <div className="lq-summary"><Landmark size={22}/><strong>Transferencia bancaria</strong><span><b>{amount} hoy</b><small>Renovación {period}: {amount}</small></span></div></section></div>
 <div className="lq-right"><section className="lq-panel lq-bank"><div className="lq-heading"><span className="lq-symbol"><Landmark size={25}/></span><div><h2>Transferencia bancaria</h2><p>Paga tu plan mediante transferencia.</p></div><span className="lq-available">Recomendado en Ecuador</span></div>
 {bank?.configured?<><div className="lq-bank-grid"><div><small>Monto a transferir</small><b>{amount}</b><CopyButton value={Number.isFinite(price)?price.toFixed(2):''} field="amount" label="monto"/></div><div><small>Referencia de pago</small><b>{bankReference||'Generando…'}</b><CopyButton value={bankReference} field="reference" label="referencia"/></div></div>
 <div className="lq-bank-data">{[['Banco',bank.bankName],['Titular de la cuenta',bank.accountHolder],['Tipo de cuenta',bank.accountType],['Número de cuenta',bank.accountNumber],['RUC',bank.ruc]].map(([label,value])=><div key={label}><span>{label}:</span><b>{value||'—'}</b><CopyButton value={value} field={label} label={label}/></div>)}</div>
 <div className="lq-instruction"><Info size={19}/> Usa la referencia de pago al realizar tu transferencia.</div>
 <label className="lq-consent"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/><span>Acepto los <a href="/es/terms" target="_blank" rel="noreferrer">Términos y Condiciones</a> y la <a href="/es/privacy-policy" target="_blank" rel="noreferrer">Política de Privacidad</a>.</span></label>
 <div className="lq-bank-confirm"><label>Referencia de la transacción bancaria<input value={bankTxRef} maxLength={120} placeholder="Número del comprobante bancario" onChange={e=>setBankTxRef(e.target.value)}/></label><label>Adjuntar comprobante (opcional, PNG, JPG o PDF, máximo 5 MB)<input type="file" accept="image/png,image/jpeg,application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f&&(f.size>5*1024*1024||!['image/png','image/jpeg','application/pdf'].includes(f.type))){setError('El comprobante debe ser PNG, JPG o PDF y no superar 5 MB.');setReceipt(null);e.target.value=''}else{setError('');setReceipt(f||null)}}}/></label></div>
 <button className="lq-pay" disabled={busy||!agree||!bankReference||bankTxRef.trim().length<4} onClick={confirmTransfer}>{busy?'Procesando…':'Enviar confirmación de transferencia'}</button><small className="lq-footnote"><ShieldCheck size={16}/> Tu cuenta se activa después de verificar el pago.</small>
 </>:<div className="lq-bank-unavailable">Los datos bancarios verificados no están disponibles. No realices la transferencia.</div>}</section></div></div>
 {message&&<p className="lq-feedback" role="status">{message}</p>}{error&&<p className="lq-feedback error" role="alert">{error}</p>}
 {enrollment&&<div className="lq-status"><Info size={18}/> Confirmación pendiente. Tu plan se activará únicamente después de la verificación administrativa. <button onClick={()=>check().catch(e=>setError(e.message))}>Consultar estado</button></div>}
 </main>;
}
