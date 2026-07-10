import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
} from "lucide-react";
import "./BusinessProfileModal.css";

const EMPTY_FORM = {
  businessName: "",
  businessType: "real_estate",
  description: "",
  website: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  serviceAreasText: "",
  specialtiesText: "",
  languagesText: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  currency: "USD",
};

const joinList = (value) =>
  Array.isArray(value) ? value.filter(Boolean).join(", ") : "";

const toList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function BusinessProfileModal({
  open,
  profile,
  saving,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;

    setForm({
      ...EMPTY_FORM,
      businessName: profile?.businessName || "",
      businessType: profile?.businessType || "real_estate",
      description: profile?.description || "",
      website: profile?.website || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      addressLine1: profile?.addressLine1 || "",
      addressLine2: profile?.addressLine2 || "",
      city: profile?.city || "",
      state: profile?.state || "",
      postalCode: profile?.postalCode || "",
      country: profile?.country || "",
      serviceAreasText: joinList(profile?.serviceAreas),
      specialtiesText: joinList(profile?.specialties),
      languagesText: joinList(profile?.languages),
      timezone:
        profile?.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "",
      currency: profile?.currency || "USD",
    });
  }, [open, profile]);

  const requiredComplete = useMemo(
    () =>
      Boolean(
        form.businessName.trim() &&
        form.businessType.trim() &&
        form.description.trim() &&
        form.city.trim() &&
        form.country.trim(),
      ),
    [
      form.businessName,
      form.businessType,
      form.description,
      form.city,
      form.country,
    ],
  );

  const update = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!requiredComplete || saving) return;

    await onSave({
      businessName: form.businessName.trim(),
      businessType: form.businessType,
      description: form.description.trim(),
      website: form.website.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      addressLine1: form.addressLine1.trim() || null,
      addressLine2: form.addressLine2.trim() || null,
      city: form.city.trim(),
      state: form.state.trim() || null,
      postalCode: form.postalCode.trim() || null,
      country: form.country.trim(),
      serviceAreas: toList(form.serviceAreasText),
      specialties: toList(form.specialtiesText),
      languages: toList(form.languagesText),
      timezone: form.timezone || null,
      currency: form.currency || "USD",
    });
  };

  if (!open) return null;

  return (
    <div className="cx-business-modal-backdrop" onMouseDown={onClose}>
      <div
        className="cx-business-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cx-business-modal-head">
          <div>
            <span className="cx-business-modal-icon">
              <Building2 size={22} />
            </span>
            <div>
              <h2>Business Profile</h2>
              <p>Teach your AI Agent about your real-estate business.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit}>
          {error && <div className="cx-business-modal-error">{error}</div>}

          <section>
            <h3>Business details</h3>
            <div className="cx-business-form-grid">
              <label>
                Business name <b>*</b>
                <div className="cx-business-input-wrap">
                  <Building2 size={17} />
                  <input
                    value={form.businessName}
                    onChange={update("businessName")}
                    placeholder="Cortexa Realty"
                    maxLength={200}
                  />
                </div>
              </label>

              <label>
                Business type <b>*</b>
                <select
                  value={form.businessType}
                  onChange={update("businessType")}
                >
                  <option value="real_estate">Real Estate Agency</option>
                  <option value="brokerage">Brokerage</option>
                  <option value="property_management">
                    Property Management
                  </option>
                  <option value="investor">Real Estate Investor</option>
                  <option value="developer">Property Developer</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="full">
                Business description <b>*</b>
                <textarea
                  value={form.description}
                  onChange={update("description")}
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe your business, ideal clients, markets and services."
                />
                <small>{form.description.length}/2000</small>
              </label>
            </div>
          </section>

          <section>
            <h3>Contact information</h3>
            <div className="cx-business-form-grid">
              <label>
                Website
                <div className="cx-business-input-wrap">
                  <Globe2 size={17} />
                  <input
                    type="url"
                    value={form.website}
                    onChange={update("website")}
                    placeholder="https://example.com"
                  />
                </div>
              </label>

              <label>
                Email
                <div className="cx-business-input-wrap">
                  <Mail size={17} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="hello@example.com"
                  />
                </div>
              </label>

              <label>
                Phone
                <div className="cx-business-input-wrap">
                  <Phone size={17} />
                  <input
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </label>

              <label>
                Currency
                <select value={form.currency} onChange={update("currency")}>
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AUD">AUD</option>
                  <option value="CAD">CAD</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <h3>Primary location</h3>
            <div className="cx-business-form-grid">
              <label className="full">
                Address
                <div className="cx-business-input-wrap">
                  <MapPin size={17} />
                  <input
                    value={form.addressLine1}
                    onChange={update("addressLine1")}
                    placeholder="Street address"
                  />
                </div>
              </label>

              <label>
                City <b>*</b>
                <input
                  value={form.city}
                  onChange={update("city")}
                  placeholder="Miami"
                />
              </label>

              <label>
                State / Province
                <input
                  value={form.state}
                  onChange={update("state")}
                  placeholder="Florida"
                />
              </label>

              <label>
                Postal code
                <input
                  value={form.postalCode}
                  onChange={update("postalCode")}
                  placeholder="33101"
                />
              </label>

              <label>
                Country <b>*</b>
                <input
                  value={form.country}
                  onChange={update("country")}
                  placeholder="United States"
                />
              </label>
            </div>
          </section>

          <section>
            <h3>AI knowledge</h3>
            <div className="cx-business-form-grid">
              <label className="full">
                Service areas
                <input
                  value={form.serviceAreasText}
                  onChange={update("serviceAreasText")}
                  placeholder="Miami, Fort Lauderdale, Palm Beach"
                />
                <small>Separate multiple values with commas.</small>
              </label>

              <label className="full">
                Specialties
                <input
                  value={form.specialtiesText}
                  onChange={update("specialtiesText")}
                  placeholder="Luxury homes, Condos, First-time buyers"
                />
              </label>

              <label>
                Languages
                <input
                  value={form.languagesText}
                  onChange={update("languagesText")}
                  placeholder="English, Spanish"
                />
              </label>

              <label>
                Timezone
                <input
                  value={form.timezone}
                  onChange={update("timezone")}
                  placeholder="America/New_York"
                />
              </label>
            </div>
          </section>

          <div className="cx-business-modal-foot">
            <div>
              {requiredComplete ? (
                <span className="complete">
                  <CheckCircle2 size={16} />
                  Required information completed
                </span>
              ) : (
                <span>Complete all fields marked with *</span>
              )}
            </div>

            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>

            <button
              type="submit"
              className="primary"
              disabled={!requiredComplete || saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Business Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
