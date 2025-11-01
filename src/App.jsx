
import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import DevelopersLandingPage from "./components/DevelopersLandingPage";
import WholesalersLandingPage from "./components/WholesalersLandingPage";
import InvestorsLandingPage from "./components/InvestorsLandingPage";
import AICRMLandingPage from "./components/AICRMLandingPage";
import AIAssistantLandingPage from "./components/AIAssistantLandingPage";
import AICRMInterface from "./components/AICRMInterface";

/**
 * Listo Qasa Ultimate MVP — Authenticated Routing + PayPal Plan Detection
 */

const NAV_LINKS = [
  "Buy","Sell","Rent","List Property","Owners","Agents",
  "Developers","Wholesalers","Investors","AI CRM","AI Assistant",
];

export default function App() {
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(null);
  const [plan,setPlan]=useState(null);
  const [loading,setLoading]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);

  // 🧩 restore session on reload
  useEffect(()=>{
    const saved=localStorage.getItem("listoqasa_user");
    if(saved){
      const parsed=JSON.parse(saved);
      setUser(parsed);
      fetchPlan(parsed.id||parsed.email);
    }
  },[]);

  /** 🔌 Fetch PayPal subscription plan from backend **/
  async function fetchPlan(userId){
    try{
      setLoading(true);
      const res=await fetch(`/api/paypal/subscriptions/${userId}`);
      if(!res.ok) throw new Error("Plan lookup failed");
      const data=await res.json();
      setPlan(data);
      if(data?.active) setPage("ai-crm-interface");
    }catch(err){
      console.error("Plan fetch error:",err);
    }finally{setLoading(false);}
  }

  /** 🧠 Simulate login (replace with real auth later) **/
  async function handleLogin(){
    const dummy={id:"demo-agent-1",email:"agent@listoqasa.com",role:"agent",name:"Ana García"};
    localStorage.setItem("listoqasa_user",JSON.stringify(dummy));
    setUser(dummy);
    await fetchPlan(dummy.id);
  }

  function handleLogout(){
    localStorage.removeItem("listoqasa_user");
    setUser(null); setPlan(null); setPage("home");
  }

  const go=(p)=>{window.scrollTo({top:0,behavior:"smooth"});setMobileOpen(false);setPage(p);};

  const handleNavClick=(label)=>{
    const internal={
      Developers:"developers",Wholesalers:"wholesalers",Investors:"investors",
      "AI CRM":"ai-crm-interface","AI Assistant":"ai-assistant",
    };
    if(internal[label]) return go(internal[label]);
    const ext={Buy:"/buy",Sell:"/sell",Rent:"/rent","List Property":"/list-property",Owners:"/owners",Agents:"/agents"};
    if(ext[label]) window.location.href=ext[label];
  };

  // --- Routing ---
  if(page==="developers") return <DevelopersLandingPage/>;
  if(page==="wholesalers") return <WholesalersLandingPage/>;
  if(page==="investors") return <InvestorsLandingPage/>;
  if(page==="ai-crm") return <AICRMLandingPage/>;
  if(page==="ai-assistant") return <AIAssistantLandingPage/>;
  if(page==="ai-crm-interface") return <AICRMInterface plan={plan} user={user}/>;

  // --- Default Landing ---
  return (
  <div className="min-h-screen font-sans text-gray-800 bg-white">
    <header className="fixed top-0 left-0 w-full bg-white/85 backdrop-blur-md border-b border-gray-100 z-50">
      <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={()=>go("home")}>
          <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-semibold text-sm">AI</div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-semibold tracking-wide text-gray-900">ListoQasa</span>
            <span className="text-xs text-gray-500 -mt-0.5">AI Real Estate</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-6 text-sm font-medium text-gray-700">
          {NAV_LINKS.map(l=>(
            <li key={l} className="hover:text-gray-900 cursor-pointer" onClick={()=>handleNavClick(l)}>{l}</li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {user?(
            <>
              <p className="text-xs text-gray-600">
                {plan?`${user.name} · ${plan.tier} (${plan.status})`:`${user.name} · Loading...`}
              </p>
              <button onClick={handleLogout} className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-full text-xs hover:bg-gray-300">Logout</button>
            </>
          ):(
            <button onClick={handleLogin} disabled={loading}
              className="hidden md:inline-flex items-center ml-4 px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition">
              {loading?"Connecting…":"Sign In"}
            </button>
          )}

          {/* mobile menu */}
          <button aria-label="Open menu" className="md:hidden p-2 rounded-md hover:bg-gray-100" onClick={()=>setMobileOpen(s=>!s)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gray-700">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className={`md:hidden w-full bg-white border-t border-gray-100 transition-all overflow-hidden ${mobileOpen?"max-h-96":"max-h-0"}`}>
        <div className="px-4 pb-4">
          <ul className="flex flex-col space-y-2 py-3 text-gray-700 text-sm">
            {NAV_LINKS.map(l=>(
              <li key={l} className="py-2 px-2 rounded hover:bg-gray-50" onClick={()=>handleNavClick(l)}>{l}</li>
            ))}
          </ul>
          {!user && (
            <div className="px-2">
              <button onClick={handleLogin} className="w-full px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                {loading?"Connecting…":"Sign In"}
              </button>
            </div>
          )}
          {user && (
            <div className="px-2 mt-2">
              <button onClick={handleLogout} className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Main Landing Content */}
    <main className="pt-24">
      {/* your homepage hero + analytics sections remain here */}
    </main>
  </div>);
}
