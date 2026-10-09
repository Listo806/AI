import React,{useCallback,useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {getMarketplaceUser,marketplaceRequest} from '../../api/marketplaceApi';
import './MarketplaceSignupPage.css';

export default function MarketplaceSubscriptionPage(){
 const nav=useNavigate();const [items,setItems]=useState([]),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const load=useCallback(async()=>{const r=await marketplaceRequest('/marketplace/plans/mine');setItems(Array.isArray(r.data)?r.data:[]);},[]);
 useEffect(()=>{if(!getMarketplaceUser()){nav('/marketplace/login?next=/marketplace/subscription',{replace:true});return;}load().catch(e=>setError(e.message));},[nav,load]);
 const action=async(endpoint,id)=>{setBusy(id);setError('');setNotice('');try{const r=await marketplaceRequest('/marketplace/plans/'+endpoint,{method:'POST',body:JSON.stringify({enrollmentId:id})});
 if(endpoint==='renew'){const enrollment=r.enrollment;if(!enrollment?.id)throw Error('Renewal enrollment was not created');sessionStorage.setItem('listoqasa_pending_enrollment',enrollment.id);nav('/marketplace/checkout?plan='+encodeURIComponent(enrollment.plan_key)+'&billing=monthly');return;}
 setNotice(endpoint==='cancel'?'Access remains available until the current period ends.':'Cancellation request reversed. Renew manually before expiration to retain access.');await load();
 }catch(e){setError(e.message)}finally{setBusy('');}};
 return <div className="ms-page"><header className="ms-header"><Link to="/" className="ms-logo"><span>LQ</span> ListoQasa</Link></header>
 <main className="ms-main" style={{maxWidth:740,margin:'28px auto',padding:'0 16px'}}><section className="ms-card"><h1>Marketplace Subscription</h1>
 <p>Manage your paid listing access. Renewals require your approval and a new secure payment.</p>
 {error&&<p role="alert" style={{color:'#b42318'}}>{error}</p>}{notice&&<p role="status">{notice}</p>}
 {items.length===0?<p>No subscriptions yet. <Link to="/owner-plans">Choose a plan</Link>.</p>:items.map(e=><article key={e.id} style={{padding:'18px 0',borderTop:'1px solid #dce4ef'}}>
 <h2 style={{fontSize:19,margin:'0 0 8px'}}>{e.plan_key}</h2><p>Status: <strong>{e.status}</strong></p>
 <p>{e.current_period_end?'Paid through: '+new Date(e.current_period_end).toLocaleDateString():'No paid period recorded'}</p>
 {e.status==='active'&&Number(e.price_cents)>0&&<><p>{e.cancel_at_period_end?'Cancellation scheduled at period end':'Manual renewal required before expiration'}</p>
 <button disabled={!!busy} onClick={()=>action('renew',e.id)}>Renew securely</button>{' '}
 {!e.cancel_at_period_end?<button disabled={!!busy} onClick={()=>action('cancel',e.id)}>Cancel at period end</button>:<button disabled={!!busy} onClick={()=>action('resume',e.id)}>Undo cancellation</button>}</>}
 {e.status==='canceled'&&Number(e.price_cents)>0&&<button disabled={!!busy} onClick={()=>action('renew',e.id)}>Renew plan</button>}
 {e.status==='pending_payment'&&<Link to={'/marketplace/checkout?plan='+encodeURIComponent(e.plan_key)+'&billing=monthly'}>Continue or verify payment</Link>}
 </article>)}
 <p><Link to="/create-listing">Back to Create Listing</Link></p></section></main></div>;
}
