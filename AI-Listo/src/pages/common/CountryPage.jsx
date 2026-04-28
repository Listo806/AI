import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";

const countries = {
  brazil: ["sao-paulo"],
  mexico: ["mexico-city"],
  argentina: ["buenos-aires"],
  chile: ["santiago"],
  peru: ["lima"],
  ecuador: ["quito"],
  colombia: ["bogota"],
};

const unslug = (text = "") =>
  text.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function CountryPage() {
  const { country } = useParams();

  const cities = countries[country];

  if (!cities) return <Navigate to="/" replace />;

  const countryName = unslug(country);

  return (
    <main style={{ padding: "60px 20px", maxWidth: "900px", margin: "auto" }}>
      <p className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            AI CRM in {countryName}
          </p>

      <h1 style={{ fontSize: "40px", fontWeight: "600" }}>
        Real Estate CRM in {countryName}
      </h1>

      <p style={{ marginTop: "20px", color: "#555", fontSize: "18px" }}>
        Cortexa helps real estate agents and brokers in {countryName}
        capture leads and close more deals with AI CRM.
      </p>

      <div style={{ marginTop: "40px" }}>
        <h3>Available Cities</h3>

        <div style={{ marginTop: "15px" }}>
          {cities.map((city) => (
            <Link
              key={city}
              to={`/${country}/${city}`}
              style={{
                display: "block",
                marginTop: "10px",
                color: "#2563eb",
              }}
            >
              {unslug(city)}
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}