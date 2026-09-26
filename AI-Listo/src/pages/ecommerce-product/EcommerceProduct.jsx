import React, { createContext, useContext, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight, PlayCircle, ShoppingCart, RefreshCw, Users, Megaphone, Store,
  CheckCircle2, UserRound, CalendarDays, LayoutDashboard, CreditCard,
  PackageCheck, BadgeDollarSign, Plug, Workflow, BarChart3, LogOut,
  ChevronDown, CircleDollarSign, WalletCards, PanelLeftClose, PanelLeftOpen, RotateCcw, Truck, Tags,
  Link2, MessageSquareText, FileBarChart2
} from "lucide-react";

import "./ecommerce-product.css";
import EcommerceIntegrationsPage from "./EcommerceIntegrations";
import EcommerceSubscriptionsPage from "./EcommerceSubscriptions";
import heroDashboard from "./assets/hero-dashboard.png";
import connectedDiagram from "./assets/connected-diagram.png";
import subscriberDashboard from "./assets/subscriber-dashboard.png";
import billingDashboard from "./assets/billing-dashboard.png";
import revenueDashboard from "./assets/revenue-dashboard.png";
import ordersDashboard from "./assets/orders-dashboard.png";
import integrationsDiagram from "./assets/integrations-diagram.png";
import automationDashboard from "./assets/automation-dashboard.png";
import analyticsDashboard from "./assets/analytics-dashboard.png";

const EcAuthContext = createContext(null);
const EC_TOKEN = "cortexa_ecommerce_access_token";

export function EcommerceAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(EC_TOKEN));
  const value = useMemo(() => ({
    token,
    isAuthenticated: Boolean(token),
    // Frontend-ready isolation. Replace this local fallback with /e-commerce/auth/login when backend is connected.
    login: async ({ email, password }) => {
      if (!email || !password) throw new Error("Enter your email and password.");
      const demoToken = `ec_${Date.now()}`;
      localStorage.setItem(EC_TOKEN, demoToken);
      setToken(demoToken);
      return true;
    },
    logout: () => { localStorage.removeItem(EC_TOKEN); setToken(null); },
  }), [token]);
  return <EcAuthContext.Provider value={value}>{children}</EcAuthContext.Provider>;
}

function useEcAuth(){ return useContext(EcAuthContext); }

export function EcommerceProtectedRoute(){
  const { isAuthenticated } = useEcAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet/> : <Navigate to="/e-commerce/login" replace state={{from:location.pathname}}/>;
}

function Logo(){
  return <Link to="/e-commerce" className="ec-logo"><span className="ec-logo-mark">C</span><span><b>CORTEXA</b><small>E-COMMERCE CRM</small></span></Link>;
}

export function EcommerceHeader(){
  return <header className="ec-header"><div className="ec-header-inner"><Logo/><nav>
    <Link to="/e-commerce/dashboard">Dashboard</Link><a href="/e-commerce#subscriptions">Subscriptions</a><a href="/e-commerce#integrations">Integrations</a><Link to="/e-commerce/pricing">Pricing</Link><a href="/e-commerce#resources">Resources </a>
  </nav><div className="ec-header-actions"><Link className="ec-login-link" to="/e-commerce/login">Login</Link><Link className="ec-btn ec-btn-small" to="/e-commerce/signup">Get Started</Link></div></div></header>;
}

