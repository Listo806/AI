
import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import DevelopersLandingPage from "./components/DevelopersLandingPage";
import WholesalersLandingPage from "./components/WholesalersLandingPage"; // 🆕 added

/**
 * src/App.jsx
 * Unified front-end for Listo Qasa Ultimate MVP
 * Includes full navigation and integrated landing pages for Developers & Wholesalers
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
  const [page, setPage] = useState("home"); // 🆕 now handles both pages

  const [heroRef, heroControls] = useInViewAnimation(0.45);
  const [whatRef, whatControls] = useInViewAnimation(0.2);
  const [analyticsRef, analyticsControls] = useInViewAnimation(0.2);
  const [trustedRef, trustedControls] = useInViewAnimation(0.2);

  const firstInputRef = useRef(null);
  useEffect(() => {
    if (!firstInputRef.current) return;
  }, []);

  const handleNavClick = (label) => {
    // ---- PAGE SWITCH LOGIC ----
    if (label === "Developers") {
      setPage("developers");
      window.scrollTo(0, 0);
      setMobileOpen(false);
      return;
    }
    if (label === "Wholesalers") {
      setPage("wholesalers");
      window.scrollTo(0, 0);
      setMobileOpen(false);

