import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, CircleAlert, CircleDot, Database, ExternalLink, Info, LockKeyhole, Mail, MessageCircle, Paperclip, Phone, Play, RefreshCw, Send, ShieldCheck, ShoppingBag, Sparkles, Trash2, UserRound } from "lucide-react";
import { setupApi } from "./setupApi";
import { useSetup } from "./useSetup";
import { setupLanguage } from "./setupTranslations";
import "./setup.css";
import "./test-launch-pass4.css";

const COPY = {
 en:{title:"Test & Launch Your AI Agent",subtitle:"Run a real customer journey, verify every action, and activate your AI Agent.",ready:"Ready to test",save:"Save & Exit",summary:"View Setup Summary",launch:"Launch Readiness",passed:"checks passed",readyPct:"ready",steps:["Customer Channels","AI Knowledge","Lead Capture","Conversion Actions","Human Handoff","Activate Agent"],complete:"Complete",progress:"In progress",locked:"Locked",auto:"Progress saves automatically.",test:"Run an End-to-End Test",testSub:"Complete all texts to active your AI Agent.",channel:"Test channel",scenario:"Test scenario",entry:"Entry point",customer:"Test customer",start:"Start Live Test",live:"WhatsApp Conversation (Live Test)",clear:"Clear Chat",type:"Type a message...",checks:["AI Agent trained","Website & primary CTA connected","Business phone connected","WhatsApp connected","Consent & source tracking configured","Pipeline & routing configured","Human handoff verified","Complete conversion test"],crm:"CRM Verification",view:"View Test Lead",handoff:"Human Handoff Test",passedLabel:"Passed",available:"Your agent will become available on all approved channels.",activate:"Activate AI Agent",unlock:"Complete the conversion test to unlock activation.",back:"Back to Conversion & Lead Flow",saved:"All changes saved",reset:"Reset Test",finish:"Complete Test",evidence:["Contact received","AI responded","CRM record created","Source recorded","Pipeline updated","Waiting for checkout result"]},
 es:{title:"Prueba y lanza tu agente de IA",subtitle:"Ejecuta un recorrido real del cliente, verifica cada acción y activa tu agente de IA.",ready:"Listo para probar",save:"Guardar y salir",summary:"Ver resumen de configuración",launch:"Preparación para lanzamiento",passed:"comprobaciones aprobadas",readyPct:"listo",steps:["Canales de clientes","Conocimiento de IA","Captura de leads","Acciones de conversión","Transferencia humana","Activar agente"],complete:"Completado",progress:"En progreso",locked:"Bloqueado",auto:"El progreso se guarda automáticamente.",test:"Ejecutar una prueba de extremo a extremo",testSub:"Completa todos los textos para activar tu agente de IA.",channel:"Canal de prueba",scenario:"Escenario de prueba",entry:"Punto de entrada",customer:"Cliente de prueba",start:"Iniciar prueba en vivo",live:"Conversación de WhatsApp (prueba en vivo)",clear:"Limpiar chat",type:"Escribe un mensaje...",checks:["Agente de IA entrenado","Sitio web y CTA principal conectados","Teléfono empresarial conectado","WhatsApp conectado","Consentimiento y seguimiento configurados","Pipeline y enrutamiento configurados","Transferencia humana verificada","Completar prueba de conversión"],crm:"Verificación CRM",view:"Ver lead de prueba",handoff:"Prueba de transferencia humana",passedLabel:"Aprobado",available:"Tu agente estará disponible en todos los canales aprobados.",activate:"Activar agente de IA",unlock:"Completa la prueba de conversión para desbloquear la activación.",back:"Volver a Conversión y flujo de leads",saved:"Todos los cambios guardados",reset:"Reiniciar prueba",finish:"Completar prueba",evidence:["Contacto recibido","IA respondió","Registro CRM creado","Origen registrado","Pipeline actualizado","Esperando resultado de checkout"]},
 pt:{title:"Teste e lance seu agente de IA",subtitle:"Execute uma jornada real do cliente, verifique cada ação e ative seu agente de IA.",ready:"Pronto para testar",save:"Salvar e sair",summary:"Ver resumo da configuração",launch:"Prontidão para lançamento",passed:"verificações aprovadas",readyPct:"pronto",steps:["Canais de clientes","Conhecimento da IA","Captura de leads","Ações de conversão","Transferência humana","Ativar agente"],complete:"Concluído",progress:"Em andamento",locked:"Bloqueado",auto:"O progresso é salvo automaticamente.",test:"Executar um teste de ponta a ponta",testSub:"Preencha todos os textos para ativar seu agente de IA.",channel:"Canal de teste",scenario:"Cenário de teste",entry:"Ponto de entrada",customer:"Cliente de teste",start:"Iniciar teste ao vivo",live:"Conversa do WhatsApp (teste ao vivo)",clear:"Limpar chat",type:"Digite uma mensagem...",checks:["Agente de IA treinado","Site e CTA principal conectados","Telefone comercial conectado","WhatsApp conectado","Consentimento e rastreamento configurados","Pipeline e roteamento configurados","Transferência humana verificada","Concluir teste de conversão"],crm:"Verificação do CRM",view:"Ver lead de teste",handoff:"Teste de transferência humana",passedLabel:"Aprovado",available:"Seu agente ficará disponível em todos os canais aprovados.",activate:"Ativar agente de IA",unlock:"Conclua o teste de conversão para desbloquear a ativação.",back:"Voltar para Conversão e fluxo de leads",saved:"Todas as alterações salvas",reset:"Reiniciar teste",finish:"Concluir teste",evidence:["Contato recebido","IA respondeu","Registro CRM criado","Origem registrada","Pipeline atualizado","Aguardando resultado do checkout"]}
};
const KEYS=["trained","website","phone","whatsapp","consent","routing","handoff","conversionTest"];
const SCENARIOS=["Product or service inquiry","Appointment request","Quote request","Property viewing","Demo request","Customer-support request","Human-handoff request"];