const sections=[
 {n:"03",eyebrow:"YOUR SUBSCRIPTION BUSINESS, ALL CONNECTED.",title:<>One platform to run <em>every part of your business.</em></>,desc:"Connect your tools, your data, and your workflows. Cortexa brings everything together so you can operate more efficiently and grow faster.",bullets:[[Link2,"Connect multiple merchant accounts"],[Users,"Manage all your subscribers"],[CalendarDays,"Automate recurring billing"],[CircleDollarSign,"Track transactions and disputes"],[Plug,"Integrate with the tools you use"]],img:connectedDiagram,id:"subscriptions"},
 {n:"04",eyebrow:"YOUR SUBSCRIPTIONS & CUSTOMER MANAGEMENT",title:<>Know every subscriber. <em>Increase retention.</em></>,desc:"Centralize customer data, track subscription status, payment history, and engagement — so you can reduce churn and grow lifetime value.",bullets:[[UserRound,"Complete customer profiles"],[CreditCard,"Real-time status and payment details"],[Tags,"Smart segmentation and tagging"],[RefreshCw,"Retention tools and win-backs"],[MessageSquareText,"Custom fields and notes"]],img:subscriberDashboard},
 {n:"05",eyebrow:"BILLING & PAYMENT MANAGEMENT",title:<>Run billing that <br/><em>always gets paid.</em></>,desc:"Centralize customer merchant accounts and gateways, automate retries, handle fallbacks and chargebacks, and keep cash flow steady.",bullets:[[WalletCards,"Multiple Merchant Accounts"],[CalendarDays,"Recurring Billing & Rebills"],[RefreshCw,"Smart Retries & Dunning"],[CircleDollarSign,"Chargebacks & Disputes"],[RotateCcw,"Refunds & Credits"],[CreditCard,"Transaction History"]],img:billingDashboard},
 {n:"06",eyebrow:"PRODUCTS, OFFERS, CAMPAIGNS & AFFILIATES",title:<>Launch offers. <br/><em>Grow with affiliates.</em></>,desc:"Control analytics and subscription offers, run campaigns that convert, and scale with a powerful affiliate program.",bullets:[[PackageCheck,"Products & Subscriptions"],[BadgeDollarSign,"Offers & Upsells"],[Megaphone,"Campaigns"],[Users,"Affiliate Management"],[BarChart3,"Tracking & Attribution"],[CircleDollarSign,"Commissions & Payouts"]],img:revenueDashboard},
 {n:"07",eyebrow:"ORDERS & FULFILLMENT",title:<>Fulfill every order. <br/><em>Delight every customer.</em></>,desc:"Manage orders from start to finish, connect your fulfillment providers, track shipments, handle returns, and keep customers happy.",bullets:[[ShoppingCart,"Order Management"],[PackageCheck,"Fulfillment Providers"],[Truck,"Shipping & Tracking"],[RotateCcw,"Returns & Reships"]],img:ordersDashboard},
 {n:"08",eyebrow:"INTEGRATIONS",title:<>Connect the tools <em>that power your business.</em></>,desc:"Plug into the payment gateways, providers, and services you rely on. All connected. All in sync.",bullets:[],img:integrationsDiagram,id:"integrations"},
 {n:"09",eyebrow:"AUTOMATION",title:<>Automate the work. <em>Focus on growth.</em></>,desc:"Create powerful automation workflows for billing, communications, fulfillment, and more.",bullets:[[CreditCard,"Billing Automations"],[MessageSquareText,"Customer Communications"],[Truck,"Fulfillment Workflows"],[Workflow,"Operational Automation"],[Workflow,"Custom Workflows"]],img:automationDashboard},
 {n:"10",eyebrow:"ANALYTICS & REPORTING",title:<>Real data. <br/><em>Smarter decisions.</em></>,desc:"Powerful analytics and reports give you the clarity to grow revenue, reduce churn, and optimize performance.",bullets:[[BadgeDollarSign,"Revenue Analytics"],[Users,"Subscriber Insights"],[CreditCard,"Payment Performance"],[BarChart3,"Campaign & Offer Reports"],[FileBarChart2,"Custom Reports"]],img:analyticsDashboard},
];

