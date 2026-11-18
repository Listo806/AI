(()=>{
 'use strict';
 const landing=location.pathname.replace(/\/+$/,'/')==='/ec/es/';
 const query=new URLSearchParams(location.search);
 const ec=landing||(query.get('region')==='ec'&&query.get('lang')==='es');
 if(!ec)return;
 document.documentElement.lang='es-EC';
 const suffix=(url)=>{const u=new URL(url,location.href);if(!u.pathname.startsWith('/charts/'))return url;u.searchParams.set('region','ec');u.searchParams.set('lang','es');return u.pathname+u.search+u.hash;};
 if(landing){try{sessionStorage.setItem('charts_ec_entry',location.href)}catch(_){}
   try{localStorage.setItem('cortexa_charts_language','es')}catch(_){}
   // Ensure translations run after landing dictionary initializes.
   document.querySelector('#charts-language-menu [data-language="es"]')?.click();
 }
 // Preserve explicit region on all Charts pricing, signup, login, checkout and offer links.
 function updateLinks(){document.querySelectorAll('a[href]').forEach(a=>{
   if(a.dataset.ecLocaleDone)return;
   const u=new URL(a.getAttribute('href'),location.href);
   if(!u.pathname.startsWith('/charts/'))return;
   if(u.pathname==='/charts/'&&landing){a.href='/ec/es/';a.dataset.ecLocaleDone='1';return;}
   if(/\/(pricing|signup|login|checkout)\/?$/.test(u.pathname)){
      a.href=suffix(u.href);a.dataset.ecLocaleDone='1';
   }
 });}
 updateLinks();
 const translations={
  'Pricing':'Precios','Monthly':'Mensual','Annual':'Anual','Choose monthly ↗':'Elegir mensual ↗','Choose annual ↗':'Elegir anual ↗',
  'Create account — Cortexa Charts':'Crear cuenta — Cortexa Charts','Create your account':'Crea tu cuenta','Create account →':'Crear cuenta →',
  'Full name':'Nombre completo','Email address':'Correo electrónico','Password (at least 8 characters)':'Contraseña (mínimo 8 caracteres)',
  'Sign in':'Iniciar sesión','Already have an account?':'¿Ya tienes una cuenta?',
  'YOUR MARKET. YOUR WORKSPACE.':'TU MERCADO. TU ESPACIO DE TRABAJO.',
  'CORTEXA ACCOUNT':'CUENTA CORTEXA',
  'Secure Bank Transfer Checkout · Cortexa Charts':'Pago seguro por transferencia bancaria · Cortexa Charts',
  'Back to pricing':'Volver a precios','Your selected plan':'Tu plan seleccionado',
  'Secure checkout.':'Pago seguro.','Bank Transfer':'Transferencia bancaria',
  'Create payment reference':'Generar referencia de pago','Bank transaction reference':'Referencia de transferencia bancaria',
  'Submit payment proof':'Enviar comprobante de pago',
  'Payment proof (JPEG, PNG or PDF; max 5 MB)':'Comprobante (JPEG, PNG o PDF; máximo 5 MB)',
  'Monthly Plan':'Plan mensual','Annual Plan':'Plan anual','Special Annual Offer':'Oferta anual especial',
  'Get Started':'Comenzar','Log in':'Iniciar sesión',
  'Please review and acknowledge the billing terms.':'Revisa y acepta las condiciones de pago.',
  'Please':'Por favor', 'sign in':'inicia sesión','create an account':'crea una cuenta',
  'before checkout.':'antes de continuar al pago.'
 };
 const replacements=[
  [/Review your order and transfer the exact amount to the verified bank account\. Your paid subscription activates only after an administrator verifies your payment\./g,'Revisa tu pedido y transfiere el importe exacto a la cuenta bancaria verificada. Tu suscripción se activará únicamente después de la aprobación del administrador.'],
  [/Bank transfer only\. No automatic debit\. Any applicable taxes must be confirmed before payment\. Annual is one upfront payment for a full year, not monthly installments\./g,'Solo transferencia bancaria. No se realiza ningún débito automático. Confirma los impuestos aplicables antes de pagar. El plan anual se paga por adelantado por 12 meses, no en cuotas mensuales.'],
  [/I understand the upfront charge, the 12-month term for annual plans, and that renewal and cancellation terms must be confirmed before payment\./g,'Entiendo el importe inicial, la vigencia de 12 meses de los planes anuales y que debo confirmar las condiciones de renovación y cancelación antes de pagar.'],
  [/No automatic debit is initiated by this bank-transfer checkout\. Future renewal terms must be disclosed and agreed before any future charge\./g,'Esta compra mediante transferencia bancaria no genera débitos automáticos. Las condiciones de renovación deben comunicarse y aceptarse antes de cualquier cobro futuro.'],
  [/Transfer the exact confirmed amount using this reference\./g,'Transfiere el importe exacto confirmado usando esta referencia.'],
  [/Create your Cortexa account to continue with your selected Charts plan\./g,'Crea tu cuenta Cortexa para continuar con el plan Charts seleccionado.'],
  [/Email me optional product news and marketing updates \(optional\)\./g,'Deseo recibir novedades y comunicaciones de marketing (opcional).'],
  [/You can unsubscribe at any time\. Your marketing preference must be saved by the account service\./g,'Puedes cancelar la suscripción a las comunicaciones en cualquier momento.'],
  [/\$804 billed upfront for 12 months\./g,'$804 pagados por adelantado por 12 meses.'],
  [/\$97 billed each month\./g,'$97 al mes.']
 ];
 function translate(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes){if(n.parentElement?.closest('#charts-language'))continue;
   const raw=n.nodeValue,trim=raw.trim();if(!trim)continue;
   if(translations[trim])n.nodeValue=raw.replace(trim,translations[trim]);
   else {let next=raw;for(const [pattern,sub] of replacements)next=next.replace(pattern,sub);if(next!==raw)n.nodeValue=next;}
  }
  if(location.pathname.includes('/checkout/')){
   const title=document.querySelector('#plan');if(title){const p=new URLSearchParams(location.search);title.textContent=p.get('offer')==='exit444'?'Oferta anual especial':p.get('billing')==='annual'?'Plan anual':'Plan mensual';}
  }
 }
 // Defer until original page scripts have set the initial plan text.
 queueMicrotask(translate);
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a)return;const u=new URL(a.href,location.href);if(/\/(pricing|signup|login|checkout)\/?$/.test(u.pathname)){a.href=suffix(a.href);}},true);
 // Update links after page scripts change them, without looping on text mutations.
 const observer=new MutationObserver(m=>{if(m.some(x=>x.type==='childList'))updateLinks();});observer.observe(document.body,{subtree:true,childList:true});
})();