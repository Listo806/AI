import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ShieldCheck, Users, FileText, TrendingUp, Tag, KeyRound, Eye, CircleCheck, Building2, Check } from "lucide-react";
import SiteLayout from "../../components/layout/SiteLayout";
import hero from "../../assets/public/images/listoqasa/commercial/hero-clean.jpg";
import offices from "../../assets/public/images/listoqasa/commercial/offices-clean.jpg";
import retail from "../../assets/public/images/listoqasa/commercial/retail-clean.jpg";
import warehouse from "../../assets/public/images/listoqasa/commercial/warehouses-clean.jpg";
import industrial from "../../assets/public/images/listoqasa/commercial/industrial-clean.jpg";
import bottomPhoto from "../../assets/public/images/listoqasa/commercial/bottom-clean.jpg";
import "./CommercialOwnersPage.css";
export default function CommercialOwnersPage(){
 const {t}=useTranslation();const tx=(key)=>t(`commercialOwners.${key}`);
 const benefits=[[Users,"reach","reachDesc"],[FileText,"direct","directDesc"],[TrendingUp,"visibility","visibilityDesc"],[ShieldCheck,"keep","keepDesc"]];
 const types=[["offices",offices],["retail",retail],["warehouses",warehouse],["industrial",industrial]];
 return <SiteLayout headerVariant="light">
 <section className="lq-co-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(4,21,46,.88) 0%,rgba(4,21,46,.48) 44%,rgba(4,21,46,.06) 100%),url(${hero})`}}><div className="lq-co-wrap"><h1>{tx("heroTitle")}</h1><div className="lq-co-line"/><p>{tx("heroDesc")}</p><Link className="lq-co-button" to="/owner-plans">{tx("cta")} <ArrowRight size={19}/></Link><small><ShieldCheck size={15}/> {tx("secure")}</small></div></section>
 <main className="lq-co-main"><div className="lq-co-container"><header className="lq-co-section-heading"><span>{tx("eyebrow")}</span><h2>{tx("benefitTitle")}</h2><p>{tx("benefitDesc")}</p></header>
 <div className="lq-co-benefits">{benefits.map(([Icon,title,desc])=><article key={title}><Icon size={42} strokeWidth={1.6}/><h3>{tx(title)}</h3><p>{tx(desc)}</p></article>)}</div>
 <header className="lq-co-section-heading"><span>{tx("typesEyebrow")}</span><h2>{tx("typesTitle")}</h2><p>{tx("typesDesc")}</p></header>
 <div className="lq-co-types">{types.map(([key,img])=><article key={key}><img src={img} alt={tx(key)}/><strong>{tx(key)}</strong></article>)}</div>
 <section className="lq-co-savings"><h2>{tx("savingsTitle")}</h2><p>{tx("savingsDesc")}</p><div className="lq-co-savings-grid"><article><Tag/><div><h3>{tx("sellTitle")}</h3><p>{tx("sellDesc")}</p></div></article><article><KeyRound/><div><h3>{tx("rentTitle")}</h3><p>{tx("rentDesc")}</p></div></article></div><small>{tx("feeNote")}</small></section>
 <div className="lq-co-stats">{[[Eye,"statExposure","statExposureDesc"],[Users,"statAudience","statAudienceDesc"],[TrendingUp,"statInquiries","statInquiriesDesc"],[CircleCheck,"statResults","statResultsDesc"]].map(([Icon,title,desc])=><div key={title}><Icon/><div><strong>{tx(title)}</strong><small>{tx(desc)}</small></div></div>)}</div>
 <section className="lq-co-bottom" style={{backgroundImage:`linear-gradient(90deg, rgba(3, 74, 156, 0.48) 0%, rgba(3, 76, 161, 0.83) 34%, rgba(0, 57, 132, 0.27) 65%, rgba(0, 0, 0, 0.02) 100%),url(${bottomPhoto})`}}><Building2 size={58}/><div><h2>{tx("bottomTitle")}</h2><p>{tx("bottomDesc")}</p><Link className="lq-co-button" to="/owner-plans">{tx("cta")} <ArrowRight size={18}/></Link></div><ul>{["easy","exposure","noHassle","today"].map(k=><li key={k}><Check size={16}/>{tx(k)}</li>)}</ul></section>
 </div></main></SiteLayout>;
}
