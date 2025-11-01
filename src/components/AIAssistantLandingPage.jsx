
import React from "react";
import aiHero from "../assets/aiassistant-hero.png";

const AIAssistantLandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="w-full bg-gradient-to-br from-white via-blue-50/30 to-blue-100/40 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-semibold text-slate-900 leading-tight mb-6">
              Meet Your{" "}
              <span className="text-blue-600">AI Real Estate Assistant</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Your personal AI companion for real estate. Ask questions, get
              instant answers, manage leads, analyze deals, or track your
              listings — all by voice or chat. The AI Assistant learns your
              workflow and helps you close faster, smarter, and easier.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">
                Talk to Your AI Now
              </button>
              <button className="px-6 py-3 border border-blue-500 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition">
                Watch How It Works
              </button>
            </div>
          </div>
          <div className="flex-1">
            <img
              src={aiHero}
              alt="AI Assistant dashboard hero"
              className="rounded-2xl shadow-xl border border-slate-100"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            How Your AI Assistant Works
          </h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
            The Listo Qasa AI Assistant integrates with your CRM and listings to
            manage your daily tasks. It listens, learns, and acts.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: "🎙️",
                title: "Voice Commands",
                desc: "Ask it anything — 'Show me today’s leads' or 'Remind me to follow up with Ana at 2 PM.'",
              },
              {
                icon: "📊",
                title: "Analytics on Demand",
                desc: "Get instant performance reports and AI insights about your listings, clients, or market trends.",
              },
              {
                icon: "💬",
                title: "Smart Conversations",
                desc: "It understands context. Chat naturally about your properties, and it remembers what matters most.",
              },
              {
                icon: "⏰",
                title: "Reminders & Tasks",
                desc: "Never miss a beat. Your AI keeps your schedule tight and your priorities clear.",
              },
              {
                icon: "🤝",
                title: "Team Integration",
                desc: "The Assistant syncs with your CRM team space — sharing updates and analytics instantly.",
              },
              {
                icon: "📱",
                title: "Mobile Ready",
                desc: "Voice-activated on any device — carry your AI everywhere you go.",
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

      {/* AI CHAT DEMO */}
      <section className="py-24 bg-gradient-to-b from-blue-50 to-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-4 text-slate-900">
            Talk to It Like a Partner
          </h2>
          <p className="text-slate-500 mb-10">
            The AI Assistant listens, reasons, and executes. Here’s how it
            interacts with you.
          </p>
          <div className="bg-white shadow-lg border border-slate-100 rounded-2xl p-8 text-left max-w-2xl mx-auto">
            <div className="mb-6">
              <p className="text-slate-700 font-medium mb-1">👤 You:</p>
              <p className="text-slate-500">
                “Show me my top three performing listings this week.”
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium mb-1">🤖 AI Assistant:</p>
              <p className="text-slate-500">
                “Here they are, ranked by leads and engagement — would you like
                me to auto-boost these listings?”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-3 text-slate-900">
            Connected to Everything You Use
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
            The AI Assistant integrates seamlessly with your CRM, calendar,
            listings, and communication tools.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-slate-500 text-sm">
            <span>🧠 AI CRM</span>
            <span>⚙️ Zapier</span>
            <span>📞 Twilio</span>
            <span>📅 Google Calendar</span>
            <span>💬 WhatsApp</span>
            <span>☁️ Vercel Cloud</span>
            <span>🔥 Firebase</span>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 text-center text-white">
        <h2 className="text-4xl font-semibold mb-6">
          Talk to Your AI Real Estate Assistant Today
        </h2>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
          Let your AI handle the busywork while you focus on what you do best —
          building relationships and closing deals.
        </p>
        <button
          onClick={() => (window.location.href = "/sign-in")}
          className="px-8 py-4 bg-white text-blue-700 rounded-full font-semibold hover:bg-blue-50 transition"
        >
          Start Free →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-10 bg-slate-50 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Listo Qasa — AI Real Estate Platform
      </footer>
    </div>
  );
};

export default AIAssistantLandingPage;
