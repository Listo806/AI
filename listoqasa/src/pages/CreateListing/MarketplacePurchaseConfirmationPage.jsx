import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {marketplaceRequest} from '../../api/marketplaceApi';
import './MarketplacePurchaseConfirmationPage.css';
export default function MarketplacePurchaseConfirmationPage(){
 const [params]=useSearchParams(),id=params.get('enrollmentId');
 const [state,setState]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let alive=true;if(!id){setError('Missing purchase reference');setLoading(false);return;}
 marketplaceRequest('/marketplace/plans/confirmation/'+encodeURIComponent(id))
 .then(data=>{if(alive)setState(data)}).catch(e=>{if(alive)setError(e.message)})
 .finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[id]);
 return <main className="lq-purchase-confirmation"><div className="lq-purchase-panel">
 <Link to="/">ListoQasa</Link>
 <h1>{loading?'Checking your payment…':state?.paymentConfirmed?'Payment confirmed':'Purchase status'}</h1>
 {error&&<p role="alert">{error}</p>}
 {state&&<><p>Plan: <strong>{state.planKey}</strong></p>
 <p>Status: <strong>{state.status}</strong></p>
 {state.paymentConfirmed?<><p>Your ListoQasa plan is active.</p>
 {state.crmEligible?<div className="lq-purchase-crm"><h2>Cortexa Real Estate CRM</h2>
 <p>Your agent plan includes Real Estate CRM eligibility. {state.crmProvisioned ? 'Your Real Estate workspace access is active. Sign in to Cortexa to continue.' : 'Your plan includes Real Estate CRM. Sign in or set up your Cortexa account to finish setup; if access is not ready, contact support.'}</p>
 <a className="lq-purchase-primary" href={state.crmUrl} target="_blank" rel="noopener noreferrer">Open / Set up Cortexa CRM</a></div>:<p>This purchase does not include Cortexa CRM access.</p>}
 <Link className="lq-purchase-secondary" to="/create-listing">Manage my listings</Link></>
 :<p>Payment has not been confirmed. No CRM access has been granted.</p>}</>}
 <p><Link to="/marketplace/subscription">View subscriptions</Link></p>
 </div></main>;
}
