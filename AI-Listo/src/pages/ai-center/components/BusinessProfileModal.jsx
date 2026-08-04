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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
              <h2>{t("aiCenter.businessProfileModal.title", "Business Profile")}</h2>
              <p>
                {t(
                  "aiCenter.businessProfileModal.subtitle",
                  "Teach your AI Agent about your real-estate business.",
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("aiCenter.businessProfileModal.closeAria", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit}>
          {error && <div className="cx-business-modal-error">{error}</div>}

          <section>
            <h3>
              {t(
                "aiCenter.businessProfileModal.businessDetailsHeading",
                "Business details",
              )}
            </h3>
            <div className="cx-business-form-grid">
              <label>
                <span>
                  {t(
                    "aiCenter.businessProfileModal.businessNameLabel",
                    "Business name",
                  )}{" "}
                  <b>*</b>
                </span>
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
                <span>
                  {t(
                    "aiCenter.businessProfileModal.businessTypeLabel",
                    "Business type",
                  )}{" "}
                  <b>*</b>
                </span>
                <select
                  value={form.businessType}
                  onChange={update("businessType")}
                >
                  <option value="real_estate">
                    {t(
                      "aiCenter.businessProfileModal.typeRealEstate",
                      "Real Estate Agency",
                    )}
                  </option>
                  <option value="brokerage">
                    {t(
                      "aiCenter.businessProfileModal.typeBrokerage",
                      "Brokerage",
                    )}
                  </option>
                  <option value="property_management">
                    {t(
                      "aiCenter.businessProfileModal.typePropertyManagement",
                      "Property Management",
                    )}
                  </option>
                  <option value="investor">
                    {t(
                      "aiCenter.businessProfileModal.typeInvestor",
                      "Real Estate Investor",
                    )}
                  </option>
                  <option value="developer">
                    {t(
                      "aiCenter.businessProfileModal.typeDeveloper",
                      "Property Developer",
                    )}
                  </option>
                  <option value="other">
                    {t("aiCenter.businessProfileModal.typeOther", "Other")}
                  </option>
                </select>
              </label>

              <label className="full">
                <span>
                  {t(
                    "aiCenter.businessProfileModal.businessDescriptionLabel",
                    "Business description",
                  )}{" "}
                  <b>*</b>
                </span>
                <textarea
                  value={form.description}
                  onChange={update("description")}
                  rows={4}
                  maxLength={2000}
                  placeholder={t(
                    "aiCenter.businessProfileModal.businessDescriptionPlaceholder",
                    "Describe your business, ideal clients, markets and services.",
                  )}
                />
                <small>{form.description.length}/2000</small>
              </label>
            </div>
          </section>

          <section>
            <h3>
              {t(
                "aiCenter.businessProfileModal.contactInfoHeading",
                "Contact information",
              )}
            </h3>
            <div className="cx-business-form-grid">
              <label>
                {t("aiCenter.businessProfileModal.websiteLabel", "Website")}
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
                {t("aiCenter.businessProfileModal.emailLabel", "Email")}
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
                {t("aiCenter.businessProfileModal.phoneLabel", "Phone")}
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
                {t("aiCenter.businessProfileModal.currencyLabel", "Currency")}
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
            <h3>
              {t(
                "aiCenter.businessProfileModal.primaryLocationHeading",
                "Primary location",
              )}
            </h3>
            <div className="cx-business-form-grid">
              <label className="full">
                {t("aiCenter.businessProfileModal.addressLabel", "Address")}
                <div className="cx-business-input-wrap">
                  <MapPin size={17} />
                  <input
                    value={form.addressLine1}
                    onChange={update("addressLine1")}
                    placeholder={t(
                      "aiCenter.businessProfileModal.addressPlaceholder",
                      "Street address",
                    )}
                  />
                </div>
              </label>

              <label>
                <span>
                  {t("aiCenter.businessProfileModal.cityLabel", "City")}{" "}
                  <b>*</b>
                </span>
                <input
                  value={form.city}
                  onChange={update("city")}
                  placeholder="Miami"
                />
              </label>

              <label>
                {t(
                  "aiCenter.businessProfileModal.stateLabel",
                  "State / Province",
                )}
                <input
                  value={form.state}
                  onChange={update("state")}
                  placeholder="Florida"
                />
              </label>

              <label>
                {t(
                  "aiCenter.businessProfileModal.postalCodeLabel",
                  "Postal code",
                )}
                <input
                  value={form.postalCode}
                  onChange={update("postalCode")}
                  placeholder="33101"
                />
              </label>

              <label>
                <span>
                  {t("aiCenter.businessProfileModal.countryLabel", "Country")}{" "}
                  <b>*</b>
                </span>
                <input
                  value={form.country}
                  onChange={update("country")}
                  placeholder={t(
                    "aiCenter.businessProfileModal.countryPlaceholder",
                    "United States",
                  )}
                />
              </label>
            </div>
          </section>

          <section>
            <h3>
              {t(
                "aiCenter.businessProfileModal.aiKnowledgeHeading",
                "AI knowledge",
              )}
            </h3>
            <div className="cx-business-form-grid">
              <label className="full">
                {t(
                  "aiCenter.businessProfileModal.serviceAreasLabel",
                  "Service areas",
                )}
                <input
                  value={form.serviceAreasText}
                  onChange={update("serviceAreasText")}
                  placeholder="Miami, Fort Lauderdale, Palm Beach"
                />
                <small>
                  {t(
                    "aiCenter.businessProfileModal.serviceAreasHint",
                    "Separate multiple values with commas.",
                  )}
                </small>
              </label>

              <label className="full">
                {t(
                  "aiCenter.businessProfileModal.specialtiesLabel",
                  "Specialties",
                )}
                <input
                  value={form.specialtiesText}
                  onChange={update("specialtiesText")}
                  placeholder={t(
                    "aiCenter.businessProfileModal.specialtiesPlaceholder",
                    "Luxury homes, Condos, First-time buyers",
                  )}
                />
              </label>

              <label>
                {t("aiCenter.businessProfileModal.languagesLabel", "Languages")}
                <input
                  value={form.languagesText}
                  onChange={update("languagesText")}
                  placeholder={t(
                    "aiCenter.businessProfileModal.languagesPlaceholder",
                    "English, Spanish",
                  )}
                />
              </label>

              <label>
                {t("aiCenter.businessProfileModal.timezoneLabel", "Timezone")}
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
                  {t(
                    "aiCenter.businessProfileModal.requiredComplete",
                    "Required information completed",
                  )}
                </span>
              ) : (
                <span>
                  {t(
                    "aiCenter.businessProfileModal.requiredIncomplete",
                    "Complete all fields marked with *",
                  )}
                </span>
              )}
            </div>

            <button type="button" className="secondary" onClick={onClose}>
              {t("aiCenter.businessProfileModal.cancelButton", "Cancel")}
            </button>

            <button
              type="submit"
              className="primary"
              disabled={!requiredComplete || saving}
            >
              <Save size={16} />
              {saving
                ? t("aiCenter.businessProfileModal.savingButton", "Saving...")
                : t(
                    "aiCenter.businessProfileModal.saveButton",
                    "Save Business Profile",
                  )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