export function EcommerceLanding(){
 return <div className="ec-public"><EcommerceHeader/>
  <main>
   <section className="ec-hero" id="dashboard"><div className="ec-copy"><div className="ec-kicker"><Workflow size={13}/> ENGINEERED FOR GROWTH</div><h1>CRM &amp; Payment Platform<br/>for <em>E-Commerce Subscriptions<br/>&amp; Affiliate Marketers.</em></h1><span className="ec-rule"/><p>Manage customers, subscriptions, recurring billing, payments, fulfillment, and integrations from one powerful platform.</p><div className="ec-actions"><Link className="ec-btn" to="/e-commerce/signup">Get Started <ArrowRight size={15}/></Link><a href="#subscriptions" className="ec-watch"><PlayCircle size={15}/> See How It Works</a></div></div><img className="ec-hero-image" src={heroDashboard} alt="Cortexa E-Commerce CRM billing calendar dashboard"/></section>
   <section className="ec-audience"><div className="ec-section-heading"><span>02</span><b>WHO IT'S BUILT FOR</b><h2>Built for businesses that<br/>run on <em>recurring revenue.</em></h2></div><p className="ec-audience-intro">From e-commerce brands to affiliate marketers, Cortexa gives you the tools to scale, automate, and maximize lifetime value.</p><div className="ec-audience-grid">{[[ShoppingCart,"E-commerce Brands","Sell products online, manage customers and orders, and grow profitably."],[RefreshCw,"Subscription Businesses","Launch and scale flexible subscriptions with smart billing and retention."],[Users,"Affiliate Marketers","Run offers, track performance, and maximize affiliate commissions."],[Megaphone,"Digital Marketers","Create campaigns, capture leads, and turn traffic into loyal customers."],[Store,"Online Sellers","Manage products, orders, and fulfillment in one streamlined platform."]].map(([Icon,title,text])=><article key={title}><Icon className="ec-audience-icon" size={25} strokeWidth={1.8}/><b>{title}</b><p>{text}</p></article>)}</div></section>
   {sections.map((s,i)=><section className="ec-feature" id={s.id} key={s.n}><div className="ec-feature-copy"><div className="ec-eyebrow"><span>{s.n}</span>{s.eyebrow}</div><h2>{s.title}</h2><p>{s.desc}</p>{s.bullets.length>0&&<ul>{s.bullets.map(([Icon,text])=><li key={text}><Icon className="ec-feature-list-icon" size={15} strokeWidth={2}/><span>{text}</span></li>)}</ul>}</div><div className="ec-visual"><img src={s.img} alt={`${s.eyebrow} interface`}/></div></section>)}
   <section className="ec-bottom-cta"><h2>Run your subscription business without losing control<br/>of your customers or data.</h2><p>Keep customers, subscriptions, billing schedules, orders, affiliates, and payment history connected in one operating system.</p><Link className="ec-btn" to="/e-commerce/signup">Get Started Today →</Link></section>
  </main><footer className="ec-footer"><Logo/><span>© 2026 Cortexa. All rights reserved.</span><nav><a href="#">Privacy</a><Link to="/e-commerce/terms">Terms</Link><a href="#">Contact</a><Link to="/e-commerce/login">Login</Link></nav></footer>
 </div>
}

export function EcommercePricing(){
 const [annual,setAnnual]=useState(false);
 const recurring=annual?"$3,811":"$397";
 return <div className="ec-public ec-pricing-shell">
  <main className="ec-pricing-page">
   <h1>Simple pricing that <em>scales</em> with your business.</h1>
   <div className="ec-toggle">
    <b className={!annual?"on":""}>Billed monthly</b>
    <button onClick={()=>setAnnual(!annual)} className={annual?"annual":""}><i/></button>
    <span>Billed annually</span><strong>Save 20%</strong>
   </div>
   <div className="ec-price-card">
    <h2>E-Commerce CRM</h2>
    <p>The complete platform for subscription<br/>and affiliate businesses.</p>
    <div className="ec-price">{recurring}<small>{annual?"/year":"/month"}</small></div>
    <div className="ec-subscriber-cap"><Users size={20}/> Up to 500 active subscribers</div>
    <p className="ec-annual-saving">$3,811 billed annually — <em>save $953</em></p>
    <Link className="ec-price-button" to="/e-commerce/signup">Get Started</Link>
    <hr/>
    <h3>COMPLETE PLATFORM INCLUDED:</h3>
    <ul>{["Customer & Subscription Management","Dashboard Billing Calendar","Products, Offers & Pricing Rules","Campaigns, Coupons & Order Bumps","Orders, Fulfillment & Returns","Affiliate Tracking & Attribution","Multiple Payment Integrations","Automated Decline Recovery","CRM, Notes & Activity Timeline","Integrations, APIs & Webhooks","Automation & Customer Messaging","Analytics & Commerce Reporting","Automatically moves to the next tier after 500 active subscribers"].map(x=><li key={x}><CheckCircle2 size={16}/><span>{x}</span></li>)}</ul>
   </div>
   <p className="ec-pricing-note">One complete platform. Pricing automatically scales as your active subscriber volume grows.</p>
  </main>
 </div>
}

