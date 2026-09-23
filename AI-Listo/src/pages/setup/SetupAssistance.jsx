import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Database, Bot, Check, CheckCircle2, ChevronRight, Circle,
  CircleDot, Clock3, Code2, Globe2, Headphones, Info, Link2, Megaphone,
  MessageCircle, Phone, Send, Settings2, ShieldCheck, Sparkles, Wrench
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
  placeholders:{businessName:"Your business name",contactName:"Contact name",contactEmail:"name@company.com",phoneOrWhatsApp:"Phone or WhatsApp",websiteUrl:"https://yourcompany.com",servicesOrProducts:"Describe your services or products",businessHours:"Business hours",marketingTrafficPages:"Marketing or traffic pages",preferredEntryPoint:"Preferred customer entry point",additionalInstructions:"Tell us anything else our team should know about your current setup or desired customer journey."},
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
 const {data,load}=useSetup();const [form,setForm]=useState({assistanceType:"AI Agent Setup Assistance",desiredAction:"Purchase"});const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!data)return;setForm(v=>({...v,workspace:data.workspace_id||"",mainConversionGoal:data.selected_objective||"",websiteUrl:v.websiteUrl||data.config?.website?.url||"",businessPhone:v.businessPhone||data.config?.phone?.number||"",existingWhatsAppNumber:v.existingWhatsAppNumber||data.config?.whatsapp?.number||""}))},[data]);
 if(!data)return <main className="setup-shell pass5-page">Loading…</main>;
 const req=data.assistanceRequest;
 const history=Array.isArray(data.assistanceHistory)?data.assistanceHistory:[];
 const canonicalStatuses=["Submitted","Reviewing","Quote Sent","Approved","In Progress","Complete"];
 const statusIndex=req?Math.max(0,canonicalStatuses.indexOf(req.status)):-1;
 const update=(k,v)=>setForm(x=>({...x,[k]:v}));
 const submit=async()=>{setBusy(true);setMessage("");try{const r=await setupApi.assist(form);setMessage(r.duplicate?`Existing request ${r.request.request_code} is still open.`:`Request ${r.request.request_code} submitted successfully.`);await load()}catch(e){setMessage(e?.message||"Unable to submit assistance request.")}finally{setBusy(false)}};
 const iconMap=[Globe2,Code2,Phone,MessageCircle,Megaphone,Link2,Database,Headphones];
 return <main className="setup-shell pass5-page">
  <div className="p5-crumb"><span>{t.crumb[0]}</span><ChevronRight/><b>{t.crumb[1]}</b></div>
  <header className="p5-header"><span className="p5-title-icon"><Wrench/></span><div><h1>{t.title}</h1><p>{t.sub}</p></div><span className="p5-new"><CircleDot/>{req?req.status:t.newReq}</span><button onClick={()=>navigate("/dashboard/ai-cortexa-setup")}><ArrowLeft/>{t.back}</button></header>
  <div className="p5-layout">
   <section className="p5-form-card">
    <div className="p5-card-head"><h2>{t.request}</h2><p>{t.requestSub}</p></div>
    <div className="p5-types">
     <button className={form.assistanceType==="AI Agent Setup Assistance"?"active":""} onClick={()=>update("assistanceType","AI Agent Setup Assistance")}><span><Bot/></span><section><b>{t.aiTitle}</b><small>{t.aiSub}</small></section>{form.assistanceType==="AI Agent Setup Assistance"&&<CheckCircle2/>}</button>
     <button className={form.assistanceType==="Website & Connection Assistance"?"active":""} onClick={()=>update("assistanceType","Website & Connection Assistance")}><span><Globe2/></span><section><b>{t.webTitle}</b><small>{t.webSub}</small></section>{form.assistanceType==="Website & Connection Assistance"&&<CheckCircle2/>}</button>
    </div>
    <div className="p5-fields">{FIELDS.map(k=><label key={k}><span>{t.labels[k]}</span><input disabled={k==="workspace"} value={form[k]||""} placeholder={t.placeholders?.[k]||""} onChange={e=>update(k,e.target.value)}/></label>)}</div>
    <div className="p5-desired"><span>{t.desired}</span><div>{t.actions.map((x,i)=><button key={x} className={form.desiredAction===["Purchase","Appointment","Quote","Viewing","Demo","Support"][i]?"active":""} onClick={()=>update("desiredAction",["Purchase","Appointment","Quote","Viewing","Demo","Support"][i])}>{x}</button>)}</div></div>
    <label className="p5-instructions"><span>{t.labels.additionalInstructions}</span><textarea rows="4" value={form.additionalInstructions||""} placeholder={t.placeholders.additionalInstructions} onChange={e=>update("additionalInstructions",e.target.value)}/></label>
    <div className="p5-paid"><Info/><b>{t.notice}</b></div>
    <div className="p5-submit-row"><p>{t.note}</p><button disabled={busy||!!req} onClick={submit}><Send/>{busy?"Submitting…":t.submit}</button></div>
    {message&&<div className="p5-message">{message}</div>}
   </section>
   <aside className="p5-right">
    <section className="p5-side-card"><h2>{t.connect}</h2><div className="p5-connect-list">{t.connectItems.map((x,i)=>{const I=iconMap[i];return <div key={x}><span><I/></span><b>{x}</b><Check/></div>})}</div></section>
    <section className="p5-side-card p5-flow"><h2>{t.flow}</h2><p>{t.flowSub}</p>{t.flowItems.map((x,i)=><div key={x}><span>{i+1}</span><b>{x}</b>{i<t.flowItems.length-1&&<i/>}</div>)}<aside><Info/>{t.flowNote}</aside></section>
    <section className="p5-side-card p5-status"><header><h2>{t.status}</h2><span className={req?"submitted":""}>{req?req.status:t.notSubmitted}</span></header>{req?<><div className="p5-request-code"><b>{t.current}</b><strong>{req.request_code}</strong></div>{req.latest_response&&<p><b>{t.response}:</b> {req.latest_response}</p>}</>:<p>{t.statusSub}</p>}<div className="p5-status-line">{t.statuses.map((x,i)=><div key={x} className={req&&i<=statusIndex?"active":""}><span>{i+1}</span><small>{x}</small></div>)}</div>
    {history.length>0&&<div className="p5-history"><b>Status history</b>{history.map(h=><div key={h.id}><span>{h.newStatus}</span><small>{h.createdAt?new Date(h.createdAt).toLocaleString():""}</small>{h.customerResponse&&<p>{h.customerResponse}</p>}</div>)}</div>}
    </section>
   </aside>
  </div>
 </main>
}