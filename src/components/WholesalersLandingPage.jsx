
import React from "react";
import hero from "../assets/wholesaler-hero.png"; // ✅ your hero image

const WholesalersLandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HERO */}
      <section className="w-full bg-gradient-to-br from-white via-slate-50 to-blue-50/40 pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-5">
              List Your <span className="text-blue-500">Wholesale Properties</span>  
              and Let the AI Match You with Real Buyers.
            </h1>
            <p className="text-slate-500 text-base md:text-lg mb-6 leading-relaxed">
              With Listo Qasa’s AI network, your deals are seen by verified{" "}
              <strong>investors actively looking to buy wholesale properties</strong>.  
              Upload your deal, and our AI instantly connects you to matching buyers —  
              no cold calling, no wasted time.
            </p>
            <button
              onClick={() =>
                (window.location.href =
                  "https://www.paypal.com/checkoutnow?token=YOUR_PAYPAL_PLAN_ID")
              }
              className="bg-blue-500 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-sm hover:bg-blue-600"
            >
              Join for $19.99/month
            </button>
            <p className="text-xs text-slate-400 mt-2">
              Simple plan. Cancel anytime through PayPal.
            </p>
          </div>
          <div className="flex-1">
            <img
              src={hero}
              alt="Wholesale properties dashboard"
              className="rounded-2xl shadow-lg border border-slate-100"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-slate-900 mb-3">
            Why Wholesalers Love Listo Qasa
          </h2>
          <p className="text-slate-500 text-sm mb-10 max-w-2xl mx-auto">
            Our AI and investor-ready ecosystem helps wholesalers close deals faster and keep profits high.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                🧠 AI-Matched Buyers
              </h3>
              <p className="text-slate-500 text-sm">
                Every property you list is instantly shown to investors whose buying criteria matches your deal.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                ⚡ Instant Exposure
              </h3>
              <p className="text-slate-500 text-sm">
                No waiting for calls or ads. Our system broadcasts your listings across the platform to active investors.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                💼 List and Close
              </h3>
              <p className="text-slate-500 text-sm">
                Upload your property, get investor leads, and close — all within one dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="w-full py-20 bg-gradient-to-t from-slate-50 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold text-slate-900 mb-5">
            Simple Plan for Wholesalers
          </h2>
          <p className="text-slate-500 text-sm mb-10">
            $19.99/month — full access to the marketplace and AI lead matching.
          </p>
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Wholesaler Plan
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              $19.99/month — cancel anytime.
            </p>
            <button
              onClick={() =>
                (window.location.href =
                  "https://www.paypal.com/checkoutnow?token=YOUR_PAYPAL_PLAN_ID")
              }
              className="w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-600"
            >
              Subscribe via PayPal
            </button>
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

export default WholesalersLandingPage;
