import React from "react";

const DevelopersLandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="w-full bg-gradient-to-br from-white via-slate-50 to-blue-50/50 pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-5">
              Showcase Your <span className="text-blue-500">Projects</span> with
              AI Precision.
            </h1>
            <p className="text-slate-500 text-base md:text-lg mb-6 leading-relaxed">
              Listo Qasa’s <strong>AI CRM for Developers</strong> helps builders,
              marketers, and project owners attract real buyers and investors
              automatically. Upload your developments and let the AI handle
              lead-matching, analytics, and follow-ups — all in one workspace.
            </p>
            <button className="bg-blue-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-sm hover:bg-blue-600">
              Start Getting AI-Matched Buyers
            </button>
          </div>
          <div className="flex-1">
            <img
              src="/assets/dev-hero.svg"
              alt="Developer dashboard mockup"
              className="rounded-2xl shadow-lg border border-slate-100"
            />
          </div>
        </div>
      </section>

      {/* 3-STEP FLOW */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-semibold text-slate-900 mb-10 text-center">
            How It Works for Developers
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">
                1️⃣ Upload Your Developments
              </h3>
              <p className="text-slate-500 text-sm">
                Add towers, gated communities, or condo projects — complete with
                specs, payment options, and media galleries.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">
                2️⃣ AI Matches Buyers & Investors
              </h3>
              <p className="text-slate-500 text-sm">
                The AI scans demand data from agents and users to instantly match
                your projects with qualified prospects.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">
                3️⃣ Manage Everything in the AI CRM
              </h3>
              <p className="text-slate-500 text-sm">
                Chat with your AI assistant inside the CRM to track analytics,
                tasks, and follow-ups across every project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI CRM SECTION */}
      <section className="w-full py-16 bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1">
            <h2 className="text-3xl font-semibold text-slate-900 mb-4">
              Speak to Your AI.
            </h2>
            <p className="text-slate-500 text-base mb-6">
              With the built-in <strong>AI CRM</strong>, your team can literally
              ask, “Which project needs attention?” or “How many hot leads came
              in today?” — and get instant answers, task lists, and analytics.
            </p>
            <ul className="space-y-3 text-slate-600 text-sm">
              <li>• Voice-to-task integration for sales teams</li>
              <li>• Project-level dashboards & real-time AI alerts</li>
              <li>• Automatic lead distribution to team members</li>
              <li>• PayPal auto-renew subscriptions built-in</li>
            </ul>
          </div>
          <div className="flex-1">
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
              <p className="text-xs text-slate-400 mb-2">Example AI Query</p>
              <div className="bg-slate-50 p-4 rounded-xl mb-3 text-sm text-slate-700">
                “AI, which of my projects is trending up this week?”
              </div>
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-slate-800">
                Torre Pacifica is up 21% in visits. Suggest notifying 3 agents
                and running one spotlight banner this weekend.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="w-full py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center mb-10">
          <h2 className="text-3xl font-semibold text-slate-900 mb-3">
            Developer Plans
          </h2>
          <p className="text-slate-500 text-sm">
            Choose your plan. PayPal subscriptions. No risk processors.
          </p>
        </div>
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-1">Pro</h3>
              <p className="text-sm text-slate-500 mb-5">
                $99.99/mo or $999.99/yr
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• 20 listings/projects</li>
                <li>• AI visibility across Listo Qasa network</li>
                <li>• Project analytics & dashboards</li>
                <li>• No CRM integration</li>
              </ul>
            </div>
            <button className="mt-6 bg-slate-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-800">
              Get Developer Pro
            </button>
          </div>
          <div className="bg-white p-8 rounded-2xl border-2 border-blue-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-1">
                Pro Plus
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                $149.99/mo or $1,499.99/yr
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Unlimited projects</li>
                <li>• Smart AI CRM integration</li>
                <li>• Lead routing & team management</li>
                <li>• Priority AI analytics & support</li>
              </ul>
            </div>
            <button className="mt-6 bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-600">
              Get Developer Pro Plus
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          Add seats at $25/mo per team member — matches Ultimate MVP billing.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-10 bg-slate-50 mt-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Listo Qasa — AI Real Estate Platform
      </footer>
    </div>
  );
};

export default DevelopersLandingPage;

