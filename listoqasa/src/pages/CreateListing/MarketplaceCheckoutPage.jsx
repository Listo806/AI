import React,{useEffect,useRef,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {getMarketplaceUser,marketplaceRequest} from '../../api/marketplaceApi';
import {mountNuveiForm} from './nuveiSdk';
import './MarketplaceSignupPage.css';

export default function MarketplaceCheckoutPage(){
 const [query]=useSearchParams(),nav=useNavigate();
 const planKey=/^(owner|agent)-/.test(query.get('plan')||'')?query.get('plan'):null;
 const [enrollment,setEnrollment]=useState(null),[status,setStatus]=useState(''),[error,setError]=useState('');
 const [busy,setBusy]=useState(false),[ready,setReady]=useState(false),[message,setMessage]=useState('');
 const gateway=useRef(null),mounted=useRef(false);
 const user=getMarketplaceUser();
 useEffect(()=>{if(!user)nav('/marketplace/login?next='+encodeURIComponent('/marketplace/checkout?plan='+planKey),{replace:true});},[nav,planKey]);
 useEffect(()=>{let alive=true;marketplaceRequest('/marketplace/plans/mine').then(r=>{
  if(!alive)return;
  const list=Array.isArray(r.data)?r.data:Array.isArray(r.enrollments)?r.enrollments:[];
  const selected=list.find(x=>x.id===sessionStorage.getItem('listoqasa_pending_enrollment')&&x.plan_key===planKey)||list.find(x=>x.plan_key===planKey);
  if(selected){setEnrollment(selected);setStatus(selected.status)}else setStatus('not_started');
 }).catch(e=>alive&&setError(e.message));return()=>{alive=false};},[planKey]);
 useEffect(()=>{if(!user||mounted.current)return;mounted.current=true;let active=true;
  marketplaceRequest('/marketplace/plans/payment-config').then(cfg=>{
   if(!cfg.configured)throw Error('Secure Nuvei card form is not configured.');
   return mountNuveiForm({containerSelector:'#lq-nuvei-card',environment:cfg.environment,
    appCode:cfg.clientAppCode,appKey:cfg.clientAppKey,
    user:{id:user.id,email:user.email},locale:'en',onIncomplete:msg=>setError(msg||'Complete the card details.')});
  }).then(async form=>{if(!active)return;gateway.current=form;const ok=await form.ready;if(active)setReady(ok);
   if(!ok)throw Error('Secure card form could not be displayed.');
   form.done.then(card=>{if(active)charge(card.token)}).catch(e=>{if(active){setBusy(false);setError(e.message)}});
  }).catch(e=>active&&setError(e.message));return()=>{active=false};},[user?.id]);
 const check=async(id=enrollment?.id)=>{if(!id)return;const r=await marketplaceRequest('/marketplace/plans/payment/'+encodeURIComponent(id));setStatus(r.status);
  if(r.status==='active')nav('/create-listing',{replace:true,state:{message:'Payment confirmed. Create your listing.'}});
  if(r.status==='failed')setError('Payment was declined. Contact support before retrying to avoid duplicate charges.');
 };
 useEffect(()=>{if(!enrollment?.id||status!=='pending_payment')return;let alive=true;
  const timer=setInterval(()=>{if(alive)check(enrollment.id).catch(()=>{})},4000);
  return()=>{alive=false;clearInterval(timer)};
 },[enrollment?.id,status]);
 const charge=async(token)=>{setBusy(true);setError('');try{
  let e=enrollment;
  if(!e){if(!planKey)throw Error('Select a plan first.');const r=await marketplaceRequest('/marketplace/plans/enroll',{method:'POST',body:JSON.stringify({planKey})});e=r.enrollment;
   if(!e?.id)throw Error('Enrollment could not be created.');setEnrollment(e);sessionStorage.setItem('listoqasa_pending_enrollment',e.id);
  }
  if(e.status==='active'){nav('/create-listing');return;}
  if(e.payment_reference)throw Error('A payment is already in progress. Please wait for verification.');
  const r=await marketplaceRequest('/marketplace/plans/checkout',{method:'POST',body:JSON.stringify({enrollmentId:e.id,token})});
  setStatus(r.status);setEnrollment(prev=>prev?{...prev,payment_reference:r.status==='pending_payment'?'processing':prev.payment_reference}:prev);setMessage(r.message||'Payment submitted. Waiting for verification.');
  if(r.status==='active')nav('/create-listing',{replace:true});
  else if(r.status==='failed')setError('Payment was declined. Please contact support.');
 }catch(e){setError(e.message)}finally{setBusy(false)} };
 const submit=async()=>{if(busy||!ready||!gateway.current)return;setError('');setBusy(true);
  if(!gateway.current.submit()){setBusy(false);setError('Unable to submit secure card form.');}
 };
 return <div className="ms-page"><header className="ms-header"><Link to="/" className="ms-logo"><span>LQ</span> ListoQasa</Link></header>
  <main className="ms-main" style={{maxWidth:650,margin:'28px auto',padding:'0 16px'}}><section className="ms-card" style={{textAlign:'left'}}>
   <h1 style={{textAlign:'center'}}>Secure Marketplace Checkout</h1><p style={{textAlign:'center'}}>Selected plan: {planKey||'Not selected'}</p>
   <p style={{textAlign:'center'}}>Payment status: {status||'Loading...'}</p>
   {status==='active'?<Link to="/create-listing">Create Your Listing</Link>:<>
    {status==='pending_payment'&&enrollment?.payment_reference?<p role="status">Payment is being verified. This page will continue automatically once confirmed.</p>:<>
     <div id="lq-nuvei-card" style={{minHeight:220,width:'100%',margin:'20px 0'}} aria-label="Secure Nuvei card fields" />
     <button type="button" className="ms-submit" disabled={busy||!ready||!planKey} onClick={submit}>{busy?'Processing…':'Pay securely and continue'}</button>
    </>}
    {message&&<p role="status">{message}</p>}
    {error&&<p role="alert" style={{color:'#b42318'}}>{error}</p>}
    {enrollment&&<button type="button" onClick={()=>check().catch(e=>setError(e.message))} style={{marginTop:12}}>Refresh payment status</button>}
   </>}
  </section></main></div>;
}
