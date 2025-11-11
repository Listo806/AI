import React from "react";
import { useNavigate } from "react-router-dom";
import hero from "./assets/aicrm-hero.png"; // ✅ Temporary placeholder until we restore the official hero image

export default function App() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* ✅ HERO SECTION (Official Listo Qasa style) */}
      <section className="w-full bg-gradient-to-br from-white via-slate-50 to-blue-50/30 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">

          {/* ✅ LEFT TEXT */}
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-semibold leading-tight mb-6 text-slate-900">
              Find Your Perfect Property with{" "}
              <span className="text-blue-600">AI Precision</span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Buy, sell, rent, list your property, or access your AI CRM —
              all inside one intelligent real estate platform.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/buy")}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
              >
                Explore Listings
              </button>

              <button
                onClick={() => navigate("/list-property")}
                className="px-6 py-3 border border-blue-500 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition"
              >
                List Your Property
              </button>
            </div>
          </div>

          {/* ✅ RIGHT HERO IMAGE */}
          <div className="flex-1 flex justify-center">
            <img
              src={hero}
              alt="Listo Qasa Hero"
              className="w-full max-w-lg rounded-2xl shadow-xl border border-slate-200"
            />
          </div>

        </div>
      </section>

      {/* ✅ FOOTER */}
      <footer className="w-full py-10 bg-slate-50 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Listo Qasa — AI Real Estate Platform
      </footer>

    </main>
  );
}
