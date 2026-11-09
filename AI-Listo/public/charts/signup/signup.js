document.getElementById('signup').addEventListener('submit',async e=>{e.preventDefault();const btn=document.getElementById('submit');btn.disabled=true;try{
 const data={fullName:document.getElementById('name').value.trim(),email:document.getElementById('email').value.trim(),phone:document.getElementById('phone').value.trim(),password:document.getElementById('password').value,language:document.getElementById('language').value,role:'user'};
 const signup=await api('/auth/signup',{method:'POST',body:JSON.stringify(data)});
 const login=await api('/auth/login',{method:'POST',body:JSON.stringify({email:data.email,password:data.password})});
 if(login.requiresTwoFactor)throw Error('Account created. Please sign in using the CRM sign-in page to complete two-factor authentication, then start your trial.');
 if(!login.accessToken)throw Error('Account created. Please sign in to activate your trial.');
 localStorage.setItem('listo_access_token',login.accessToken);if(login.refreshToken)localStorage.setItem('listo_refresh_token',login.refreshToken);
 await api('/charts/trial/start',{method:'POST',body:'{}'});
 window.location.assign('/charts/open');
 }catch(err){showError('error',err.message);btn.disabled=false;}});
if(token()){document.getElementById('existing').hidden=false;document.getElementById('signup').hidden=true;document.getElementById('existing-start').addEventListener('click',async()=>{try{const result=await api('/charts/trial/start',{method:'POST',body:'{}'});if(!result.allowed)throw Error('Trial already used. Please choose a paid plan.');location.assign('/charts/open');}catch(e){showError('existing-error',e.message);}});}
