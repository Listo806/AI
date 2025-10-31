
import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Owners() {
  const [billing, setBilling] = useState("monthly");

  const plans = [
    {
      name: "Pro",
      priceMonthly: 49.99,
      priceYearly: 499.99,
      tagline: "Regular Plan",
      features: [
        "Standard listing visibility",
        "AI photo enhancement",
        "Basic analytics dashboard",
        "Email support",
      ],
    },
    {
      name: "Pro Plus",
      priceMonthly: 99.99,
      priceYearly: 999.99,
      tagline: "Mid-Tier Exposure",
      features: [
        "Priority homepage exposure",
        "AI marketing automation",
        "Advanced analytics & insights",
        "Priority email + chat support",
      ],
    },
    {
      name: "Pro Max",
      priceMonthly: 149.99,
      priceYearly: 1499.99,
      tagline: "Maximum Exposure on Homepage",
      features: [
        "Top-tier homepage placement",
        "AI ad optimization",
        "Full analytics & CRM integration",
        "Dedicated account manager",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white text-gray-800">
      {/* HERO */}
      <section className="pt-28 pb-16 text-center bg-white">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-light italic text-gray-900 mb-4"
        >
          Choose Your Owner Plan
        </motion.h1>
        <p className="text-gray-600 text-lg mb-8">
          List smarter, reach more buyers, and let AI handle the marketing for you.
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center space-x-3 mb-8">
          <span
            className={`cursor-pointer text-sm font-medium ${
              billing === "monthly" ? "text-blue-600" : "text-gray-500"
            }`}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </span>
          <div className="w-10 h-5 bg-gray-300 rounded-full relative cursor-pointer">
            <div
              className={`absolute top-0.5 ${
                billing === "monthly" ? "left-0.5" : "left-5"
              } w-4 h-4 bg-blue-600 rounded-full transition-all`}
              onClick={() =>
                setBilling(billing === "monthly" ? "yearly" : "monthly")
              }
            ></div>
          </div>
          <span
            className={`cursor-pointer text-sm font-medium ${
              billing === "yearly" ? "text-blue-600" : "text-gray-500"
            }`}
            onClick={() => setBilling("yearly")}
          >
            Yearly (Save 20%)
          </span>
        </div>
      </section>

      {/* PLANS */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 px-6">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-lg flex flex-col items-center text-center p-8"
            >
              <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                {plan.name}
              </h3>
              <p className="text-blue-600 font-medium mb-4 italic">
                {plan.tagline}
              </p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                ${billing === "monthly" ? plan.priceMonthly : plan.priceYearly}
                <span className="text-sm text-gray-500 font-normal">
                  /{billing === "monthly" ? "mo" : "yr"}
                </span>
              </div>

              <ul className="text-gray-600 text-sm mb-8 space-y-2 text-left">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-blue-600">✔</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => alert(`Checkout for ${plan.name} coming soon!`)}
                className="px-8 py-3 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
              >
                Choose {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="pb-24 text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl font-light italic text-gray-900 mb-6"
        >
          Common Questions
        </motion.h2>
        <div className="max-w-3xl mx-auto text-gray-600 space-y-4 text-sm">
          <p>
            <strong>Do I need a contract?</strong> — No, all plans are
            month-to-month. Cancel anytime directly from your dashboard.
          </p>
          <p>
            <strong>Can I upgrade later?</strong> — Absolutely! Upgrade or
            downgrade with a single click.
          </p>
          <p>
            <strong>Are there hidden fees?</strong> — None. What you see is what
            you pay.
          </p>
        </div>

        <button
          onClick={() => alert("Redirecting to signup...")}
          className="mt-10 px-10 py-3 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition"
        >
          Start Your 30-Day Free Trial
        </button>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-blue-600 text-center text-white text-sm">
        © {new Date().getFullYear()} Listo Qasa — All rights reserved.
      </footer>
    </div>
  );
}
