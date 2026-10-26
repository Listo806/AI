import React,{useState} from "react";
import {Link} from "react-router-dom";
import {Check} from "lucide-react";
import {useTranslation} from "react-i18next";
import SiteLayout from "../../components/layout/SiteLayout";
import "../PricingShared/PricingShared.css";

const OWNER_PLANS=[
 {key:"standard",price:67,quarterlyPrice:167,savings:34,perListingMonth:"27.83",listings:2,features:["marketplace","standardVisibility","aiMatchmaker","notifications","editAnytime"]},
 {key:"enhanced",price:97,quarterlyPrice:237,savings:54,perListingMonth:"26.33",listings:3,dark:true,popular:true,features:["everythingStandard","higherPlacement","moreVisibility","featuredRotation","priorityAi","moreViews","enhancedReach"]},
 {key:"maximum",price:147,quarterlyPrice:367,savings:74,perListingMonth:"30.58",listings:4,features:["everythingEnhanced","firstPagePriority","maximumVisibility","topSearchPosition","highestAiPriority","maximumViews","topCategory"]}
];
export default function OwnerPlansPage(){
 const {t}=useTranslation();const [durations,setDurations]=useState({standard:1,enhanced:1,maximum:1});
 return <SiteLayout headerVariant="dark" showHeader={false} showFooter={false}><main className="lq-pricing-page lq-owner-pricing"><div className="lq-pricing-container"><header className="lq-pricing-header"><h1>{t("plans.owner.title")}</h1><p>{t("plans.owner.subtitle")}</p></header><section className="lq-pricing-grid">{OWNER_PLANS.map(p=>{const months=durations[p.key];const cta=`/marketplace/signup?audience=owner&plan=${p.key}&billing=${months===3?'quarterly':'monthly'}`;return <article key={p.key} className={`lq-plan-card ${p.dark?"dark":""}`}>{p.popular&&<div className="lq-plan-popular">{t("plans.common.mostPopular")}</div>}<h2 className="lq-plan-title">{t(`plans.owner.${p.key}.name`)}</h2><p className="lq-plan-desc">{t(`plans.owner.${p.key}.description`)}</p><div className="lq-plan-divider"/><fieldset className="lq-owner-duration" aria-label={t("plans.owner.chooseDuration")}>
 {[1,3].map(n=><label key={n} className="lq-owner-duration-option"><input type="radio" name={`duration-${p.key}`} value={n} checked={months===n} onChange={()=>setDurations(prev=>({...prev,[p.key]:n}))}/><span>{t(n===1?"plans.owner.oneMonth":"plans.owner.threeMonths")}</span><strong>${n===3?p.quarterlyPrice:p.price}</strong><span className="lq-owner-tax">{t("plans.common.plusTax")}</span></label>)}
 {months===3&&<p className="lq-owner-savings">{t("plans.owner.savingsLine",{amount:p.savings,perListingMonth:p.perListingMonth})}</p>}
 </fieldset><div className="lq-plan-listings">{p.listings} {t("plans.owner.activeListings")}</div><Link to={cta} className="lq-plan-cta">{t(`plans.owner.${p.key}.cta`)}</Link><h3 className="lq-plan-feature-title">{t("plans.common.features")}</h3><ul className="lq-plan-features">{p.features.map(f=><li key={f}><Check size={18}/><span>{t(`plans.owner.features.${f}`)}</span></li>)}</ul></article>})}</section></div></main></SiteLayout>}
