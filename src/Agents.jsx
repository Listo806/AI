import React from "react";
import { useNavigate } from "react-router-dom";

export default function Agents() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Agent Pro",
      price: 99.99,
      subtitle: "20 listings / month",
      desc: "For solo agents who want AI exposure and a modern workspace.",
      features: [
        "Up to 20 active listings / month",
        "AI property match visibility",
        "Lead inbox in one place",
        "Basic performance insights",
      ],
    },
    {
      name: "Agent Pro Plus",
      price: 149.99,
      subtitle: "Unlimited listings + AI CRM",
      highlight: true,
      desc: "Best for growing agents/teams who want full AI CRM automation.",
      features: [
        "Unlimited listings",
        "Full AI CRM access (Smart follow-up)",
        "AI ‘Talk-to-your-pipeline’ button",
        "Deal timeline + reminders",
        "Priority AI placement",
      ],
    },
    {
      name: "Elite AI Agent",
      price: 199.99,
      subtitle: "Everything + premium AI",
      desc: "For top performers who want the highest exposure and automations.",
      features: [
        "All Pro Plus features",
        "Homepage / high-traffic boosts",
        "Advanced analytics dashboard",
        "AI listing optimization",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-semibold text-sm">
              AI
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-wide text-gray-900">ListoQasa</span>
              <span className="text-xs text-gray-500 -mt-0.5">AI Real Estate</span>
            </div>
          </div>
          <button onClick={() => navigate("/")} className="text-sm text-blue-600 hover:underline">
            ← Back to Home
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-wide text-blue-500 mb-2">For Real Estate Agents</p>
            <h1 className="text-4xl md:text-5xl font-light italic text-gray-900 mb-5">
              Built for Agents. <span className="text-blue-600">Powered by AI.</span>
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Your AI CRM keeps listings, leads, analytics, and follow-ups in one smart place —
              so you can focus on closing, not chasing.
            </p>

            <div className="flex flex-wrap gap-3 mb-5">
              <button
                onClick={() => {
                  const el = document.getElementById("agent-plans");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
              >
                View Agent Plans
              </button>
            </div>

            <p className="text-xs text-gray-400">Works for listing agents, buyer agents, and teams.</p>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl shadow-lg p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-200/40 rounded-full blur-2xl" />
            <div className="absolute -left-10 bottom-0 w-40 h-40 bg-blue-100/50 rounded-full blur-xl" />

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg">AG</div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Agent Workspace</div>
                <div className="text-xs text-gray-400">“Today: 3 new AI-matched leads”</div>
              </div>
            </div>

            <div className="bg-blue-50/70 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Today’s Pipeline</span>
                <span>AI Smart View</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold text-gray-900">12</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">New Leads</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold text-gray-900">5</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Hot Matches</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold text-gray-900">3</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Showings</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert("This will open the AI voice/chat panel in the real app.")}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
            >
              🎙️ Talk to your AI about today’s tasks
            </button>
            <p className="text-[10px] text-gray-400 mt-2">
              “What’s pending? Who should I call? Show me this week’s analytics.”
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="agent-plans" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="text-center mb-10">
          <h2 className="text-4xl italic text-gray-900 mb-4">Agent Plans</h2>
          <p className="text-gray-600">
            All plans include AI lead matching, dashboard access, and 24/7 support.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white border ${
                plan.highlight ? "border-blue-400" : "border-gray-200"
              } rounded-2xl shadow-sm hover:shadow-lg p-8 flex flex-col items-center text-center transition`}
            >
              <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.subtitle}</p>
              <p className="text-4xl font-light text-blue-600 mb-6">
                ${plan.price.toFixed(2)}
                <span className="text-base text-gray-500 font-normal">/mo</span>
              </p>
              <ul className="text-gray-600 text-sm mb-6 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/checkout")}
                className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
              >
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-10 text-center border-t border-gray-100 text-sm text-gray-500 bg-white">
        © {new Date().getFullYear()} Listo Qasa — All rights reserved.
      </footer>
    </div>
  );
}
