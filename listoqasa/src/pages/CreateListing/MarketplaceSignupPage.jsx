import React,{useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {marketplaceRequest} from '../../api/marketplaceApi';
import './CreateListingPage.css';
export default function MarketplaceSignupPage(){
 const [query]=useSearchParams(),navigate=useNavigate();
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const audience=query.get('audience')==='agent'?'agent':'owner';const selected=query.get('plan')||'standard';
 const planKey=selected.startsWith('agent-')||selected.startsWith('owner-')?selected:`${audience}-${selected}`;
 const submit=async(e)=>{e.preventDefault();setBusy(true);setError('');try{
  const signup=await marketplaceRequest('/auth/signup',{method:'POST',body:JSON.stringify({email,password,role:audience==='agent'?'agent':'owner'})});
  let auth=signup.accessToken?signup:await marketplaceRequest('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
  if(auth.requiresTwoFactor)throw Error('Please sign in and complete two-factor verification.');
  if(!auth.accessToken)throw Error('Sign in to finish enrollment.');
  localStorage.setItem('listo_access_token',auth.accessToken);
  if(auth.refreshToken)localStorage.setItem('listo_refresh_token',auth.refreshToken);
  localStorage.setItem('listo_user',JSON.stringify({...auth.user,name:name.trim()}));
  const result=await marketplaceRequest('/marketplace/plans/enroll',{method:'POST',body:JSON.stringify({planKey})});
  navigate(result.next||'/marketplace/checkout',{replace:true,state:{message:result.message,planKey}});
 }catch(err){setError(err.message)}finally{setBusy(false)}};
 return <div className="cl-page"><header className="cl-top"><Link to="/" className="cl-logo">ListoQasa</Link></header><main className="cl-main" style={{maxWidth:540,margin:'50px auto'}}><section className="cl-panel"><h1>Create Your Account</h1><p>Selected plan: {planKey}</p><form onSubmit={submit}><label className="cl-field">Full Name<input required value={name} onChange={e=>setName(e.target.value)}/></label><label className="cl-field">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="cl-field">Create Your Password<input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className="cl-primary" disabled={busy}>{busy?'Creating account...':'Create Your Account'}</button></form><p>Already have an account? <Link to={`/marketplace/login?next=${encodeURIComponent('/marketplace/checkout?plan='+planKey)}`}>Sign in</Link></p></section></main></div>
}
