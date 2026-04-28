import React, { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";

const countries = {
  brazil: ["sao-paulo", "rio-de-janeiro"],
  mexico: ["mexico-city", "cancun"],
  argentina: ["buenos-aires"],
  chile: ["santiago"],
  peru: ["lima"],
  ecuador: ["quito"],
  colombia: ["bogota"],
};

const unslug = (text = "") =>
  text.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function useSeo(title, description) {
  React.useEffect(() => {
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", description);
  }, [title, description]);
}

const btn = {
  background: "#2563eb",
  color: "#fff",
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

export default function CityPage() {
  const { country, city } = useParams();

  const validCity = countries[country]?.includes(city);

  if (!validCity) {
    return <Navigate to="/" replace />;
  }

  const cityName = unslug(city);
  const countryName = unslug(country);

  useSeo(
    `Real Estate CRM in ${cityName}, ${countryName} | Cortexa AI CRM`,
    `AI real estate CRM in ${cityName}, ${countryName}. Capture leads, automate WhatsApp follow-up, manage pipelines, track deals, and close more real estate sales.`
  );

  const nearbyCities = useMemo(
    () => countries[country].filter((c) => c !== city).slice(0, 8),
    [country, city]
  );

  return (
    <main style={{ padding: "60px 20px", maxWidth: "1000px", margin: "auto" }}>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px" }}>

        <section>
          <p style={{
            display: "inline-block",
            background: "#dbeafe",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#1d4ed8"
          }}>
            AI CRM in {cityName}
          </p>

          <h1 style={{ fontSize: "42px", fontWeight: "700", marginTop: "15px" }}>
            Real Estate CRM in {cityName}, {countryName}
          </h1>

          <p style={{ marginTop: "20px", fontSize: "18px", color: "#555", lineHeight: "1.6" }}>
            Cortexa helps real estate agents, brokers, and property teams in {cityName}
            capture leads, automate WhatsApp follow-up, manage pipelines, track deals,
            and close more business with AI.
          </p>

          <ul style={{ marginTop: "25px", color: "#333", lineHeight: "1.8" }}>
            <li>✔ AI lead capture for {cityName} real estate agents</li>
            <li>✔ WhatsApp automation for faster lead response</li>
            <li>✔ AI follow-up, lead scoring, and appointment setting</li>
            <li>✔ Pipeline management and deal tracking</li>
            <li>✔ CRM analytics for brokers, agents, and teams</li>
          </ul>

          <div style={{ marginTop: "30px" }}>
            <button style={btn}>Start Free Trial</button>
          </div>
        </section>

        <section>
          <div style={{ border: "1px solid #e5e7eb", padding: "20px", borderRadius: "12px" }}>
            <h3>Lead Form</h3>
            <p style={{ color: "#666" }}>
              (Lead form component placeholder)
            </p>
          </div>
        </section>

      </div>

      <div style={{ marginTop: "70px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700" }}>
          AI CRM for Real Estate Agents in {cityName}
        </h2>

        <div style={{ marginTop: "15px", fontSize: "17px", color: "#555", lineHeight: "1.8" }}>
          <p>
            Cortexa gives real estate professionals in {cityName} a complete AI CRM system
            for lead capture, WhatsApp automation, instant follow-up, pipeline tracking,
            and revenue visibility.
          </p>

          <p>
            Leads from ads, property listings, websites, landing pages, and funnels can flow
            directly into the CRM, where AI agents help qualify prospects and move deals forward.
          </p>

          <p>
            Whether agents are selling homes, renting apartments, or handling investment deals,
            Cortexa helps reduce missed opportunities and improve conversions.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "50px" }}>
        <h3>Other cities in {countryName}</h3>

        <div style={{ marginTop: "15px" }}>
          {nearbyCities.map((c) => (
            <Link
              key={c}
              to={`/${country}/${c}`}
              style={{
                display: "inline-block",
                marginRight: "10px",
                marginTop: "10px",
                color: "#2563eb",
              }}
            >
              {unslug(c)}
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}