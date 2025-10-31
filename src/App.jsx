import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

/**
 * src/App.jsx
 * Single-file React public-facing landing experience for Listo Qasa Ultimate MVP.
 *
 * Now includes navigation to: /buy, /sell, /rent, /list-property, /owners, /assistant
 */

const NAV_LINKS = [
  "Buy",
  "Sell",
  "Rent",
  "List Property",
  "Owners",
  "Agents",
  "Developers",
  "Wholesalers",
  "Investors",
  "AI CRM",
  "AI Assistant",
  "Pricing",
];

function useInViewAnimation(threshold = 0.18) {
  const ref = useRef(null);
  const controls = useAnimation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) controls.start("visible");
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [controls, threshold]);

  return [ref, controls];
}

const createSlideVariants = (direction = "left", distance = 60) => {
  const xHidden = direction === "left" ? -distance : distance;
  return {
    hidden: { opacity: 0, x: xHidden, y: 10, scale: 0.995 },
    visible: { opacity: 1, x: 0, y: 0, scale: 1 },
  };
};

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);

  const [heroRef, heroControls] = useInViewAnimation(0.45);
  const [whatRef, whatControls] = useInViewAnimation(0.2);
  const [analyticsRef, analyticsControls] = useInViewAnimation(0.2);
  const [trustedRef, trustedControls] = useInViewAnimation(0.2);

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!firstInputRef.current) return;
  }, []);

  const NavLinks = ({ onClick }) => (
    <ul className="hidden md:flex space-x-6 text-sm font-medium text-gray-700">
      {NAV_LINKS.map((label) => (
        <li
          key={label}
          className="hover:text-gray-900 cursor-pointer"
          onClick={() => {
            if (label === "Buy") window.location.href = "/buy";
            else if (label === "Sell") window.location.href = "/sell";
            else if (label === "Rent") window.location.href = "/rent";
            else if (label === "List Property") window.location.href = "/list-property";
            else if (label === "Owners") window.location.href = "/owners";
            else if (label === "AI Assistant") window.location.href = "/assistant";
            else onClick && onClick();
          }}
        >
          {label}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full bg-white/85 backdrop-blur-md border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-semibold text-sm">
              AI
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-wide text-gray-900">
                ListoQasa
              </span>
              <span className="text-xs text-gray-500 -mt-0.5">AI Real Estate</span>
            </div>
          </div>

          {/* Desktop nav */}
          <NavLinks onClick={() => setMobileOpen(false)} />

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-4 mr-2">
              <label className="text-xs text-gray-500 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={() => setSnapEnabled((s) => !s)}
                  className="w-4 h-4"
                />
                <span>Desktop snap</span>
              </label>
            </div>

            <button className="hidden md:inline-flex items-center ml-4 px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition">
              Sign In
            </button>

            <button
              aria-label="Open menu"
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setMobileOpen((s) => !s)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="text-gray-700"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile nav */}
        <div
          className={`md:hidden w-full bg-white border-t border-gray-100 transition-all overflow-hidden ${
            mobileOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="px-4 pb-4">
            <ul className="flex flex-col space-y-2 py-3 text-gray-700 text-sm">
              {NAV_LINKS.map((label) => (
                <li
                  key={label}
                  className="py-2 px-2 rounded hover:bg-gray-50"
                  onClick={() => {
                    setMobileOpen(false);
                    if (label === "Buy") window.location.href = "/buy";
                    else if (label === "Sell") window.location.href = "/sell";
                    else if (label === "Rent") window.location.href = "/rent";
                    else if (label === "List Property") window.location.href = "/list-property";
                    else if (label === "Owners") window.location.href = "/owners";
                    else if (label === "AI Assistant") window.location.href = "/assistant";
                  }}
                >
                  {label}
                </li>
              ))}
            </ul>
            <div className="px-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50 to-white text-center relative overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-light text-gray-900 mb-6 italic"
        >
          Find Your Perfect Property — Powered by{" "}
          <span className="text-blue-600">AI</span>
        </motion.h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10">
          Instantly match with homes, buyers, or investments using real-time AI
          property data.
        </p>
        <div className="max-w-3xl mx-auto bg-white rounded-full shadow-md p-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-2">
          <input
            type="text"
            placeholder="Property type (House, Condo, Land)"
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Location"
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Price range"
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition">
            Search
          </button>
        </div>
      </section>

      {/* PAGE 2 – WHAT WE DO */}
      <section className="py-24 max-w-6xl mx-auto px-6 space-y-16">
        <div>
          <h2 className="text-3xl italic mb-3 text-gray-900">
            “AI Property Matchmaker”
          </h2>
          <p className="text-gray-600 border-b border-blue-200 pb-2">
            Our AI instantly connects listings with matching buyers or renters
            based on behavior, preferences, and location.
          </p>
        </div>
        <div>
          <h2 className="text-3xl italic mb-3 text-gray-900">
            “Smart CRM Automation”
          </h2>
          <p className="text-gray-600 border-b border-blue-200 pb-2">
            Manage leads effortlessly with automated follow-ups, reminders, and
            AI-powered deal flow tracking.
          </p>
        </div>
        <div>
          <h2 className="text-3xl italic mb-3 text-gray-900">
            “Instant Listing Uploads”
          </h2>
          <p className="text-gray-600 border-b border-blue-200 pb-2">
            Upload and publish listings across the network in seconds — no
            duplicates, no manual edits.
          </p>
        </div>
        <div>
          <h2 className="text-3xl italic mb-3 text-gray-900">
            “Seamless Team Collaboration”
          </h2>
          <p className="text-gray-600 border-b border-blue-200 pb-2">
            Agents, developers, and owners work together in real-time, sharing
            updates and analytics effortlessly.
          </p>
        </div>
      </section>

      {/* PAGE 3 – ALL-IN-ONE & ANALYTICS WOW */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50 text-center">
        <h2 className="text-4xl italic mb-6 text-gray-900">
          “All-in-One & Analytics Wow”
        </h2>
        <p className="max-w-3xl mx-auto text-gray-600 mb-12">
          Gain full visibility into your leads, listings, and conversions — with
          real-time analytics that reveal what’s working and where to focus
          next.
        </p>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
          <img
            src="https://res.cloudinary.com/demo/image/upload/v1699999999/analytics_mockup.png"
            alt="Analytics Mockup"
            className="w-full rounded-lg shadow-sm"
          />
        </div>
      </section>

      {/* PAGE 4 – TRUSTED WORLDWIDE */}
      <section className="py-24 text-center bg-white">
        <h2 className="text-3xl italic text-gray-900 mb-4">
          “Trusted by Agents, Developers, and Investors Worldwide”
        </h2>
        <p className="text-gray-600 mb-10">
          Our platform is powering AI real-estate connections across multiple
          countries and growing fast.
        </p>
        <div className="flex flex-wrap justify-center gap-10 max-w-5xl mx-auto">
          <img
            src="https://res.cloudinary.com/demo/image/upload/v1700000001/logo1.png"
            alt="Logo1"
            className="h-12"
          />
          <img
            src="https://res.cloudinary.com/demo/image/upload/v1700000001/logo2.png"
            alt="Logo2"
            className="h-12"
          />
          <img
            src="https://res.cloudinary.com/demo/image/upload/v1700000001/logo3.png"
            alt="Logo3"
            className="h-12"
          />
          <img
            src="https://res.cloudinary.com/demo/image/upload/v1700000001/logo4.png"
            alt="Logo4"
            className="h-12"
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center border-t border-gray-100 text-sm text-gray-500 bg-white">
        © {new Date().getFullYear()} Listo Qasa — All rights reserved.
      </footer>
    </div>
  );
}

