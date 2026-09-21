import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, BarChart3, Bot, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleDot, Globe2, Headphones, Info, Monitor, Phone, Send, ShoppingCart,
  Sparkles, UserRound, Wrench
} from "lucide-react"; 
import { setupApi } from "./setupApi";
import { useSetup } from "./useSetup";
import { setupLanguage } from "./setupTranslations";
import "./setup.css";
import "./setup-assistance-pass5.css";

const COPY={
 en:{
  crumb:["Setup","Setup & Website Assistance"],title:"Setup & Website Assistance",
  sub:"Need help connecting your website, phone, WhatsApp, or customer flow? Our team can help.",
  newReq:"New request",back:"Back to Setup",request:"Request assistance",
  requestSub:"Tell us what you need help with. We’ll review your setup and contact you with next steps.",
  aiTitle:"AI Agent Setup Assistance",aiSub:"Help configuring your AI Agent, channels, routing, conversion goals, testing, and launch.",
  webTitle:"Website & Connection Assistance",webSub:"Help adding website buttons, connecting forms, tracking sources, phone, WhatsApp, and customer entry points.",
  labels:{businessName:"Business name",workspace:"Workspace",contactName:"Contact name",contactEmail:"Email",phoneOrWhatsApp:"Phone",websiteUrl:"Website",servicesOrProducts:"Services / Products",businessHours:"Business hours",mainConversionGoal:"Main conversion goal",existingWhatsAppNumber:"Existing WhatsApp",businessPhone:"Business phone",marketingTrafficPages:"Marketing / traffic pages",preferredEntryPoint:"Preferred entry point",additionalInstructions:"Additional instructions"},
  placeholders:{businessName:"Auzalab",contactName:"John Smith",contactEmail:"john@auzalab.com",phoneOrWhatsApp:"+1 (305) 555-0123",websiteUrl:"https://auzalab.com",servicesOrProducts:"Coconut beverages, tasting boxes...",businessHours:"Mon–Fri, 9:00 AM–6:00 PM",marketingTrafficPages:"Instagram, Meta Ads, Google Ads...",preferredEntryPoint:"Website product page",additionalInstructions:"Tell us anything else our team should know about your current setup or desired customer journey."},
  desired:"Desired action",actions:["Purchase","Appointment","Quote","Viewing","Demo","Support"],
  notice:"Custom setup and website implementation are optional paid services quoted separately based on your requirements.",
  note:"Submitting this form does not start paid work. Our team will review your request and contact you before any paid implementation begins.",
  submit:"Request Assistance",connect:"What our team can connect",
  connectItems:["Website buttons & CTAs","Website forms & lead capture","Business phone, voice & SMS","WhatsApp customer entry","Marketing & campaign links","Source & campaign tracking","CRM pipeline routing","Human handoff flow"],
  flow:"Required customer flow",flowSub:"We’ll help verify this customer journey is connected correctly.",
  flowItems:["Customer entry point","Cortexa AI Agent","Contact captured","CRM record created","Source recorded","Pipeline updated","Conversion action or human handoff"],
  flowNote:"Primary conversion action should appear above WhatsApp whenever both are used.",
  status:"Request status",notSubmitted:"Not submitted",statusSub:"Submit the form to create your assistance request.",
  statuses:["Submitted","Reviewing","Quote Sent","Approved","In Progress","Complete"],
  current:"Current request",response:"Latest response"
 },
 es:{
  crumb:["Configuración","Asistencia de configuración y sitio web"],title:"Asistencia de configuración y sitio web",sub:"¿Necesitas ayuda para conectar tu sitio web, teléfono, WhatsApp o flujo de clientes? Nuestro equipo puede ayudarte.",newReq:"Nueva solicitud",back:"Volver a Configuración",request:"Solicitar asistencia",requestSub:"Cuéntanos qué necesitas. Revisaremos tu configuración y te contactaremos con los siguientes pasos.",aiTitle:"Asistencia de configuración del agente de IA",aiSub:"Ayuda con el agente de IA, canales, enrutamiento, objetivos de conversión, pruebas y lanzamiento.",webTitle:"Asistencia de sitio web y conexiones",webSub:"Ayuda con botones, formularios, fuentes, teléfono, WhatsApp y puntos de entrada.",labels:{businessName:"Nombre del negocio",workspace:"Espacio de trabajo",contactName:"Nombre de contacto",contactEmail:"Email",phoneOrWhatsApp:"Teléfono",websiteUrl:"Sitio web",servicesOrProducts:"Servicios / Productos",businessHours:"Horario comercial",mainConversionGoal:"Objetivo principal",existingWhatsAppNumber:"WhatsApp existente",businessPhone:"Teléfono comercial",marketingTrafficPages:"Marketing / páginas de tráfico",preferredEntryPoint:"Punto de entrada preferido",additionalInstructions:"Instrucciones adicionales"},placeholders:{additionalInstructions:"Cuéntanos cualquier otra información sobre tu configuración actual o el recorrido deseado."},desired:"Acción deseada",actions:["Compra","Cita","Cotización","Visita","Demo","Soporte"],notice:"Los servicios personalizados de configuración e implementación del sitio web son opcionales y se cotizan por separado según sus requisitos.",note:"Enviar este formulario no inicia trabajo pagado. Nuestro equipo revisará tu solicitud y te contactará antes de comenzar cualquier implementación pagada.",submit:"Solicitar asistencia",connect:"Lo que nuestro equipo puede conectar",connectItems:["Botones y CTA del sitio web","Formularios y captura de leads","Teléfono comercial, voz y SMS","Entrada de clientes por WhatsApp","Enlaces de marketing y campañas","Seguimiento de fuentes y campañas","Enrutamiento del pipeline CRM","Flujo de transferencia humana"],flow:"Flujo de cliente requerido",flowSub:"Ayudaremos a verificar que este recorrido esté conectado correctamente.",flowItems:["Punto de entrada del cliente","Agente de IA Cortexa","Contacto capturado","Registro CRM creado","Origen registrado","Pipeline actualizado","Conversión o transferencia humana"],flowNote:"La acción de conversión principal debe aparecer encima de WhatsApp cuando se usen ambos.",status:"Estado de solicitud",notSubmitted:"No enviada",statusSub:"Envía el formulario para crear tu solicitud.",statuses:["Enviada","Revisando","Cotización enviada","Aprobada","En progreso","Completa"],current:"Solicitud actual",response:"Última respuesta"
 },
 pt:{
  crumb:["Configuração","Assistência de configuração e site"],title:"Assistência de configuração e site",sub:"Precisa de ajuda para conectar seu site, telefone, WhatsApp ou fluxo de clientes? Nossa equipe pode ajudar.",newReq:"Nova solicitação",back:"Voltar à Configuração",request:"Solicitar assistência",requestSub:"Conte-nos do que precisa. Revisaremos sua configuração e entraremos em contato com os próximos passos.",aiTitle:"Assistência de configuração do agente de IA",aiSub:"Ajuda com agente de IA, canais, roteamento, metas de conversão, testes e lançamento.",webTitle:"Assistência de site e conexões",webSub:"Ajuda com botões, formulários, fontes, telefone, WhatsApp e pontos de entrada.",labels:{businessName:"Nome da empresa",workspace:"Workspace",contactName:"Nome do contato",contactEmail:"Email",phoneOrWhatsApp:"Telefone",websiteUrl:"Site",servicesOrProducts:"Serviços / Produtos",businessHours:"Horário comercial",mainConversionGoal:"Meta principal",existingWhatsAppNumber:"WhatsApp existente",businessPhone:"Telefone comercial",marketingTrafficPages:"Marketing / páginas de tráfego",preferredEntryPoint:"Ponto de entrada preferido",additionalInstructions:"Instruções adicionais"},placeholders:{additionalInstructions:"Conte-nos qualquer outra informação sobre sua configuração atual ou jornada desejada."},desired:"Ação desejada",actions:["Compra","Agendamento","Orçamento","Visita","Demo","Suporte"],notice:"Os serviços personalizados de configuração e implementação do site são opcionais e cotados separadamente com base em seus requisitos.",note:"Enviar este formulário não inicia trabalho pago. Nossa equipe revisará sua solicitação e entrará em contato antes de qualquer implementação paga.",submit:"Solicitar assistência",connect:"O que nossa equipe pode conectar",connectItems:["Botões e CTAs do site","Formulários e captura de leads","Telefone comercial, voz e SMS","Entrada de clientes pelo WhatsApp","Links de marketing e campanhas","Rastreamento de fontes e campanhas","Roteamento do pipeline CRM","Fluxo de transferência humana"],flow:"Fluxo de cliente obrigatório",flowSub:"Ajudaremos a verificar se esta jornada está conectada corretamente.",flowItems:["Ponto de entrada do cliente","Agente de IA Cortexa","Contato capturado","Registro CRM criado","Origem registrada","Pipeline atualizado","Conversão ou transferência humana"],flowNote:"A ação de conversão principal deve aparecer acima do WhatsApp quando ambos forem usados.",status:"Status da solicitação",notSubmitted:"Não enviada",statusSub:"Envie o formulário para criar sua solicitação.",statuses:["Enviada","Em análise","Cotação enviada","Aprovada","Em andamento","Concluída"],current:"Solicitação atual",response:"Resposta mais recente"
 }
};
const FIELDS=["businessName","workspace","contactName","contactEmail","phoneOrWhatsApp","websiteUrl","servicesOrProducts","businessHours","mainConversionGoal","existingWhatsAppNumber","businessPhone","marketingTrafficPages","preferredEntryPoint"];

