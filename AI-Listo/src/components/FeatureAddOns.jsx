import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Info, CalendarClock, Bot, Target, Mail, BarChart3, Home,
  Star, Zap, Lock, RefreshCw, HelpCircle, Check,
} from "lucide-react";
import "./FeatureAddOns.css";

// The six purchasable add-ons, matching the approved UX reference. `key` is the
// entitlement key the backend records on purchase; `unlocks` is shown for the
// integration-linked add-ons so the user understands what connecting requires.
const ADDONS = [
  {
    key: "ai_booking_agent", Icon: CalendarClock, name: "AI Booking Agent", price: 97, badge: "POPULAR",
    desc: "AI appointment setter, calendar automation, and smart scheduling that books for you.",
  },
  {
    key: "ai_sales_automation", Icon: Bot, name: "AI Sales Automation", price: 97,
    desc: "Advanced lead qualification, automated follow-ups, AI workflows, and next actions that drive deals.",
  },
  {
    key: "ai_action_center", Icon: Target, name: "AI Action Center", price: 67,
    desc: "AI recommendations, priority queue, next-best actions, revenue at risk, and pipeline intelligence.",
  },
  {
    key: "email_marketing", Icon: Mail, name: "Email & Marketing Automation", price: 67, badge: "INTEGRATION UNLOCKED",
    desc: "Email & SMS campaigns, sequences, triggered emails, and WhatsApp broadcasts using your connected email.",
    note: "Email integrations are unlocked with this add-on.",
  },
  {
    key: "advanced_analytics", Icon: BarChart3, name: "Advanced Analytics & Reports", price: 47,
    desc: "Advanced reports, custom dashboards, performance insights, and deeper analytics.",
  },
  {
    key: "real_estate", Icon: Home, name: "Real Estate Add-On", price: 67,
    desc: "Property listings, real estate tools, and specialized workflows for real estate professionals.",
  },
];

const SOLO_FEATURES = [
  "Everything in all add-ons",
  "Full AI Agent with unlimited power",
  "AI booking & calendar automation",
  "Advanced automations & workflows",
  "Marketing automation & campaigns",
  "Multiple users & integrations",
];

const SOLO_PRICE = 197;

// Any component, anywhere, can open the universal modal focused on a given
// add-on: openFeatureAddOns("advanced_analytics"). Decoupled via a window event
// so callers don't need context wiring.
export function openFeatureAddOns(key) {
  window.dispatchEvent(new CustomEvent("cortexa:open-addons", { detail: { key: key || null } }));
}

// Maps a locked feature to the add-on that unlocks it, so a lock click can focus
// the right row. Exported so lock UIs share one source of truth.
export const FEATURE_TO_ADDON = {
  aiBooking: "ai_booking_agent",
  aiAppointmentSetter: "ai_booking_agent",
  calendarBooking: "ai_booking_agent",
  advancedAiAgent: "ai_sales_automation",
  advancedAutomations: "ai_sales_automation",
  leadGenerator: "ai_sales_automation",
  aiActionCenter: "ai_action_center",
  reports: "advanced_analytics",
  advancedAnalytics: "advanced_analytics",
  emailSmsMarketing: "email_marketing",
  marketing: "email_marketing",
  listings: "real_estate",
  realEstate: "real_estate",
  integrations: "email_marketing",
};

