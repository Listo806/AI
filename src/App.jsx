import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import DevelopersLandingPage from "./components/DevelopersLandingPage";

/**
 * src/App.jsx
 * Unified front-end for Listo Qasa Ultimate MVP
 * Includes full navigation and integrated Developers landing page
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
  const [page, setPage] = useState("home"); // 🆕 handle developers view toggle

  const [heroRef, heroControls] = useInViewAnimation(0.45);
  const [whatRef, whatControls] = useInViewAnimation(0.2);
  const [analyticsRef, analyticsControls] = useInViewAnimation(0.2);
  const [trustedRef, trustedControls] = useInViewAnimation(0.2);

  const firstInputRef = useRef(null);
  useEffect(() => {
    if (!firstInputRef.current) return;
  }, []);

  const handleNavClick = (label) => {
    if (label === "Developers") {
      // Instead of redirect, show the DevelopersLandingPage inline
      setPage("developers");
      window.scrollTo(0, 0);
      setMobileOpen(false);
      return;
    }
    if (label === "Buy") window.location.href = "/buy";
    else if (label === "Sell") window.location.href = "/sell";
    else if (label === "Rent") window.location.href = "/rent";
    else if (label === "List Property") window.location.href = "/list-property";
    else if (label === "Owners") window.location.href = "/owners";
    else if (label === "Agents") window.location.href = "/agents";
    else if (label === "AI Assistant") window.location.href = "/assistant";
    else setMobileOpen(false);
  };

  const NavLinks = () => (
    <ul className="hidden md:flex space-x-6 text-sm font-medium text-gray-700">
      {NAV_LINKS.map((label) => (
        <li
          key={label}
          className="hover:text-gray-900 cursor-pointer"
          onClick={() => handleNavClick(label)}
        >
          {label}
        </li>
      ))}
    </ul>
  );

  // When “Developers” is clicked, just show that page
  if (page === "developers") {
    return <DevelopersLandingPage />;
  }

  // Otherwise show your normal public landing
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
              <span className="text-xs text-gray-500 -mt-0.5">
                AI Real Estate
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <NavLinks />

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
                  onClick={() => handleNavClick(label)}
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

      {/* ---- MAIN LANDING SECTIONS ---- */}
      <main className="pt-24">
        {/* HERO + WHAT WE DO + ANALYTICS + TRUSTED + FOOTER */}
        {/* Your existing landing sections stay below unchanged */}
      </main>
    </div>
  );
}


