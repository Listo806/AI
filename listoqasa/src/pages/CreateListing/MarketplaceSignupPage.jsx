import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { marketplaceRequest } from '../../api/marketplaceApi';
import './MarketplaceSignupPage.css';

const allowed = { owner: ['standard','enhanced','maximum','free'], agent: ['essential','growth','free'] };
const saveSession = (result) => {
  if (!result?.accessToken || !result?.user?.id) throw new Error('Registration did not return a valid account session.');
  localStorage.setItem('listo_access_token', result.accessToken);
  if (result.refreshToken) localStorage.setItem('listo_refresh_token', result.refreshToken);
  localStorage.setItem('listo_user', JSON.stringify(result.user));
};
export default function MarketplaceSignupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const role = (params.get('audience') === 'agent' || params.get('role') === 'agent') ? 'agent' : 'owner';
  const rawPlan = params.get('plan') || '';
  const plan = rawPlan.replace(/^(owner|agent)-/, '');
  const planKey = `${role}-${plan === 'free' ? 'free-launch' : plan}`;
  const billing = params.get('billing') === 'yearly' ? 'yearly' : 'monthly';
  const valid = allowed[role].includes(plan);
  const [form,setForm] = useState({name:'',email:'',password:'',confirm:''});
  const [visible,setVisible] = useState(false);
  const [confirmVisible,setConfirmVisible] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const destination = `/marketplace/checkout?plan=${encodeURIComponent(planKey)}&billing=${billing}`;
  const update = (key,value) => setForm(f=>({...f,[key]:value}));
  async function submit(e) {
    e.preventDefault(); setError('');
    if (!valid) return setError('Select a valid listing plan first.');
    if (form.password.length < 8) return setError('Password must contain at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      const result = await marketplaceRequest('/auth/signup', {method:'POST',body:JSON.stringify({email:form.email.trim().toLowerCase(),password:form.password,role,fullName:form.name.trim()})});
      saveSession(result);
      const enrollment = await marketplaceRequest('/marketplace/plans/enroll', {method:'POST',body:JSON.stringify({planKey})});
      if (enrollment?.enrollment?.id) sessionStorage.setItem('listoqasa_pending_enrollment', enrollment.enrollment.id);
      if (enrollment?.next === '/create-listing' || enrollment?.enrollment?.status === 'active') { navigate('/create-listing',{replace:true,state:{message:enrollment.message || 'Your account is ready. Create your first listing'}}); return; }
      navigate(`/marketplace/checkout?plan=${encodeURIComponent(planKey)}&billing=${billing}`,{replace:true,state:{planKey}});
    } catch(e) {setError(e.message || 'Unable to create account.');} finally {setBusy(false);}
  }
  return <div className="ms-page"><main className="ms-main"><div className="ms-steps"><strong>● Account</strong><span>──── ● Checkout</span><span>──── ● Create Listing</span></div><section className="ms-card"><h1>Create Your Account</h1><p>Create an account to list and manage your properties.</p>{!valid&&<p className="ms-error">Please select a plan before creating your account. <Link to={role==='agent'?'/agent-plans':'/owner-plans'}>View plans</Link></p>}<form onSubmit={submit}><label>Full Name<input required autoComplete="name" value={form.name} onChange={e=>update('name',e.target.value)}/></label><label>Email Address<input required type="email" autoComplete="email" value={form.email} onChange={e=>update('email',e.target.value)}/></label><label>Create Your Password<div className="ms-password"><input required type={visible?'text':'password'} autoComplete="new-password" value={form.password} onChange={e=>update('password',e.target.value)}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?'Hide password':'Show password'}>{visible?<Eye size={20}/>:<EyeOff size={20}/>}</button></div></label><label>Confirm Your Password<div className="ms-password"><input required type={confirmVisible?'text':'password'} autoComplete="new-password" value={form.confirm} onChange={e=>update('confirm',e.target.value)}/><button type="button" onClick={()=>setConfirmVisible(!confirmVisible)} aria-label={confirmVisible?'Hide confirmation password':'Show confirmation password'}>{confirmVisible?<Eye size={20}/>:<EyeOff size={20}/>}</button></div></label>{error&&<p role="alert" className="ms-error">{error}</p>}<button className="ms-submit" disabled={busy||!valid}>{busy?'Creating account...':'Create Account & Continue'} <ArrowRight size={19}/></button></form><p className="ms-signin">Already have an account? <Link to={`/marketplace/login?next=${encodeURIComponent(destination)}`}>Sign in</Link></p></section></main></div>;
}
