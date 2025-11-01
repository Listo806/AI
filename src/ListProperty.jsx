import React from "react";
import { motion } from "framer-motion";

export default function ListProperty() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white text-gray-800">
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-semibold text-sm">
              AI
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-wide text-gray-900">
                ListoQasa
              </span>
              <span className="text-xs text-gray-500 -mt-0.5">
                AI Real Estate
              </span>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Home
          </button>
        </nav>
      </header>

      {/* HERO */}
      <main className="pt-32 pb-20 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-light italic text-gray-900 mb-4"
        >
          List Your Property — <span className="text-blue-600">Powered by AI</span>
        </motion.h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-10">
          Our AI engine automatically optimizes your listings for visibility,
          exposure, and performance. Upload in seconds — reach thousands instantly.
        </p>

        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl border border-gray-100 p-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Upload Your Listing in 3 Simple Steps
          </h3>
          <ol className="text-left list-decimal list-inside text-gray-700 space-y-3">
            <li>Click the “Upload Property” button below.</li>
            <li>Enter details — location, price, photos, and description.</li>
            <li>Let our AI enhance your images and publish instantly!</li>
          </ol>
          <button className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition">
            Upload Property
          </button>
        </div>
      </main>

      {/* WHY LIST WITH US */}
      <section className="py-24 bg-white text-center">
        <h2 className="text-4xl italic text-gray-900 mb-6">
          Why List With <span className="text-blue-600">ListoQasa</span>?
        </h2>
        <p className="max-w-3xl mx-auto text-gray-600 mb-12">
          We combine advanced AI marketing, automatic exposure boosts, and real-time
          analytics — giving every property maximum visibility.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          <div className="bg-blue-50 rounded-2xl p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">⚡ Fast Uploads</h3>
            <p className="text-gray-600 text-sm">
              Drag and drop your photos and publish instantly — no coding or waiting.
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">📈 Maximum Exposure</h3>
            <p className="text-gray-600 text-sm">
              AI distributes your listing across our high-traffic network and homepage.
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">🤖 Smart Automation</h3>
            <p className="text-gray-600 text-sm">
              Our system optimizes titles, tags, and keywords to increase impressions.
            </p>
          </div>
        </div>
      </section>

      {/* METRICS SECTION */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50 text-center">
        <h2 className="text-3xl italic text-gray-900 mb-10">
          Our Results Speak for Themselves
        </h2>
        <div className="flex flex-wrap justify-center gap-10 max-w-5xl mx-auto">
          <div className="text-center">
            <h3 className="text-5xl font-bold text-blue-600 mb-2">10M+</h3>
            <p className="text-gray-600 text-sm">Monthly Impressions</p>
          </div>
          <div className="text-center">
            <h3 className="text-5xl font-bold text-blue-600 mb-2">50K+</h3>
            <p className="text-gray-600 text-sm">Active Listings</p>
          </div>
          <div className="text-center">
            <h3 className="text-5xl font-bold text-blue-600 mb-2">98%</h3>
            <p className="text-gray-600 text-sm">Listing Satisfaction</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center border-t border-gray-100 text-sm text-gray-500 bg-white">
        © {new Date().getFullYear()} Listo Qasa — All rights reserved.
      </footer>
    </div>
  );
}

