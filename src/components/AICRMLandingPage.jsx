
import React from "react";
import hero from "../assets/aicrm-hero.png";

/**
 * Listo Qasa – AI CRM Landing Page
 * Phase 10 / Ultimate MVP standard
 * Clean white-tech aesthetic + PayPal checkout integration
 */

export default function AICRMLandingPage() {
  // Redirect user to internal /checkout with selected plan
  const goToCheckout = (plan) => {
    window.location.href = `/checkout?plan=${encodeURIComponent(plan)}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* === HERO SECTION === */}
      <section className="w-full bg-gradient-to-br from-white via-slate-50 to-blue-50/30 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          {/* Left text */}
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-semibold text-slate-900 leading-tight mb-6">
              Your <span className="text-blue-600">AI-Powered</span>{" "}
              Real Estate Command Center
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Automate follow-ups, analyze leads, track listings, and close
              deals faster than ever — powered by AI built specifically for
              agents and developers. Everything you need in one intelligent,
              unified workspace.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => goToCheckout("Pro+")}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
              >
                Try AI CRM Free
              </button>
              <button className="px-6 py-3 border border-blue-500 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right hero image */}
          <div className="flex-1">
            <img
              src={hero}
              alt="AI CRM dashboard hero"
              className="rounded-2xl shadow-xl border border-slate-100"
            />
          </div>
        </div>
      </section>

      {/* === FEATURES GRID === */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Everything You Need — Powered by AI
          </h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
            Your CRM does the hard work: matching leads, tracking conversions,
            and surfacing insights — so you can focus on closing deals.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              ["🤖", "AI Lead Matching", "Connects you instantly with qualified buyers and sellers."],
              ["📈", "Predictive Analytics", "Automatically scores your hottest leads in real time."],
              ["💬", "Voice & Chat Assistant", "Ask your CRM anything — it answers instantly."],
              ["🔄", "Zapier & PayPal Integrations", "Sync workflows, collect payments, and automate follow-ups."],
              ["📱", "Smart Notifications", "Stay connected with instant mobile alerts and PWA push."],
              ["🧠", "AI-Generated Insights", "Weekly AI insights straight to your dashboard."],
            ].map(([icon, title, desc]) => (
              <div
                key={title}
                className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md transition"
              >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === DASHBOARD SHOWCASE === */}
      <section className="py-24 bg-gradient-to-b from-blue-50 via-white to-white text-center">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-5 text-slate-900">
            Your Entire Business — Managed by AI
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
            One dashboard for analytics, leads, listings, and team communication
            — powered by ListoQasa’s AI engine.
          </p>
          <img
            src={hero}
            alt="AI CRM dashboard showcase"
            className="rounded-3xl shadow-2xl border border-slate-100 mx-auto"
          />
        </div>
      </section>

      {/* === INTEGRATIONS === */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-3 text-slate-900">
            Works Seamlessly with Your Favorite Tools
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
            Connect with Zapier, PayPal, OpenAI, Firebase, and more — all ready
            out of the box.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-slate-500 text-sm">
            <span>⚙️ Zapier</span>
            <span>💳 PayPal</span>
            <span>📊 Google</span>
            <span>💬 Twilio</span>
            <span>🧠 OpenAI</span>
            <span>☁️ Vercel</span>
            <span>🗄️ MongoDB</span>
            <span>🔥 Firebase</span>
          </div>
        </div>
      </section>

      {/* === TESTIMONIALS === */}
      <section className="py-24 bg-gradient-to-t from-slate-50 via-white to-white text-center">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-semibold text-slate-900 mb-10">
            What Agents and Developers Are Saying
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              ["Sarah M.", "Real Estate Agent", "“It feels like having a personal assistant that never sleeps.”"],
              ["Carlos D.", "Developer", "“The predictive analytics alone transformed how I manage investor leads.”"],
              ["Elena R.", "Broker", "“Finally, a CRM that understands real estate — seamless, fast, and smart.”"],
            ].map(([name, role, quote]) => (
              <div
                key={name}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
              >
                <p className="text-slate-600 italic mb-4">{quote}</p>
                <p className="text-slate-900 font-semibold">{name}</p>
                <p className="text-slate-500 text-sm">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === PRICING PLANS === */}
      <section className="py-24 bg-white border-t border-slate-100 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-5 text-slate-900">
            Choose Your AI CRM Plan
          </h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
            Scalable plans for agents, developers, and teams — upgrade anytime.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Pro+",
                price: "$149.99",
                desc: "Ideal for solo agents and small teams",
                features: [
                  "AI Lead Matching",
                  "Smart CRM Dashboard",
                  "Email & Mobile Alerts",
                ],
              },
              {
                name: "Elite AI",
                price: "$199.99",
                desc: "Advanced automations and analytics",
                features: [
                  "Everything in Pro+",
                  "Predictive Lead Scoring",
                  "Zapier & PayPal Integrations",
                  "AI Assistant Voice Commands",
                ],
              },
              {
                name: "Enterprise OS",
                price: "$249.99",
                desc: "Full power for developers and broker teams",
                features: [
                  "Everything in Elite AI",
                  "Custom AI Insights",
                  "Unlimited Team Seats",
                  "Priority Support & Training",
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-left hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
                <p className="text-3xl font-bold text-blue-600 mb-6">
                  {plan.price}
                  <span className="text-base font-normal text-slate-400">
                    /month
                  </span>
                </p>
                <ul className="mb-6 text-slate-600 text-sm space-y-2">
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => goToCheckout(plan.name)}
                  className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold text-sm hover:bg-blue-700 transition"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            +$25/month per additional seat · Cancel anytime
          </p>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 text-center text-white">
        <h2 className="text-4xl font-semibold mb-6">
          Start Automating Your Real Estate Business Today
        </h2>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
          ListoQasa’s AI CRM gives agents, developers, and investors everything
          needed to close faster, smarter, and easier.
        </p>
        <button
          onClick={() => goToCheckout("Pro+")}
          className="px-8 py-4 bg-white text-blue-700 rounded-full font-semibold hover:bg-blue-50 transition"
        >
          Launch AI CRM →
        </button>
      </section>

      {/* === FOOTER === */}
      <footer className="w-full py-10 bg-slate-50 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ListoQasa — AI Real Estate Platform
      </footer>
    </div>
  );
}
