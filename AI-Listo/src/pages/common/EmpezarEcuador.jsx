import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, Mail, Phone, User } from "lucide-react";
import { submitContactForm } from "../../api/contact";
import phoneCountries from "./phoneCountries.json";
import hero from "../../assets/cortexa/empezar-crm-hero.png";
import brand from "../../assets/cortexa/empezar-brand.png";
import "./EmpezarEcuador.css";

export default function EmpezarEcuador() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [countryIso, setCountryIso] = useState("EC");
  const selectedCountry = phoneCountries.find((country) => country.iso === countryIso) || phoneCountries[0];
  const countryFlag = (iso) => iso.toUpperCase().replace(/./g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const localPhone = form.phone.trim();
    const phone = localPhone ? `${selectedCountry.dial}${localPhone.replace(/\D/g, "").replace(/^0+/, "")}` : "";
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Introduce tu nombre y un correo electrónico válido."); return;
    }
    if (localPhone && (!/^[\d\s().-]{5,22}$/.test(localPhone) || !/^\+\d{7,15}$/.test(phone))) {
      setError("Introduce un número de teléfono válido."); return;
    }
    setBusy(true); setError("");
    const result = await submitContactForm({
      name, email, company: "", topic: "Cortexa Ecuador - guía CRM",
      message: `Solicitud de guía de Cortexa desde /es-ec/empezar. Teléfono: ${phone || "No proporcionado"}`,
      language: "es", pagePath: "/es-ec/empezar", website: "",
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.status === 429 ? "Demasiados intentos. Inténtalo más tarde." : "No pudimos guardar tus datos. Inténtalo de nuevo.");
      return;
    }
    try { sessionStorage.setItem("cortexa_ec_lead", JSON.stringify({ name, email, phone, savedAt: new Date().toISOString() })); } catch (_) { /* storage optional */ }
    navigate("/es-ec");
  };
  return <main className="ce-start">
    <div className="ce-start-shell">
      <a href="/es-ec" className="ce-start-brand" aria-label="Cortexa Agentic CRM"><img src={brand} alt="CORTEXA | AGENTIC CRM" /></a>
      <div className="ce-start-grid">
        <section className="ce-start-intro">
          <h1>Tu negocio. Conectado.</h1>
          <p>Gestiona tus clientes potenciales y automatiza el seguimiento con el agente de IA de Cortexa.</p>
          <img className="ce-start-hero" src={hero} alt="Panel de Cortexa CRM con pipeline de ventas y agente de IA" />
        </section>
        <section className="ce-start-panel" aria-label="Formulario de contacto">
          <h2>Comienza con tus datos</h2>
          <p>Recibe tu guía de Cortexa por correo electrónico.</p>
          <form onSubmit={submit}>
            <label htmlFor="ce-name">Nombre</label>
            <div className="ce-start-field"><User aria-hidden="true"/><input id="ce-name" autoComplete="name" required minLength={2} value={form.name} onChange={change("name")} placeholder="Tu nombre completo" /></div>
            <label htmlFor="ce-email">Correo electrónico</label>
            <div className="ce-start-field"><Mail aria-hidden="true"/><input id="ce-email" type="email" autoComplete="email" required value={form.email} onChange={change("email")} placeholder="tu@empresa.com" /></div>
            <label htmlFor="ce-phone">Teléfono (opcional)</label>
            <div className="ce-start-field ce-start-phone-field">
              <div className="ce-start-country-wrap">
                <span className="ce-start-country-display" aria-hidden="true">
                  <img className="ce-start-flag" src={`https://flagcdn.com/w40/${selectedCountry.iso.toLowerCase()}.png`} alt="" width="27" height="19" />
                  <span className="ce-start-country-dial">{selectedCountry.dial}</span>
                  <ChevronDown className="ce-start-country-chevron" />
                </span>
                <select className="ce-start-country" aria-label="Seleccionar país y código telefónico" title={`${selectedCountry.name} (${selectedCountry.dial})`} value={countryIso} onChange={(event) => setCountryIso(event.target.value)}>
                  {phoneCountries.map((country) => <option key={country.iso} value={country.iso}>{country.name} ({country.dial})</option>)}
                </select>
              </div>
              <Phone aria-hidden="true" />
              <input id="ce-phone" type="tel" autoComplete="tel-national" value={form.phone} onChange={change("phone")} placeholder="Tu número de teléfono" />
            </div>
            {error && <p className="ce-start-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? "Guardando..." : "Continuar"}<ArrowRight aria-hidden="true" /></button>
          </form>
        </section>
      </div>
    </div>
  </main>;
}
