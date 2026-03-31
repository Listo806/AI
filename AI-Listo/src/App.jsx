import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import hero from "./assets/aicrm-hero.png";

export default function App() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  return (
    <main className="min-h-screen bg-white text-slate-900 relative">

      {/* LANGUAGE TOGGLE */}
      <div className="absolute top-6 right-6 flex gap-2 z-50">
        <button onClick={() => i18n.changeLanguage("en")} className="px-3 py-1 bg-gray-200 rounded">EN</button>
        <button onClick={() => i18n.changeLanguage("es")} className="px-3 py-1 bg-gray-200 rounded">ES</button>
        <button onClick={() => i18n.changeLanguage("pt")} className="px-3 py-1 bg-gray-200 rounded">PT</button>
      </div>

      {/* HERO */}
      <section className="w-full bg-gradient-to-br from-white via-slate-50 to-blue-50/30 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">

          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-semibold leading-tight mb-6 text-slate-900">
              {t("dashboard.title")}
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              {t("dashboard.newLeads")}
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/buy")}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
              >
                {t("common.view")}
              </button>

              <button
                onClick={() => navigate("/list-property")}
                className="px-6 py-3 border border-blue-500 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition"
              >
                {t("common.add")}
              </button>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <img
              src={hero}
              alt="Listo Qasa Hero"
              className="w-full max-w-lg rounded-2xl shadow-xl border border-slate-200"
            />
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-10 bg-slate-50 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Listo Qasa — AI Real Estate Platform
      </footer>

    </main>
  );
}