export default function SetupAssistance(){
 const navigate=useNavigate();const {i18n}=useTranslation();const lang=setupLanguage(i18n);const t=COPY[lang]||COPY.en;
 const {data,load}=useSetup();const [form,setForm]=useState({assistanceType:"Website & Connection Assistance",desiredAction:"Purchase"});const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!data)return;setForm(v=>({...v,workspace:data.workspace_id||"",mainConversionGoal:data.selected_objective||"",websiteUrl:v.websiteUrl||data.config?.website?.url||"",businessPhone:v.businessPhone||data.config?.phone?.number||"",existingWhatsAppNumber:v.existingWhatsAppNumber||data.config?.whatsapp?.number||""}))},[data]);
 if(!data)return <main className="setup-shell pass5-page">Loading…</main>;
 const req=data.assistanceRequest;
 const update=(k,v)=>setForm(x=>({...x,[k]:v}));
 const submit=async()=>{setBusy(true);setMessage("");try{const r=await setupApi.assist(form, data?.workspace_id);setMessage(r.duplicate?`Existing request ${r.request.request_code} is still open.`:`Request ${r.request.request_code} submitted successfully.`);await load()}catch(e){setMessage(e?.message||"Unable to submit assistance request.")}finally{setBusy(false)}};
 const connectIcons=[Globe2,Phone,Sparkles,BarChart3,CalendarDays,ShoppingCart,UserRound];
 const connectItems = lang==="es"
  ? ["Puntos de entrada web y publicidad","Teléfono comercial y WhatsApp","Agente de IA Cortexa y CRM","Seguimiento de campañas y captura de origen","Pipelines y citas","Checkout, cotizaciones, demos y soporte","Transferencia humana"]
  : lang==="pt"
  ? ["Pontos de entrada do site e publicidade","Telefone comercial e WhatsApp","Agente de IA Cortexa e CRM","Rastreamento de campanhas e captura de origem","Pipelines e agendamentos","Checkout, orçamentos, demos e suporte","Transferência humana"]
  : ["Website & advertising entry points","Business phone & WhatsApp","Cortexa AI Agent & CRM","Campaign tracking & source capture","Pipelines & appointments","Checkout, quotes, demos & support","Human handoff"];

 const goalOptions=[
  "Capture and qualify leads","Answer customer questions","Book appointments",
  "Provide quotes","Help customers purchase","Follow up with customers",
  "Provide customer support","Route customers to correct person"
 ];
 const entryOptions=["Website — Primary CTA","Website form","Business phone","WhatsApp","Marketing / campaign page"];
 const workspaceOptions=[data.workspace_id, data.workspace?.name, data.workspace_name].filter(Boolean);
 const currentStatus=req?.status||"Not submitted";
 const statusIndex=Math.max(0,["Submitted","Reviewing","Quote Sent","Approved","In Progress","Complete"].findIndex(x=>x.toLowerCase()===String(req?.status||"").toLowerCase()));

 return <main className="setup-shell pass5-page">
  <div className="p5-crumb"><span>{t.crumb[0]}</span><ChevronRight/><b>{t.crumb[1]}</b></div>

  <header className="p5-header">
   <span className="p5-title-icon"><Wrench/></span>
   <div>
    <h1>{t.title}</h1>
    <p>{lang==="en"?"Tell us what you need. Our team will review your setup and recommend the right implementation.":t.sub}</p>
   </div>
   <span className="p5-new"><CircleDot/>{req?req.status:t.newReq}</span>
   <button onClick={()=>navigate("/dashboard/ai-cortexa-setup")}><ArrowLeft/>{t.back}</button>
  </header>

  <div className="p5-layout">
   <section className="p5-form-card">
    <div className="p5-card-head">
     <h2>{t.request}</h2>
     <p>{lang==="en"?"Complete the details below so the correct Cortexa team can review your request.":t.requestSub}</p>
    </div>

    <div className="p5-assistance-label">{lang==="en"?"Assistance type":lang==="es"?"Tipo de asistencia":"Tipo de assistência"}</div>
    <div className="p5-types">
     <button type="button" className={form.assistanceType==="AI Agent Setup Assistance"?"active":""} onClick={()=>update("assistanceType","AI Agent Setup Assistance")}>
      <span><Sparkles/></span>
      <section><b>{t.aiTitle}</b><small>{lang==="en"?"Training, behavior, routing, testing, or launch support.":t.aiSub}</small></section>
      <i className="p5-radio">{form.assistanceType==="AI Agent Setup Assistance"&&<b/>}</i>
     </button>
     <button type="button" className={form.assistanceType==="Website & Connection Assistance"?"active":""} onClick={()=>update("assistanceType","Website & Connection Assistance")}>
      <span><Monitor/></span>
      <section><b>{t.webTitle}</b><small>{lang==="en"?"Website, advertising, phone, WhatsApp, and system connections.":t.webSub}</small></section>
      <i className="p5-radio">{form.assistanceType==="Website & Connection Assistance"&&<b/>}</i>
     </button>
    </div>

    <div className="p5-fields">
     <label><span>{t.labels.businessName}</span><input value={form.businessName||""} placeholder="Your business" onChange={e=>update("businessName",e.target.value)}/></label>
     <label><span>{t.labels.workspace}</span><select value={form.workspace||""} onChange={e=>update("workspace",e.target.value)}><option value={form.workspace||""}>{data.workspace?.name||data.workspace_name||form.workspace||"Default workspace"}</option>{workspaceOptions.filter(x=>x!==form.workspace).map(x=><option key={x} value={x}>{x}</option>)}</select></label>
     <label><span>{t.labels.contactName}</span><input value={form.contactName||""} placeholder="Contact name" onChange={e=>update("contactName",e.target.value)}/></label>

     <label><span>{t.labels.contactEmail}</span><input type="email" value={form.contactEmail||""} placeholder="name@company.com" onChange={e=>update("contactEmail",e.target.value)}/></label>
     <label><span>{lang==="en"?"Phone / WhatsApp":t.labels.phoneOrWhatsApp}</span><input value={form.phoneOrWhatsApp||""} placeholder="+1 ..." onChange={e=>update("phoneOrWhatsApp",e.target.value)}/></label>
     <label><span>{lang==="en"?"Website URL":t.labels.websiteUrl}</span><input value={form.websiteUrl||""} placeholder="https://yourbusiness.com" onChange={e=>update("websiteUrl",e.target.value)}/></label>

     <label><span>{lang==="en"?"Services or products":t.labels.servicesOrProducts}</span><input value={form.servicesOrProducts||""} placeholder="Describe your services or products" onChange={e=>update("servicesOrProducts",e.target.value)}/></label>
     <label><span>{t.labels.businessHours}</span><input value={form.businessHours||""} placeholder="Business hours" onChange={e=>update("businessHours",e.target.value)}/></label>
     <label><span>{t.labels.mainConversionGoal}</span><select value={form.mainConversionGoal||""} onChange={e=>update("mainConversionGoal",e.target.value)}>{goalOptions.map(x=><option key={x} value={x}>{x}</option>)}</select></label>

     <label><span>{t.labels.existingWhatsAppNumber}</span><input value={form.existingWhatsAppNumber||""} placeholder="+1 ..." onChange={e=>update("existingWhatsAppNumber",e.target.value)}/></label>
     <label><span>{t.labels.businessPhone}</span><input value={form.businessPhone||""} placeholder="+1 ..." onChange={e=>update("businessPhone",e.target.value)}/></label>
     <label><span>{lang==="en"?"Marketing-traffic pages":t.labels.marketingTrafficPages}</span><input value={form.marketingTrafficPages||""} placeholder="Homepage, product pages, Google Ads landing page" onChange={e=>update("marketingTrafficPages",e.target.value)}/></label>

     <label><span>{t.labels.preferredEntryPoint}</span><select value={form.preferredEntryPoint||"Website — Primary CTA"} onChange={e=>update("preferredEntryPoint",e.target.value)}>{entryOptions.map(x=><option key={x}>{x}</option>)}</select></label>
     <label><span>{t.desired}</span><select value={form.desiredAction||"Purchase"} onChange={e=>update("desiredAction",e.target.value)}>{["Purchase","Appointment","Quote","Viewing","Demo","Support"].map(x=><option key={x}>{x}</option>)}</select></label>
     <div className="p5-empty-cell"/>
    </div>

    <div className="p5-action-chips">
     {t.actions.map((x,i)=>{const value=["Purchase","Appointment","Quote","Viewing","Demo","Support"][i];return <button type="button" key={x} className={form.desiredAction===value?"active":""} onClick={()=>update("desiredAction",value)}>{form.desiredAction===value&&<Check/>}{x}</button>})}
    </div>

    <label className="p5-instructions">
     <span>{t.labels.additionalInstructions}</span>
     <textarea rows="3" value={form.additionalInstructions||""} placeholder={lang==="en"?"Connect our primary website button and advertising landing pages to the AI-assisted purchase flow.\nEscalate complex requests to the sales team.":t.placeholders.additionalInstructions} onChange={e=>update("additionalInstructions",e.target.value)}/>
    </label>

    <div className="p5-paid"><Info/><b>{t.notice}</b></div>
    <div className="p5-submit-row">
     <p>{lang==="en"?"Your request will be saved to your Cortexa account.":t.note}</p>
     <button disabled={busy||!!req} onClick={submit}><Send/>{busy?"Submitting…":t.submit}</button>
    </div>
    {message&&<div className="p5-message">{message}</div>}
   </section>

   <aside className="p5-right">
    <section className="p5-side-card p5-connect">
     <h2>{t.connect}</h2>
     <div className="p5-connect-list">
      {connectItems.map((x,i)=>{const I=connectIcons[i];return <div key={x}><span><I/></span><b>{x}</b></div>})}
     </div>
    </section>

    <section className="p5-side-card p5-flow">
     <h2>{t.flow}</h2>
     <p>{t.flowSub}</p>
     <div className="p5-flow-list">
      {(lang==="en"?["Customer entry point","Cortexa AI Agent","Contact captured","CRM record created","Source recorded","Correct pipeline selected","Conversion or human handoff"]:t.flowItems).map((x,i)=>
       <div className="p5-flow-row" key={x}><span>{i+1}</span><b>{x}</b>{i<6&&<i>↓</i>}</div>
      )}
     </div>
     <aside><Info/><span>{lang==="en"?"The primary conversion action remains above WhatsApp. WhatsApp enters the AI-assisted Cortexa flow—not an unmanaged inbox.":t.flowNote}</span></aside>
    </section>

    <section className="p5-side-card p5-status">
     <header><h2>{t.status}</h2><span className={req?"submitted":""}><i/>{req?req.status:t.notSubmitted}</span></header>
     <div className="p5-status-grid">
      {t.statuses.map((x,i)=><div key={x} className={req&&i<=statusIndex?"active":""}><span>{x}</span>{i<t.statuses.length-1&&<b>→</b>}</div>)}
     </div>
     <p>{req?(req.latest_response||"You’ll be notified whenever the status or team response changes."):(lang==="en"?"You’ll be notified whenever the status or team response changes.":t.statusSub)}</p>
     {req&&<div className="p5-request-code"><b>{t.current}</b><strong>{req.request_code}</strong></div>}
    </section>
   </aside>
  </div>
 </main>
}