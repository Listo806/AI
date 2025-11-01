import React from "react";
import hero from "../assets/aicrm-hero.png";

const AICRMLandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="w-full bg-gradient-to-br from-white via-slate-50 to-blue-50/30 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-semibold text-slate-900 leading-tight mb-6">
              Your <span className="text-blue-600">AI-Powered</span>{" "}
              Real Estate Command Center
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Automate follow-ups, analyze leads, track listings, and close
              deals faster than ever — powered by AI built specifically for
              agents and developers. Everything you need in one beautiful,
              intelligent workspace.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">
                Try AI CRM Free
              </button>
              <button className="px-6 py-3 border border-blue-500 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition">
                Watch Demo
              </button>
            </div>
          </div>
          <div className="flex-1">
            <img
              src={hero}
              alt="AI CRM dashboard hero"
              className="rounded-2xl shadow-xl border border-slate-100"
            />
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Everything You Need — Powered by AI
          </h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
            Our AI CRM handles the hard work so you can focus on what matters:
            closing more deals and growing your business.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: "🤖",
                title: "AI Lead Matching",
                desc: "Instantly connects you with qualified buyers and sellers based on listing data and preferences.",
              },
              {
                icon: "📈",
                title: "Predictive Analytics",
                desc: "Identify your hottest leads automatically with smart lead scoring and real-time conversion tracking.",
              },
              {
                icon: "💬",
                title: "Voice & Chat Assistant",
                desc: "Ask your CRM anything — 'Show me my top 5 leads today' — and it responds instantly.",
              },
              {
                icon: "🔄",
                title: "Zapier & PayPal Integrations",
                desc: "Sync workflows, collect payments, and automate your follow-ups seamlessly.",
              },
              {
                icon: "📱",
                title: "Smart Notifications",
                desc: "Stay connected anywhere with instant mobile alerts for new leads and team updates.",
              },
              {
                icon: "🧠",
                title: "AI-Generated Insights",
                desc: "Your CRM studies your data and sends you actionable insights every week.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md transition"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD SHOWCASE */}
      <section className="py-24 bg-gradient-to-b from-blue-50 via-white to-white text-center">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-5 text-slate-900">
            Your Entire Business — Managed by AI
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
            One dashboard to view analytics, manage leads, track listings, and
            communicate with your team — all in real time.
          </p>
          <img
            src={hero}
            alt="AI CRM dashboard showcase"
            className="rounded-3xl shadow-2xl border border-slate-100 mx-auto"
          />
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-3 text-slate-900">
            Works Seamlessly with Your Favorite Tools
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
            Connect your CRM with everything you already use — automation,
            payments, communication, and analytics.
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

      {/* TESTIMONIALS */}
      <section className="py-24 bg-gradient-to-t from-slate-50 via-white to-white text-center">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-semibold text-slate-900 mb-10">
            What Agents and Developers Are Saying
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                name: "Sarah M.",
                role: "Real Estate Agent",
                quote:
                  "Listo Qasa’s AI CRM feels like having a personal assistant that never sleeps. My follow-ups doubled!",
              },
              {
                name: "Carlos D.",
                role: "Developer",
                quote:
                  "The predictive analytics alone are worth it. It’s transformed how I manage my investor leads.",
              },
              {
                name: "Elena R.",
                role: "Broker",
                quote:
                  "Finally, a CRM that understands real estate. Seamless, fast, and actually smart.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
              >
                <p className="text-slate-600 italic mb-4">“{t.quote}”</p>
                <p className="text-slate-900 font-semibold">{t.name}</p>
                <p className="text-slate-500 text-sm">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section className="py-24 bg-white border-t border-slate-100 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-5 text-slate-900">
            Choose Your AI CRM Plan
          </h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
            Scalable plans for agents and developers. Upgrade anytime as your
            team grows.
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
            ].map((p) => (
              <div
                key={p.name}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-left hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {p.name}
                </h3>
                <p className="text-slate-500 text-sm mb-4">{p.desc}</p>
                <p className="text-3xl font-bold text-blue-600 mb-6">
                  {p.price}
                  <span className="text-base font-normal text-slate-400">
                    /month
                  </span>
                </p>
                <ul className="mb-6 text-slate-600 text-sm space-y-2">
                  {p.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <button
                  className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold text-sm hover:bg-blue-700 transition"
                  onClick={() =>
                    (window.location.href =
                      "https://www.paypal.com/checkoutnow?token=YOUR_PLAN_ID")
                  }
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

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 text-center text-white">
        <h2 className="text-4xl font-semibold mb-6">
          Start Automating Your Real Estate Business Today
        </h2>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
          Listo Qasa’s AI CRM gives agents, developers, and investors the tools
          to close faster, smarter, and easier.
        </p>
        <button
          onClick={() =>
            (window.location.href =
              "https://www.paypal.com/checkoutnow?token=YOUR_PLAN_ID")
          }
          className="px-8 py-4 bg-white text-blue-700 rounded-full font-semibold hover:bg-blue-50 transition"
        >
          Launch AI CRM →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-10 bg-slate-50 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Listo Qasa — AI Real Estate Platform
      </footer>
    </div>
  );
};

export default AICRMLandingPage;
