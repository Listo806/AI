import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
export default function ChartsLaunch() {
 const {loading,isAuthenticated} = useAuth();
 const [error,setError]=useState('');
 useEffect(()=>{
  if(loading)return;
  if(!isAuthenticated()){window.location.replace('/sign-in');return;}
  const token=localStorage.getItem('listo_access_token');
  if(!token){setError('Please sign in again.');return;}
  const api=(import.meta.env.VITE_API_BASE_URL || 'https://backend.cortexaaicrm.com/api').replace(/\/$/,'');
  fetch(`${api}/charts/session`,{method:'POST',credentials:'include',headers:{Authorization:`Bearer ${token}`}})
   .then(async r=>{if(!r.ok)throw Error(r.status===403?'This account is not authorized for Charts.':'Unable to establish Charts session.');window.location.replace('/charts/app/');})
   .catch(e=>setError(e.message));
 },[loading,isAuthenticated]);
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#050b19',color:'white',fontFamily:'system-ui'}}><div role="status">{error || 'Opening Cortexa Charts…'}</div></main>;
}