export default function TestLaunchSetup(){
 const navigate=useNavigate(); const {i18n}=useTranslation(); const lang=setupLanguage(i18n); const t=COPY[lang]||COPY.en;
 const {data,state,load}=useSetup();
 const [f,setF]=useState({channel:"",scenario:SCENARIOS[0],entryPoint:"",name:"",phone:"",email:""});
 const [result,setResult]=useState(null); const [busy,setBusy]=useState(false);
 const c=data?.config||{}, readiness=data?.readiness||{}, selected=c.customerChannels||[];
 const connected=useMemo(()=>{const x=[];if(selected.includes("website")&&readiness.website)x.push("website");if(selected.includes("phone")&&readiness.phone)x.push("voice");if(selected.includes("sms")&&readiness.phone)x.push("sms");if(selected.includes("whatsapp")&&readiness.whatsapp)x.push("whatsapp");return x},[selected,readiness.website,readiness.phone,readiness.whatsapp]);
 const channel=f.channel||connected[0]||""; const passCount=KEYS.filter(k=>readiness[k]).length; const pct=Math.round(passCount/KEYS.length*100);
 const latest=result||((data?.tests||[]).length?data.tests[data.tests.length-1]:null); const testPassed=latest?.status==="pass";
 if(!data)return <main className="setup-shell pass4-page"><div className="setup-loading">Loading setup…</div></main>;
 const run=async()=>{if(!channel||!f.entryPoint||!f.name)return;setBusy(true);try{const r=await setupApi.test({...f,channel}, data?.workspace_id);setResult(r?.result||null);await load()}finally{setBusy(false)}};
 const activate=async()=>{if(!readiness.ready||busy)return;if(!window.confirm("Activate the AI Agent on the approved channels?"))return;setBusy(true);try{await setupApi.activate(data?.workspace_id);await load()}finally{setBusy(false)}};
 const ch=(id,label,Icon)=><button disabled={!connected.includes(id)} className={channel===id?"active":""} onClick={()=>setF({...f,channel:id})}><Icon/>{label}</button>;
 const doneSteps=[selected.length>0,!!readiness.trained,!!(readiness.website||readiness.phone||readiness.whatsapp),false,!!readiness.handoff,false];
 const evidence=[!!latest,testPassed,testPassed&&!!latest?.contactId,testPassed&&!!latest?.source,testPassed&&!!(latest?.pipelineId||latest?.pipeline),testPassed&&!!(latest?.conversionResult||latest?.handoffResult)];
 return <main className="setup-shell pass4-page">
  <div className="p4-crumb"><span>AI Agent Setup</span><ChevronRight/><b>Test & Launch</b></div>
  <header className="p4-header"><span className="p4-title-icon"><Play/></span><div><h1>{t.title}</h1><p>{t.subtitle}</p></div><span className={`p4-ready ${readiness.ready ? "" : "not-ready"}`}>{readiness.ready ? <CheckCircle2/> : <CircleAlert/>}{readiness.ready ? t.ready : "Setup incomplete"}</span><button className="p4-outline" onClick={()=>navigate("/dashboard/ai-cortexa-setup")}>{t.save}</button><button className="p4-outline" onClick={()=>navigate("/dashboard/ai-cortexa-setup/customer-entry-points")}>{t.summary}</button></header>
  <section className="p4-progress"><b>{t.launch}</b><span>{passCount} of {KEYS.length} {t.passed}</span><div><i style={{width:`${pct}%`}}/></div><strong>{pct}% {t.readyPct}</strong></section>
  <div className="p4-layout">
   <aside className="p4-nav">{t.steps.map((name,i)=>{const done=doneSteps[i],active=i===3,locked=i===5&&!readiness.ready;return <div className={active?"active":""} key={name}><span className={`p4-step-num ${done?"done":active?"active":""}`}>{i+1}</span>{done&&<span className="p4-step-check"><Check/></span>}{locked&&<span className="p4-step-lock"><LockKeyhole/></span>}<section><b>{name}</b><small className={done?"done":active?"active":locked?"locked":""}>{done?t.complete:active?t.progress:locked?t.locked:""}</small></section></div>})}<div className="p4-auto"><Info/>{t.auto}</div></aside>
   <section className="p4-main">
    <div className="p4-main-head"><h2>{t.test}</h2><p>{t.testSub}</p></div>
    <div className="p4-controls"><label className="p4-channel"><span>{t.channel}</span><div>{ch("voice","Voice",Phone)}{ch("sms","SMS",MessageCircle)}{ch("whatsapp","WhatsApp",MessageCircle)}</div></label><label><span>{t.scenario}</span><select value={f.scenario} onChange={e=>setF({...f,scenario:e.target.value})}>{SCENARIOS.map(x=><option key={x}>{x}</option>)}</select></label><label><span>{t.entry}</span><select value={f.entryPoint} onChange={e=>setF({...f,entryPoint:e.target.value})}><option value="">Select entry point</option><option>Website — Product page</option><option>Website — Pricing page</option><option>WhatsApp — Direct message</option><option>Business phone</option></select></label></div>
    <div className="p4-customer"><label><span>{t.customer}</span><div><UserRound/><input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div></label><label><span>&nbsp;</span><div><Phone/><input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div></label><label><span>&nbsp;</span><div><Mail/><input value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div></label><button disabled={busy||!channel||!f.entryPoint||!f.name} title={!channel?"Connect/select a test channel first":!f.entryPoint?"Select an entry point":!f.name?"Enter a test customer name":""} onClick={run}><Play/>{busy?"Testing…":t.start}</button></div>
    <div className="p4-chat">
      <div className="p4-chat-head">
       <span className="p4-wa">◉</span><b>{t.live}</b>
       {latest?.status === "pass" && <span className="p4-live"><CheckCircle2/>LIVE TEST PASSED</span>}
       <em>{latest?.timestamp ? new Date(latest.timestamp).toLocaleString() : ""}</em>
       <button onClick={()=>setResult(null)}><Trash2/>{t.clear}</button>
      </div>
      <div className="p4-chat-body">
       {Array.isArray(latest?.messages) && latest.messages.length ? latest.messages.map((m,i)=>
        <div key={i} className={`p4-msg ${m.role === "customer" ? "user" : "ai"}`}>
         {m.role === "customer" ? null : <Sparkles/>}
         <span>{m.text}</span>
         {m.role === "customer" && <UserRound/>}
         <small>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : ""}</small>
        </div>
       ) : <div className="p4-empty-live"><Sparkles/><b>No live test conversation yet</b><span>Run a connected-channel test to display real test evidence here.</span></div>}
      </div>
      <div className="p4-compose"><Paperclip/><input disabled placeholder={latest ? "Live messages are read-only evidence from the connected-channel test." : "Run a live test first."}/><Send/></div>
     </div>
    <div className="p4-evidence">{t.evidence.map((x,i)=><div key={x} className={evidence[i]?"ok":i===5?"waiting":""}><span>{evidence[i]?<Check/>:i===5?<RefreshCw/>:<CircleDot/>}</span><section><b>{x}</b><small>{evidence[i]?"Verified":i===5?"Verifying conversion…":"Pending"}</small></section></div>)}</div>
   </section>
   <aside className="p4-right">
    <section className="p4-card p4-readiness"><h2>{t.launch}</h2><p>{t.testSub}</p>{KEYS.map((k,i)=><div key={k} className={readiness[k]?"ok":""}><span>{readiness[k]?<Check/>:<CircleDot/>}</span>{t.checks[i]}</div>)}</section>
    <section className="p4-card p4-crm"><header><h2>{t.crm}</h2><button disabled={!latest?.contactId} onClick={()=>latest?.contactId&&navigate(`/dashboard/contacts/${latest.contactId}`)}>{t.view}</button></header><dl><dt>Lead:</dt><dd>{latest?.customerName||latest?.name||"—"}</dd><dt>Source:</dt><dd>{latest?.source||"—"}</dd><dt>Interest:</dt><dd>{latest?.interest||"—"}</dd><dt>Pipeline:</dt><dd>{latest?.pipeline||latest?.pipelineId||"—"}</dd><dt>Stage:</dt><dd>{latest?.stage||latest?.stageId||"—"}</dd><dt>Owner:</dt><dd>{latest?.owner||"—"}</dd></dl></section>
    <section className="p4-card p4-handoff"><header><h2>{t.handoff}</h2>{readiness.handoff&&<span><CheckCircle2/>{t.passedLabel}</span>}</header><dl><dt>Transfer target:</dt><dd>{c.handoff?.target||"—"}</dd><dt>Handoff method:</dt><dd>{c.handoff?.method||"—"}</dd></dl></section>
    <section className="p4-activate"><div><ShieldCheck/><b>{t.available}</b></div><button disabled={!readiness.ready||busy||data.status==="active"} onClick={activate}>{data.status==="active"?"AI Agent Active":t.activate}</button>{!readiness.ready&&<p><CircleAlert/>{t.unlock}</p>}</section>
   </aside>
  </div>
  <footer className="p4-footer"><button className="back" onClick={()=>navigate("/dashboard/ai-cortexa-setup/customer-entry-points?section=conversion")}><ArrowLeft/>{t.back}</button><span><CheckCircle2/>{state||t.saved}</span><div><button className="reset" onClick={()=>setResult(null)}>{t.reset}</button><button className="finish" disabled={!testPassed} onClick={async()=>{await load();document.querySelector(".p4-readiness")?.scrollIntoView({behavior:"smooth",block:"center"})}}>{t.finish}<ArrowRight/></button></div></footer>
 </main>
}
