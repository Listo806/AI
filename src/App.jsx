import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

/**
 * src/App.jsx
 * All-in-one update:
 * - Alternating slide-in + fade animations (IntersectionObserver-driven)
 * - Desktop-only optional scroll-snap toggle (runtime UI toggle included)
 * - Responsive animation tuning (smaller distances/durations on narrow viewports)
 * - Demo search wiring (mock API call with loading + results UI)
 * - Single-file drop-in ready for Tailwind + framer-motion projects
 *
 * Requirements:
 * - npm install framer-motion
 * - Tailwind CSS configured
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
          if (entry.isIntersecting) {
            controls.start("visible");
          }
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

function mockSearch({ query, location, price }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sample = [
        { id: 1, title: "3BR Ocean View Condo", location: "Miami", price: "$850,000" },
        { id: 2, title: "Downtown Loft", location: "NYC", price: "$1,200,000" },
        { id: 3, title: "Suburban Family Home", location: "Austin", price: "$420,000" },
      ];
      const filtered = sample.filter(
        (s) =>
          (!query || s.title.toLowerCase().includes(query.toLowerCase())) &&
          (!location || s.location.toLowerCase().includes(location.toLowerCase()))
      );
      resolve(filtered.length ? filtered : sample);
    }, 700 + Math.random() * 600);
  });
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);

  const [heroRef, heroControls] = useInViewAnimation(0.45);
  const [whatRef, whatControls] = useInViewAnimation(0.2);
  const [analyticsRef, analyticsControls] = useInViewAnimation(0.2);
  const [trustedRef, trustedControls] = useInViewAnimation(0.2);

  const [query, setQuery] = useState("");
  const [locationQ, setLocationQ] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const firstInputRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isNarrow = typeof window !== "undefined" ? window.innerWidth <= 640 : false;
  const baseDistance = isNarrow ? 24 : 60;
  const shortDuration = isNarrow ? 0.55 : 0.8;

  const NavLinks = ({ onClick }) => (
    <ul className="hidden md:flex space-x-6 text-sm font-medium text-gray-700">
      {NAV_LINKS.map((label) => (
        <li key={label} className="hover:text-gray-900 cursor-pointer" onClick={onClick}>
          {label}
        </li>
      ))}
    </ul>
  );

  async function handleSearch(e) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    setResults([]);
    try {
      const res = await mockSearch({ query, location: locationQ, price });
      setResults(res);
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen font-sans text-gray-800 bg-white ${snapEnabled ? "App-snap-enabled" : ""}`}>
      <style>{`
        @media (min-width: 768px) {
          .App-snap-enabled {
            scroll-snap-type: y proximity;
          }
          .App-snap-enabled section {
            scroll-snap-align: start;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full bg-white/85 backdrop-blur-md border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-semibold text-sm">AI</div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-wide text-gray-900">ListoQasa</span>
              <span className="text-xs text-gray-500 -mt-0.5">AI Real Estate</span>
            </div>
          </div>

          <NavLinks onClick={() => setMobileOpen(false)} />

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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gray-700">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile nav */}
        <div className={`md:hidden w-full bg-white border-t border-gray-100 transition-all overflow-hidden ${mobileOpen ? "max-h-96" : "max-h-0"}`}>
          <div className="px-4 pb-4">
            <ul className="flex flex-col space-y-2 py-3 text-gray-700 text-sm">
              {NAV_LINKS.map((label) => (
                <li key={label} className="py-2 px-2 rounded hover:bg-gray-50" onClick={() => setMobileOpen(false)}>
                  {label}
                </li>
              ))}
            </ul>
            <div className="px-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">Sign In</button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section ref={heroRef} className="pt-28 pb-20 bg-gradient-to-b from-blue-50 to-white text-center relative overflow-hidden">
        <motion.div
          initial="hidden"
          animate={heroControls}
          variants={createSlideVariants("left", Math.floor(baseDistance / 3))}
          transition={{ duration: shortDuration, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-6"
        >
          <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-6 italic leading-tight">
            Find Your Perfect Property — Powered by <span className="text-blue-600 font-medium">AI</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            Instantly match with homes, buyers, or investments using real-time AI property data.
          </p>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-white rounded-full shadow-md p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-2">
            <input
              ref={firstInputRef}
              type="text"
              aria-label="Property type"
              placeholder="Property type (House, Condo, Land)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              aria-label="Location"
              placeholder="Location"
              value={locationQ}
              onChange={(e) => setLocationQ(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              aria-label="Price range"
              placeholder="Price range"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
            />
            <button aria-label="Search properties" type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition">
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-500">
            <span className="mr-2">Popular:</span>
            <span className="text-blue-600 font-medium">"3br Miami", "Downtown Loft", "Ocean View"</span>
          </div>

          <div className="max-w-3xl mx-auto mt-6 px-3">
            {loading && <div className="text-sm text-gray-500">Searching properties...</div>}
            {error && <div className="text-sm text-red-500">{error}</div>}
            {!loading && results.length > 0 && (
              <div className="mt-4 bg-white shadow-sm border border-gray-100 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-2">Results</div>
                <ul className="space-y-3">
                  {results.map((r) => (
                    <li key={r.id} className="flex items-center justify-between p-3 rounded hover:bg-gray-50">
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{r.title}</div>
                        <div className="text-xs text-gray-500">{r.location}</div>
                      </div>
                      <div className="text-sm text-gray-700 font-medium">{r.price}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* PAGE 2 – WHAT WE DO */}
      <section ref={whatRef} className="py-24 max-w-6xl mx-auto px-6 space-y-12">
        <motion.div
          initial="hidden"
          animate={whatControls}
          variants={createSlideVariants("right", baseDistance)}
          transition={{ duration: shortDuration + 0.06, ease: "easeOut" }}
        >
          <h2 className="text-3xl italic mb-3 text-gray-900">“AI Property Matchmaker”</h2>
          <p className="text-gray-600 border-b border-blue-200 pb-2">
            Our AI instantly connects listings with matching buyers or renters based on behavior, preferences, and location.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={whatControls}
          variants={createSlideVariants("left", baseDistance)}
          transition={{ duration: shortDuration + 0.12, ease: "easeOut", delay: 0.06 }}
        >
          <h2 className="text-3xl italic mb-3 text-gray-900">“Smart CRM Automation”</h2>
          <p className="text-gray-600 border-b border-blue-200 pb-2">
            Manage leads effortlessly with automated follow-ups, reminders, and AI-powered deal flow tracking.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={whatControls}
          variants={createSlideVariants("right", Math.floor(baseDistance * 0.9))}
          transition={{ duration: shortDuration + 0.18, ease: "easeOut", delay: 0.12 }}
        >
          <h2 className="text-3xl italic mb-3 text-gray-900">“Instant Listing Uploads”</h2>
          <p className="text-gray-600 border-b border-blue-200 pb-2">
            Upload and publish listings across the network in seconds — no duplicates, no manual edits.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={whatControls}
          variants={createSlideVariants("left", Math.floor(baseDistance * 0.9))}
          transition={{ duration: shortDuration + 0.22, ease: "easeOut", delay: 0.18 }}
        >
          <h2 className="text-3xl italic mb-3 text-gray-900">“Seamless Team Collaboration”</h2>
          <p className="text-gray-600 border-b border-blue-200 pb-2">
            Agents, developers, and owners work together in real-time, sharing updates and analytics effortlessly.
          </p>
        </motion.div>
      </section>

      {/* PAGE 3 – ALL-IN-ONE & ANALYTICS WOW */}
      <section ref={analyticsRef} className="py-24 bg-gradient-to-b from-white to-blue-50 text-center">
        <motion.div
          initial="hidden"
          animate={analyticsControls}
          variants={createSlideVariants("right", Math.floor(baseDistance * 0.95))}
          transition={{ duration: shortDuration + 0.14, ease: "easeOut" }}
          className="px-6"
        >
          <h2 className="text-4xl italic mb-6 text-gray-900">“All-in-One & Analytics Wow”</h2>
          <p className="max-w-3xl mx-auto text-gray-600 mb-12">
            Gain full visibility into your leads, listings, and conversions — with real-time analytics that reveal what’s working and where to focus next.
          </p>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500">Leads / Mo</div>
                <div className="text-2xl font-semibold text-gray-900">1,248</div>
                <div className="text-xs text-green-600 mt-1">+12% vs last month</div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500">Listings Live</div>
                <div className="text-2xl font-semibold text-gray-900">3,402</div>
                <div className="text-xs text-gray-500 mt-1">Global inventory</div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500">Conversion Rate</div>
                <div className="text-2xl font-semibold text-gray-900">7.4%</div>
                <div className="text-xs text-gray-500 mt-1">Optimized by AI</div>
              </div>
            </div>

            <img
              src="https://res.cloudinary.com/demo/image/upload/v1699999999