function AuthCard({mode}){ const nav=useNavigate(); const auth=useEcAuth(); const [error,setError]=useState(""); const [form,setForm]=useState({name:"",email:"",password:""}); const submit=async e=>{e.preventDefault();setError("");if(mode==="signup"){sessionStorage.setItem("ec_signup",JSON.stringify(form));nav("/e-commerce/checkout");return;}try{await auth.login(form);nav("/e-commerce/dashboard",{replace:true});}catch(err){setError(err.message)}}; return <div className="ec-auth-page"><Link to="/e-commerce"><Logo/></Link><form className="ec-auth-card" onSubmit={submit}><h1>{mode==="login"?"Welcome back":"Start with Cortexa E-Commerce CRM"}</h1><p>{mode==="login"?"Login to your E-Commerce CRM account.":"Create your dedicated E-Commerce account."}</p>{mode==="signup"&&<label>Full name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>}<label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label><label>Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label>{error&&<div className="ec-error">{error}</div>}<button className="ec-btn" type="submit">{mode==="login"?"Login":"Continue to Checkout"}</button><p className="ec-switch">{mode==="login"?<>New to E-Commerce CRM? <Link to="/e-commerce/signup">Get Started</Link></>:<>Already have an account? <Link to="/e-commerce/login">Login</Link></>}</p></form></div> }
export const EcommerceLogin=()=> <AuthCard mode="login"/>;
export const EcommerceSignup=()=> <AuthCard mode="signup"/>;

export function EcommerceCheckout(){ const nav=useNavigate(); const saved=JSON.parse(sessionStorage.getItem("ec_signup")||"{}"); return <div className="ec-auth-page"><Logo/><div className="ec-checkout"><section><h1>Complete your E-Commerce CRM setup</h1><p>Your E-Commerce account, billing and access remain separate from the main Cortexa CRM.</p><label>Full name<input defaultValue={saved.name||""}/></label><label>Email<input defaultValue={saved.email||""}/></label><label>Card number<input placeholder="1234 5678 9012 3456"/></label><div className="ec-field-row"><label>Expiry<input placeholder="MM / YY"/></label><label>CVC<input placeholder="CVC"/></label></div></section><aside><h2>E-Commerce CRM</h2><div><span>Subscription</span><b>$397 / month</b></div><div><span>Active subscribers</span><b>Up to 500</b></div><hr/><div><strong>Due today</strong><strong>$397</strong></div><button className="ec-btn" onClick={()=>nav("/e-commerce/login")}>Complete Checkout</button><small>Checkout UI is ready for the dedicated E-Commerce payment API.</small></aside></div></div> }

export function EcommerceAppLayout(){
 const auth=useEcAuth();
 const [collapsed,setCollapsed]=useState(false);

 return <div className={`ec-app ${collapsed ? "ec-sidebar-collapsed" : ""}`}>
  <aside className="ec-sidebar">
   <div className="ec-sidebar-top">
    <Logo/>
    <button
     type="button"
     className="ec-sidebar-collapse"
     onClick={()=>setCollapsed(v=>!v)}
     aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
     title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
     {collapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}
    </button>
   </div>

   <nav>
    <NavLink to="/e-commerce/dashboard" title="Dashboard"><LayoutDashboard size={17}/><span>Dashboard</span></NavLink>
    <NavLink to="/e-commerce/subscriptions" title="Subscriptions"><CreditCard size={17}/><span>Subscriptions</span></NavLink>
    <NavLink to="/e-commerce/integrations" title="Integrations"><Plug size={17}/><span>Integrations</span></NavLink>
   </nav>

   <button className="ec-sidebar-logout" onClick={auth.logout} title="Log out">
    <LogOut size={16}/><span>Log out</span>
   </button>
  </aside>

  <main className="ec-app-main"><Outlet/></main>
 </div>
}

