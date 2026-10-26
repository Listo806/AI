import React from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import legalContent from "./legalContent.json";
import "./LegalPages.css";

const pages = [
  {key:"terms",path:"/terms",title:"Terms and Conditions"},
  {key:"privacy",path:"/privacy",title:"Privacy Policy"},
  {key:"refund",path:"/cancellation-policy",title:"Cancellation and Refund Policy"}
];
const names = {
 en:["Terms and Conditions","Privacy Policy","Cancellation and Refund Policy"],
 es:["Términos y condiciones","Política de privacidad","Política de cancelación y reembolso"],
 pt:["Termos e condições","Política de privacidade","Política de cancelamento e reembolso"]
};
function inlineParts(value){
 return value.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((s,i)=>{
  if(s.startsWith("**")&&s.endsWith("**"))return <strong key={i}>{s.slice(2,-2)}</strong>;
  const match=s.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if(match)return <a key={i} href={match[2]}>{match[1]}</a>;
  return s;
 });
}
function renderContent(source){
 const blocks=source.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
 return blocks.map((block,index)=>{
  if(block.startsWith("## "))return <h2 key={index}>{block.slice(3)}</h2>;
  if(block.startsWith("### "))return <h3 key={index}>{block.slice(4)}</h3>;
  if(block.startsWith("|")){
   const rows=block.split("\n").filter(row=>!/^\|[\s:|\-]+\|$/.test(row));
   return <div className="lq-legal-table-scroll" key={index}><table><tbody>{rows.map((row,r)=><tr key={r}>{row.split("|").slice(1,-1).map((cell,c)=>r===0?<th key={c}>{inlineParts(cell.trim())}</th>:<td key={c}>{inlineParts(cell.trim())}</td>)}</tr>)}</tbody></table></div>;
  }
  const list=block.split("\n");
  if(list.every(s=>/^[-•] /.test(s)))return <ul key={index}>{list.map((s,i)=><li key={i}>{inlineParts(s.slice(2))}</li>)}</ul>;
  return <p key={index}>{inlineParts(block)}</p>;
 });
}
export default function LegalPage({type="terms"}){
 const {i18n}=useTranslation();const location=useLocation();
 const lang=(i18n.resolvedLanguage||i18n.language||"en").slice(0,2);
 const localized=names[lang]||names.en;
 const selected=pages.find(p=>p.key===type)||pages[0];
 React.useEffect(()=>{document.title=`${selected.title} | ListoQasa`;window.scrollTo(0,0)},[selected.key,location.pathname]);
 return <div className="lq-legal-page">
  <main className="lq-legal-main"><h1>{localized[pages.indexOf(selected)]}</h1>
  {lang!=="en"&&<p className="lq-legal-language-note">{lang==="es"?"El texto legal oficial proporcionado está disponible en inglés.":"O texto jurídico oficial fornecido está disponível em inglês."}</p>}
  <article className="lq-legal-content">{renderContent(legalContent[selected.key])}</article></main>
 </div>;
}
