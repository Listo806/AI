import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, MessageCircle, CalendarDays, FileText, ShoppingCart, Mail, Headphones, Network, Sparkles, Share2, GitBranch, Play, Clock3, CheckCircle2, ChevronDown, X, ShieldCheck } from "lucide-react";
import { useSetup } from "./useSetup";
import { setupCopy, setupLanguage } from "./setupTranslations";
import "./setup.css";

const icons=[Users,MessageCircle,CalendarDays,FileText,ShoppingCart,Mail,Headphones,Network];
export default function SetupHome(){
  const n=useNavigate(); const {i18n}=useTranslation(); const tr=setupCopy[setupLanguage(i18n)];
  const {data,state,save}=useSetup();
  if(!data) return <main className="setup-shell"><div className="setup-loading">{tr.loading}</div></main>;
  const c=data.config||{};
  const done=[!!c.trainingComplete,!!(c.customerChannels||[]).length,!!(c.routing?.pipelineId&&c.routing?.stageId),!!data.readiness?.ready];
  const count=done.filter(Boolean).length,pct=Math.round(count/4*100);
  const go=[()=>n("/dashboard/ai-cortexa-setup/training"),()=>n("/dashboard/ai-cortexa-setup/customer-entry-points"),()=>n("/dashboard/ai-cortexa-setup/customer-entry-points?section=conversion"),()=>n("/dashboard/ai-cortexa-setup/test-launch")];
  const stageIcons=[Sparkles,Share2,GitBranch,Play];
  return <main className="setup-shell setup-home-ref">
    <header className="setup-ref-head"><span className="setup-ref-logo"><Sparkles/></span><div><h1>{tr.homeTitle}</h1><p>{tr.homeSub}</p></div></header>
    <section className="setup-ref-card objective-ref"><div className="objective-head"><div><h2>{tr.goalTitle}</h2><p>{tr.goalSub}</p></div><button>↻ {tr.changeGoal}</button></div>
      <div className="objective-ref-grid">{tr.objectives.map((x,i)=>{const I=icons[i],active=data.selected_objective===x;return <button key={x} className={`objective-ref-item ${active?"active":""}`} onClick={()=>save({selectedObjective:x},true)}><span><I/></span><b>{x}</b>{i===4&&<em>{setupLanguage(i18n)==="es"?"Recomendado":setupLanguage(i18n)==="pt"?"Recomendado":"Recommended"}</em>}{active&&<CheckCircle2 className="obj-check"/>}</button>})}</div>
    </section>
    <section className="setup-ref-progress"><b>{tr.setupProgress}</b><span>{count} of 4 {tr.stepsComplete}</span><div><i style={{width:`${pct}%`}}/></div><span>{pct}% complete</span></section>
    <section className="stage-ref-list">{tr.stages.map((s,i)=>{const I=stageIcons[i];const status=i===0?(done[i]?tr.complete:tr.inProgress):i===3?(done[i]?tr.complete:tr.readyTest):(done[i]?tr.complete:tr.notConfigured);return <article key={s[0]} className="stage-ref-row"><span className="stage-ref-num">{i+1}</span><span className={`stage-ref-icon s${i}`}><I/></span><div className="stage-ref-copy"><h3>{s[0]}</h3><p>{s[1]}</p></div><span className={`stage-ref-status ${done[i]?"done":i===0?"progress":i===3?"test":""}`}>{i===0&&!done[i]?<Clock3/>:<CheckCircle2/>}{status}</span><button className={`stage-ref-btn ${i===0||i===3?"primary":""}`} onClick={go[i]}>{done[i]&&i!==3?"Review":s[2]}</button><ChevronDown/></article>})}</section>
    {!c.assistanceDismissed&&<section className="assist-ref"><span className="assist-ref-icon"><Headphones/></span><div><h3>{tr.assistance}</h3><p>{tr.assistanceSub}</p><div><span>✦ AI Agent Setup Assistance</span><span>◉ Website & Connection Assistance</span></div><small>Optional paid services quoted separately based on your requirements.</small></div><button className="stage-ref-btn" onClick={()=>n("/dashboard/ai-cortexa-setup/assistance")}>{tr.request}</button><button className="assist-x" onClick={()=>save({assistanceDismissed:true},true)}><X/></button></section>}
    <footer className="setup-ref-footer"><span><ShieldCheck/>{tr.autoSave}</span><span>{tr.needHelp} <button onClick={()=>n("/dashboard/ai-cortexa-setup/assistance")}>{tr.support} ↗</button></span></footer>
  </main>
}