import React,{useEffect,useState,useRef} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {getMarketplaceUser,marketplaceRequest} from '../../api/marketplaceApi';
import './MarketplaceSignupPage.css';
export default function MarketplaceCheckoutPage(){
 const [query]=useSearchParams(),nav=useNavigate(),rawPlan=query.get('plan'),planKey=rawPlan?.match(/^(owner|agent)-/)?rawPlan:null;
 const paymentModal=useRef(null);
 const [sdkReady,setSdkReady]=useState(false);
 useEffect(()=>{if(window.PaymentCheckout?.modal){setSdkReady(true);return;}const script=document.createElement('script');script.src='https://cdn.paymentez.com/ccapi/sdk/payment_checkout_3.0.0.min.js';script.async=true;script.onload=()=>setSdkReady(!!window.PaymentCheckout?.modal);script.onerror=()=>setError('Unable to load secure Nuvei payment form.');document.head.appendChild(script);return()=>{script.onload=null;script.onerror=null}},[]);
 const [enrollment,setEnrollment]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{if(!getMarketplaceUser()){nav('/marketplace/login?next='+encodeURIComponent('/marketplace/checkout?plan='+planKey),{replace:true});return;}
 let alive=true;marketplaceRequest('/marketplace/plans/mine').then(r=>{if(!alive)return;const match=(Array.isArray(r.data)?r.data:Array.isArray(r.enrollments)?r.enrollments:Array.isArray(r)?r:[]).find(x=>x.id===sessionStorage.getItem('listoqasa_pending_enrollment'))||(Array.isArray(r.data)?r.data:Array.isArray(r.enrollments)?r.enrollments:Array.isArray(r)?r:[]).find(x=>x.plan_key===planKey||x.planKey===planKey);if(match){setEnrollment(match);setStatus(match.status)}else if(planKey){setStatus('not_started')}else setError('No plan selected. Please select a plan first.')}).catch(e=>setError(e.message));return()=>{alive=false}},[planKey,nav]);
 useEffect(()=>()=>{try{paymentModal.current?.close?.()}catch(_e){}},[]);
 const openNuveiModal=(reference)=>{
  if(!window.PaymentCheckout?.modal)throw Error('Nuvei secure checkout could not be loaded. Please try again.');
  const modal=new window.PaymentCheckout.modal({
   env_mode:import.meta.env.VITE_NUVEI_ENV_MODE==='prod'?'prod':'stg',
   onResponse:(response)=>{
    if(response?.error){setError(response.error.description||'Nuvei reported a payment error.');return;}
    // Payment status must always be confirmed by the backend/callback.
    setStatus('pending_payment');
    setError('Payment submitted. Waiting for Nuvei confirmation; use Check Payment Status.');
   },
   onClose:()=>{paymentModal.current=null;}
  });
  paymentModal.current=modal;
  modal.open({reference});
 };
 const start=async()=>{setBusy(true);setError('');try{
  let e=enrollment;
  if(!e){const r=await marketplaceRequest('/marketplace/plans/enroll',{method:'POST',body:JSON.stringify({planKey})});e=r.enrollment;if(!e?.id)throw Error('Enrollment was not returned by the server.');sessionStorage.setItem('listoqasa_pending_enrollment',e.id);setEnrollment(e);if(r.next==='/create-listing'){nav('/create-listing',{state:{message:r.message}});return}}
  if(e.status==='active'){nav('/create-listing');return}
  const result=await marketplaceRequest('/marketplace/plans/checkout',{method:'POST',body:JSON.stringify({enrollmentId:e.id})});
  if(result.status==='active'){nav('/create-listing');return;}
  if(result.reference){sessionStorage.setItem('listoqasa_pending_enrollment',e.id);openNuveiModal(result.reference)}
  else throw Error('Nuvei did not return an embedded checkout reference.');
 }catch(err){setError(err.message)}finally{setBusy(false)}};
 const check=async()=>{if(!enrollment)return;setBusy(true);try{const r=await marketplaceRequest('/marketplace/plans/payment/'+encodeURIComponent(enrollment.id));setStatus(r.status);if(r.status==='active')nav('/create-listing',{state:{message:'Payment confirmed. Create your first listing'}});else if(r.status==='failed')setError('Payment failed. Your plan has not been activated.');else setError('Payment has not been confirmed by Nuvei yet. Please check again shortly.')}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <div className="ms-page"><header className="ms-header"><Link to="/" className="ms-logo"><span>LQ</span> ListoQasa</Link></header><main className="ms-main" style={{maxWidth:620,margin:'55px auto'}}><section className="ms-card"><h1>Marketplace Checkout</h1><p>Selected plan: {planKey||'Not selected'}</p><p>Payment status: {status||'Not started'}</p>{error&&<p role="alert">{error}</p>}{status==='active'?<Link to="/create-listing">Create Your Listing</Link>:<><button className="ms-submit" disabled={busy||!planKey||!sdkReady} onClick={start}>{busy?'Please wait…':planKey?.includes('free-launch')?'Activate Free Launch Offer':'Continue to Secure Nuvei Checkout'}</button><button type="button" disabled={busy||!enrollment} onClick={check} style={{marginTop:14}}>Check Payment Status</button></>}</section></main></div>;
}