export default function FeatureAddOns() {
  const [open, setOpen] = useState(false);
  const [focusKey, setFocusKey] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      setFocusKey(e.detail?.key || null);
      setOpen(true);
    };
    window.addEventListener("cortexa:open-addons", handler);
    return () => window.removeEventListener("cortexa:open-addons", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  // Add to My Account: hand off to the existing checkout with the selected
  // add-on and price so it collects/uses the payment method and, on return,
  // activates the entitlement. Charging + activation is completed server-side by
  // the checkout (Paddle); this modal is the single entry point into it.
  const addToAccount = (addon) => {
    setOpen(false);
    navigate(`/checkout?addon=${encodeURIComponent(addon.key)}&price=${addon.price}`);
  };

  const close = () => setOpen(false);

  return (
    <div className="fao-overlay" onMouseDown={close}>
      <div className="fao-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="fao-close" onClick={close} aria-label="Close"><X size={20} /></button>

        <div className="fao-head">
          <h2 className="fao-title">FEATURE ADD-ONS</h2>
          <p className="fao-sub">Unlock powerful features and AI capabilities. Add only what you need.</p>
        </div>

        <div className="fao-usage">
          <span className="fao-usage-item fao-usage-lead"><Info size={14} /> You're on the Free plan</span>
          <span className="fao-usage-item">1 user</span>
          <span className="fao-usage-item">1 WhatsApp connection</span>
          <span className="fao-usage-item">No integrations</span>
          <span className="fao-usage-item">50 AI conversations/month</span>
          <button className="fao-usage-manage" onClick={() => { close(); navigate("/dashboard/settings"); }}>Manage Usage</button>
        </div>

        <div className="fao-section-label">AVAILABLE ADD-ONS</div>

        <div className="fao-list">
          {ADDONS.map((a) => (
            <div key={a.key} className={`fao-card${focusKey === a.key ? " fao-card--focus" : ""}`}>
              <div className="fao-card-icon"><a.Icon size={22} /></div>
              <div className="fao-card-body">
                <div className="fao-card-name">
                  {a.name}
                  {a.badge && (
                    <span className={`fao-badge ${a.badge === "POPULAR" ? "fao-badge--pop" : "fao-badge--int"}`}>{a.badge}</span>
                  )}
                </div>
                <div className="fao-card-desc">{a.desc}</div>
                {a.note && <div className="fao-card-note"><Lock size={12} /> {a.note}</div>}
              </div>
              <div className="fao-card-price">
                <span className="fao-price-amt">${a.price}</span>
                <span className="fao-price-per">/month</span>
              </div>
              <div className="fao-card-cta">
                <button className="fao-btn fao-btn--dark" onClick={() => addToAccount(a)}>Add to My Account</button>
                <button className="fao-viewdetails" onClick={() => addToAccount(a)}>View details ›</button>
              </div>
            </div>
          ))}
        </div>

        <div className="fao-solo">
          <div className="fao-solo-top">
            <div className="fao-solo-brand">
              <div className="fao-solo-icon"><Star size={20} /></div>
              <div>
                <div className="fao-solo-eyebrow">UNLOCK EVERYTHING</div>
                <div className="fao-solo-name">CORTEXA SOLO</div>
                <div className="fao-solo-desc">Get the complete platform with all features, automations, and unlimited potential.</div>
              </div>
            </div>
            <div className="fao-solo-price">
              <span className="fao-price-amt">${SOLO_PRICE}</span>
              <span className="fao-price-per">/month</span>
            </div>
            <div className="fao-solo-feats">
              {SOLO_FEATURES.map((f) => <div key={f} className="fao-solo-feat"><Check size={13} /> {f}</div>)}
            </div>
            <div className="fao-solo-cta">
              <button className="fao-btn fao-btn--solo" onClick={() => { close(); navigate("/pricing"); }}>Upgrade to Solo</button>
              <button className="fao-viewdetails fao-viewdetails--light" onClick={() => { close(); navigate("/pricing"); }}>View full plan details ›</button>
            </div>
          </div>
        </div>

        <div className="fao-foot">
          <span className="fao-foot-item"><Zap size={15} /> <b>Activate instantly</b> Get started right away</span>
          <span className="fao-foot-item"><Lock size={15} /> <b>Secure payments</b> Powered by Paddle</span>
          <span className="fao-foot-item"><RefreshCw size={15} /> <b>Cancel anytime</b> No long-term contracts</span>
          <span className="fao-foot-item"><HelpCircle size={15} /> <b>Need something custom?</b> Contact our team</span>
        </div>
      </div>
    </div>
  );
}
