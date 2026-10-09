import React,{useEffect,useState,useCallback} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {getMarketplaceUser,marketplaceRequest} from '../../api/marketplaceApi';
import './CreateListingPage.css';
export default function MarketplaceCheckoutPage(){
 const [query]=useSearchParams(),nav=useNavigate(),planKey=query.get('plan');
 const [enrollment,setEnrollment]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{if(!getMarketplaceUser()){nav('/marketplace/login?next='+encodeURIComponent('/marketplace/checkout?plan='+planKey),{replace:true});return;}
 let alive=true;marketplaceRequest('/marketplace/plans/mine').then(r=>{if(!alive)return;const match=r.data?.find(x=>x.id===sessionStorage.getItem('listoqasa_pending_enrollment'))||r.data?.find(x=>x.plan_key===planKey);if(match){setEnrollment(match);setStatus(match.status)}else setError('No enrollment found. Select your plan again.')}).catch(e=>setError(e.message));return()=>{alive=false}},[planKey,nav]);
 const start=async()=>{setBusy(true);setError('');try{
  let e=enrollment;
  if(!e){const r=await marketplaceRequest('/marketplace/plans/enroll',{method:'POST',body:JSON.stringify({planKey})});e=r.enrollment;setEnrollment(e);if(r.next==='/create-listing'){nav('/create-listing',{state:{message:r.message}});return}}
  if(e.status==='active'){nav('/create-listing');return}
  const result=await marketplaceRequest('/marketplace/plans/checkout',{method:'POST',body:JSON.stringify({enrollmentId:e.id})});
  if(result.checkoutUrl){sessionStorage.setItem('listoqasa_pending_enrollment',e.id);window.location.assign(result.checkoutUrl)}
 }catch(err){setError(err.message)}finally{setBusy(false)}};
 const check=useCallback(async(silent=false)=>{if(!enrollment)return;if(!silent)setBusy(true);try{const r=await marketplaceRequest('/marketplace/plans/payment/'+encodeURIComponent(enrollment.id));setStatus(r.status);if(r.status==='active'){sessionStorage.removeItem('listoqasa_pending_enrollment');nav('/create-listing',{replace:true,state:{message:'Payment confirmed. Create your first listing'}})}else if(r.status==='failed')setError('Payment failed. Your plan has not been activated.');else if(!silent)setError('Payment has not been confirmed by Nuvei yet. Please check again shortly.')}catch(e){if(!silent)setError(e.message)}finally{if(!silent)setBusy(false)}},[enrollment,nav]);
 useEffect(()=>{if(!enrollment||status==='active'||status==='failed')return;const id=window.setInterval(()=>{if(document.visibilityState==='visible')check(true)},5000);check(true);return()=>window.clearInterval(id)},[enrollment,status,check]);
 return <div className="cl-page"><header className="cl-top"><Link to="/" className="cl-logo">ListoQasa</Link></header><main className="cl-main" style={{maxWidth:620,margin:'55px auto'}}><section className="cl-panel"><h1>Marketplace Checkout</h1><p>Selected plan: {planKey||'Not selected'}</p><p>Payment status: {status||'Not started'}</p>{error&&<p role="alert">{error}</p>}{status==='active'?<Link to="/create-listing">Create Your Listing</Link>:<><button className="cl-primary" disabled={busy||!planKey} onClick={start}>{busy?'Please wait…':planKey?.includes('free-launch')?'Activate Free Launch Offer':'Continue to Secure Nuvei Checkout'}</button><button type="button" disabled={busy||!enrollment} onClick={check} style={{marginTop:14}}>Check Payment Status</button></>}</section></main></div>;
}