export { default as EcommerceDashboard } from "./EcommerceDashboard";
export function EcommerceSubscriptions(){ return <EcommerceSubscriptionsPage/>; }
export function EcommerceIntegrations(){ return <EcommerceIntegrationsPage/>; }
function SimpleAppPage({title,text}){return <div className="ec-simple-page"><h1>{title}</h1><p>{text}</p><div className="ec-empty-card"><b>{title}</b><span>Dedicated E-Commerce CRM module</span></div></div>}
const ecommerceTerms = [
 ["1. Eligibility", <>
  <p>You must be at least 18 years old and legally capable of entering into a binding agreement to use the Services. If you use the Services on behalf of a business or other organization, you represent that you have authority to bind that organization to these Terms.</p>
  <p>We may refuse or restrict access, suspend or close accounts, or require additional information or verification where necessary for security, compliance, fraud prevention, or legal reasons.</p>
 </>],
 ["2. E-Commerce Services", <>
  <p>Services provided include E-Commerce, subscriptions, automations, CRM, customers, analytics, and integrations platform. Depending on configuration and connected providers, the Services may include customer profiles, subscription management, payment and billing management, products and offers, campaigns, order fulfillment, affiliate tracking, messaging, automation workflows, reporting, APIs, webhooks, and integrations.</p>
  <p>Cortexa does not itself act as a bank, card network, payment processor, acquiring institution, merchant account provider, e-commerce platform, or fulfillment provider. Payments and third-party services operate subject to their own contracts, availability, restrictions, fees, and dispute requirements.</p>
 </>],
 ["3. Account Responsibility", <>
  <p>You are responsible for your account, users, passwords, roles, permissions, integrations, connected systems, customer data, and all activity conducted through your account. You must maintain accurate information and protect login credentials. You must promptly notify Cortexa of suspected unauthorized access or security incidents.</p>
  <p>You are responsible for ensuring that your use of customer data, marketing communications, tracking, analytics, payment flows, and integrations complies with applicable laws and third-party requirements.</p>
 </>],
 ["4. Acceptable Use", <>
  <p>You may not use the Services for unlawful, fraudulent, abusive, deceptive, infringing, harmful, or prohibited activity. Prohibited conduct includes attempts to gain unauthorized access, phishing, spam, credential stuffing, malicious code, misleading affiliate activity, prohibited or restricted transactions, interference with platform security, or activity that violates law or third-party rights.</p>
  <p>You may not bypass account limits, usage controls, or platform safeguards, create accounts to circumvent restrictions, or use the Services in ways that unreasonably harm or interfere with other users or the platform.</p>
 </>],
 ["5. Subscription Pricing", <>
  <p>Cortexa offers tiered E-Commerce subscription plans based on active subscriber volume. Unless stated otherwise, subscriptions are billed monthly or annually in advance at the pricing shown below.</p>
  <div className="ec-terms-table-wrap"><table className="ec-terms-table"><thead><tr><th>Active subscribers</th><th>Monthly price</th><th>Annual billing save 20 percent</th></tr></thead><tbody>
   <tr><td>Up to 500</td><td>$397 per month</td><td>$3,811 per year</td></tr>
   <tr><td>501 - 2,000</td><td>$497 per month</td><td>$4,771 per year</td></tr>
   <tr><td>2,001 - 5,000</td><td>$697 per month</td><td>$6,691 per year</td></tr>
  </tbody></table></div>
  <p>All tax and processing charges may be added where applicable. Annual plans are billed in advance for the annual term. Pricing may change for future billing periods or renewals as permitted by these Terms.</p>
  <p>The applicable subscription tier may automatically move to the next tier when the number of active subscribers exceeds the limit for the current tier. If active subscriber volume later decreases, any move to a lower tier may be subject to the platform's then-current billing rules.</p>
  <p>Annual billing provides a 20 percent discount compared with the corresponding monthly billing rate shown above. Annual subscriptions are billed in advance and remain subject to these Terms.</p>
 </>],
 ["6. Account Activation and Paid Access", <>
  <p>Access to paid E-Commerce features may require an active subscription, verified account information, and successful payment. Cortexa may delay or restrict activation while payment, identity, security, or account information is being reviewed.</p>
  <p>Services may not activate if a payment is declined, the payment method is invalid, or required account information cannot be verified.</p>
 </>],
 ["7. Recurring Billing", <>
  <p>Subscriptions renew automatically at the applicable monthly or annual billing interval unless canceled in accordance with these Terms. You authorize Cortexa and its payment providers to charge the payment method on file for recurring fees, applicable taxes, permitted add-ons, usage charges, and other amounts due.</p>
  <p>Billing dates may change because of retries, payment-provider processing, upgrades, downgrades, subscription changes, or other account events. If payment fails, we may retry the charge, suspend paid features, or restrict account access until payment is resolved.</p>
 </>],
 ["8. Platform Usage and Fair Use", <>
  <p>The Services are designed for legitimate customer, subscription, order, billing, and commerce operations. Excessive automated requests, abusive API usage, attempts to impair service availability, or activity that creates unreasonable technical load may be limited or suspended.</p>
  <p>Cortexa may apply technical limits, queues, rate limits, or temporary safeguards to protect customers, platform stability, and service availability.</p>
 </>],
 ["9. Add-Ons and Professional Services", <>
  <p>Add-ons, additional user licenses, media, implementation, integration, customization, consulting, training, setup assistance, managed services, and other services may be priced separately from subscription fees. Unless expressly stated otherwise, these services are not included in the standard subscription.</p>
 </>],
 ["10. Cancellation and Refunds", <>
  <p>You may cancel through the available account controls or by contacting support. Cancellation stops renewal at the end of the paid billing period unless a different effective date is stated. Amounts already charged are non-refundable except where required by law or expressly agreed in writing.</p>
  <p>Canceling a subscription does not automatically refund usage fees, third-party charges, implementation fees, professional services, integration fees, or other non-refundable amounts.</p>
 </>],
 ["11. Customer and Commerce Data", <>
  <p>You retain ownership of data you lawfully provide to the Services. You grant Cortexa the limited rights reasonably necessary to process, transmit, store, display, analyze, and use that data to operate, secure, support, and improve the Services and to comply with law.</p>
  <p>You are responsible for the legality, accuracy, notices, permissions, warranties, and authorizations required to upload or process customer, subscriber, payment-related, commerce, order, and integration data.</p>
 </>],
 ["12. Third Party Services and Integrations", <>
  <p>The Services may connect with payment gateways, commerce platforms, banks, card networks, fulfillment providers, email or messaging services, analytics tools, advertising platforms, and other third-party services. These services are controlled by their own providers and may be subject to separate terms, fees, availability, and technical requirements.</p>
  <p>Cortexa is not responsible for third-party service outages, restrictions, changes, suspensions, pricing, or security events. You are responsible for maintaining valid accounts and credentials with connected third-party providers.</p>
 </>],
 ["13. Privacy and Data Protection", <>
  <p>Cortexa processes personal information in accordance with its Privacy Policy and applicable law. Each customer is responsible for determining the lawful basis, notices, consents, data-processing obligations, cross-border transfer requirements, and retention rules applicable to customer data.</p>
  <p>Where required, the parties may enter into a separate data processing agreement. Do not provide data that you are not authorized or legally permitted to process.</p>
 </>],
 ["14. Intellectual Property", <>
  <p>Cortexa and its licensors retain all rights in the Services, software, designs, documentation, workflows, models, interfaces, trademarks, and related technology. These Terms grant only a limited, revocable, non-exclusive, non-transferable right to use the Services during an active subscription.</p>
  <p>You may not copy, reproduce, reverse engineer, modify, create derivative works from, resell, sublicense, or commercially exploit the Services except as expressly permitted in writing.</p>
 </>],
 ["15. Service Availability", <>
  <p>Cortexa uses commercially reasonable efforts to operate the Services but does not guarantee uninterrupted, error-free, or always-available service. Maintenance, updates, security events, internet failures, payment outages, force majeure, and other events may cause interruption or delay.</p>
 </>],
 ["16. Disclaimers and Limitation of Liability", <>
  <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED OPERATION.</p>
  <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CORTEXA AND ITS SUPPLIERS, OFFICERS, EMPLOYEES, AGENTS, CONTRACTORS, AND AFFILIATES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, LOSS OF PROFITS, REVENUE, GOODWILL, DATA, OR BUSINESS INTERRUPTION.</p>
  <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, TOTAL AGGREGATE LIABILITY ARISING FROM THE SERVICES OR THESE TERMS WILL NOT EXCEED THE FEES PAID BY YOU FOR THE AFFECTED SERVICE DURING THE TWELVE MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.</p>
 </>],
 ["17. Indemnification", <>
  <p>You will defend, indemnify, and hold harmless Cortexa, its affiliates, officers, employees, and contractors from claims, losses, liabilities, damages, penalties, and expenses arising from your use of the Services, your data, your products or services, your violation of law, infringement of third-party rights, or breach of these Terms.</p>
 </>],
 ["18. Suspension and Termination", <>
  <p>Cortexa may suspend or terminate access for non-payment, fraud risk, security threats, illegal activity, abuse, contractual violations, excessive usage, or conduct that may harm Cortexa, customers, or third parties. Where practicable, reasonable notice may be provided.</p>
  <p>After termination, access to paid features ends. You remain responsible for amounts already due, and provisions intended by their nature to survive termination will remain in effect.</p>
 </>],
 ["19. Changes to Plans and Services", <>
  <p>Cortexa may change plans, features, limits, pricing, product availability, and service structure. Material pricing changes will be communicated before they apply to a future renewal or billing period where required by law. Continued use after a change becomes effective constitutes acceptance of the updated plan or service.</p>
 </>],
 ["20. Changes to These Terms", <>
  <p>Cortexa may update these Terms to reflect security, operational, product, legal, or regulatory changes. The updated version becomes effective when posted or on the date stated in the notice. Continued use after the effective date constitutes acceptance.</p>
 </>],
 ["21. Governing Law and Disputes", <>
  <p>These Terms are governed by the laws applicable to Cortexa's business operations, without regard to conflict-of-law principles. Before filing a formal claim, each party will attempt in good faith to resolve the dispute through written notice and reasonable discussion. Any mandatory consumer rights remain unaffected.</p>
 </>],
 ["22. Entire Agreement", <>
  <p>These Terms, the Privacy Policy, the applicable plan and pricing, and any written order or service agreement accepted by the parties constitute the entire agreement regarding the Services and replace prior discussions or understandings concerning the same subject. If an enterprise or separately contracted service has additional terms, the signed agreement controls for that service.</p>
  <p>If any provision is unenforceable, it will be limited to the minimum extent necessary and the remaining provisions will remain in effect. A failure to enforce a provision is not a waiver.</p>
 </>],
 ["23. Contact Information", <>
  <p>CORTEXA E-COMMERCE CRM<br/>Cortexa AI CRM<br/>Email: support@cortexaaicrm.com</p>
 </>],
];

export function EcommerceTerms(){
 return <div className="ec-public ec-terms-shell">
  <main className="ec-terms">
   <h1>Terms of Service</h1>
   <p className="ec-terms-effective">Effective: September 25, 2026</p>
   <div className="ec-terms-intro">
    <p>These Terms of Service govern access to and use of the Cortexa E-Commerce CRM website, applications, APIs, integrations, and related services provided by Cortexa AI CRM. By creating an account, accessing the Services, or using the Services, you agree to these Terms. If you do not agree, do not use the Services.</p>
   </div>
   {ecommerceTerms.map(([title,content])=><section key={title}><h2>{title}</h2>{content}</section>)}
  </main>
 </div>
}
