
const API='https://backend.cortexaaicrm.com/api';
const token=()=>localStorage.getItem('listo_access_token');
async function api(path,options={}){
 const headers={...(options.headers||{})};if(token())headers.Authorization=`Bearer ${token()}`;
 if(!(options.body instanceof FormData))headers['Content-Type']='application/json';
 const res=await fetch(API+path,{...options,headers,credentials:'include'});
 const body=await res.json().catch(()=>({}));if(!res.ok)throw Error(body.message instanceof Array?body.message.join(', '):body.message||`Request failed (${res.status})`);return body;
}
function showError(id,message){const el=document.getElementById(id);if(el){el.textContent=message;el.hidden=false;}}
