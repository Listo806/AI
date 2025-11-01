import React, { useState } from "react";
import hero from "../assets/investor-hero.png"; // optional if you upload later

const InvestorsLandingPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Future: connect to backend or Zapier webhook here
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="w-full bg-gradient-to-br from-white via-slate-50 to-blue-50/40 pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-5">
              Discover Profitable Deals <br />
              with <span className="text-blue-500">AI-Matched Investments</span>
            </h1>
            <p className="text-slate-500 text-base md:text-lg mb-6 leading-relaxed">
              Join Listo Qasa’s investor network and gain free access to{" "}
              <strong>wholesale, off-market, and development deals</strong>{" "}
              before they hit the public market. Our AI finds opportunities that match your criteria and connects you directly with trusted sellers.
            </p>
            <ul className="text-slate-600 text-sm mb-6 space-y-2">
              <li>• Get early alerts on discounted properties</li>
              <li>• Filter by ROI, location, or property type</li>
              <li>• Deal flow powered by AI — not guesswork</li>
            </ul>
          </div>
          <div className="flex-1">
            <img
              src={hero}
              alt="Investor dashboard preview"
              className="rounded-2xl shadow-lg border border-slate-100"
            />
          </div>
        </div>
      </section>

      {/* SIGN-UP FORM */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-slate-900 mb-3">
            Join the Investor Network — Free
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Enter your details below and start receiving AI-matched property deals right in your inbox.
          </p>

          {submitted ? (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">
                You're in!
              </h3>
              <p className="text-slate-600 text-sm">
                Our AI will start sending you matching deals soon. Stay tuned for your first opportunities.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-left shadow-sm"
            >
              <div className="mb-4">
                <label className="block text-sm text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="John Doe"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="john@example.com"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="+1 555 555 5555"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold text-sm hover:bg-blue-700"
              >
                Join Free & Get Deals
              </button>
            </form>
          )}
        </div>
      </section>

      {/* AI BENEFITS */}
      <section className="w-full py-20 bg-gradient-to-t from-slate-50 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-slate-900 mb-5">
            How AI Helps You Invest Smarter
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                📊 Smart Matching
              </h3>
              <p className="text-slate-500 text-sm">
                Our AI scans the platform daily to connect you with deals that meet your investment preferences.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                🧠 Predictive Analytics
              </h3>
              <p className="text-slate-500 text-sm">
                Get insights on property trends, risk levels, and ROI forecasts powered by real-time data.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                🤝 Trusted Connections
              </h3>
              <p className="text-slate-500 text-sm">
                Work directly with verified agents, developers, and wholesalers to secure reliable, high-return deals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-10 bg-slate-50 mt-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Listo Qasa — AI Real Estate Platform
      </footer>
    </div>
  );
};

export default InvestorsLandingPage;

