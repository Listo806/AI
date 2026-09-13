import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarClock, Plus, Save, Sparkles, Stethoscope, UserRound, X } from "lucide-react";
import aestheticWellnessApi from "../../../api/aestheticWellnessApi";
import "./AestheticConversionFlow.css";

const TABS = [
  ["treatments", "Treatments", Stethoscope],
  ["providers", "Providers", UserRound],
  ["services-availability", "Services & Availability", CalendarClock],
  ["locations", "Locations", Building2],
];

const blankTreatment = { name: "", category: "", description: "", durationMinutes: 30, price: 0, rebookingDays: 90, bufferBefore: 0, bufferAfter: 0, isActive: true };
const blankProvider = { name: "", title: "", email: "", phone: "", locationId: "", availability: {}, isActive: true };
const blankLocation = { name: "", addressLine1: "", city: "", state: "", postalCode: "", country: "", timezone: "UTC", isActive: true };

export default function AestheticConversionFlow({ initialSection = "treatments", onClose }) {
  const initialTab = useMemo(() => TABS.some(([key]) => key === initialSection) ? initialSection : "treatments", [initialSection]);
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState({ treatments: [], providers: [], locations: [], pipelineConfig: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [treatment, setTreatment] = useState(blankTreatment);
  const [provider, setProvider] = useState(blankProvider);
  const [location, setLocation] = useState(blankLocation);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await aestheticWellnessApi.getConversionFlow();
      const value = res?.data ?? res ?? {};
      setData({
        treatments: value.treatments || [],
        providers: value.providers || [],
        locations: value.locations || [],
        pipelineConfig: value.pipelineConfig || {},
      });
    } catch (e) {
      setError(e?.message || "Unable to load clinic configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setTab(initialTab); }, [initialTab]);

  const saveTreatment = async () => {
    if (!treatment.name.trim()) return setError("Treatment name is required.");
    setSaving(true); setError("");
    try {
      if (treatment.id) await aestheticWellnessApi.updateTreatment(treatment.id, treatment);
      else await aestheticWellnessApi.createTreatment(treatment);
      setTreatment(blankTreatment);
      await load();
    } catch (e) { setError(e?.message || "Unable to save treatment."); }
    finally { setSaving(false); }
  };

  const saveProvider = async () => {
    if (!provider.name.trim()) return setError("Provider name is required.");
    setSaving(true); setError("");
    try {
      if (provider.id) await aestheticWellnessApi.updateProvider(provider.id, provider);
      else await aestheticWellnessApi.createProvider(provider);
      setProvider(blankProvider);
      await load();
    } catch (e) { setError(e?.message || "Unable to save provider."); }
    finally { setSaving(false); }
  };

  const saveLocation = async () => {
    if (!location.name.trim()) return setError("Location name is required.");
    setSaving(true); setError("");
    try {
      if (location.id) await aestheticWellnessApi.updateLocation(location.id, location);
      else await aestheticWellnessApi.createLocation(location);
      setLocation(blankLocation);
      await load();
    } catch (e) { setError(e?.message || "Unable to save location."); }
    finally { setSaving(false); }
  };

  return (
    <div className="awcf-shell">
      <div className="awcf-head">
        <div>
          <div className="awcf-kicker"><Sparkles size={15} /> AESTHETIC & WELLNESS</div>
          <h1>Clinic Conversion Flow</h1>
          <p>Configure treatments, providers, booking availability, and locations for the universal AI Agent.</p>
        </div>
        {onClose && <button className="awcf-close" onClick={onClose}><X size={18} /></button>}
      </div>

      <div className="awcf-tabs">
        {TABS.map(([key, label, Icon]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {error && <div className="awcf-error">{error}</div>}
      {loading ? <div className="awcf-loading">Loading clinic setup…</div> : (
        <div className="awcf-body">
          {tab === "treatments" && (
            <div className="awcf-grid">
              <section className="awcf-card">
                <div className="awcf-card-head"><h2>Treatments</h2><span>{data.treatments.length}</span></div>
                <div className="awcf-list">
                  {data.treatments.map((item) => (
                    <button key={item.id} className="awcf-row" onClick={() => setTreatment(item)}>
                      <div><strong>{item.name}</strong><span>{item.category || "Treatment"}</span></div>
                      <div className="right"><strong>${Number(item.price || 0).toLocaleString()}</strong><span>{item.durationMinutes} min</span></div>
                    </button>
                  ))}
                  {!data.treatments.length && <div className="awcf-empty">No treatments added yet.</div>}
                </div>
              </section>

              <section className="awcf-card awcf-form-card">
                <h2>{treatment.id ? "Edit Treatment" : "Add Treatment"}</h2>
                <div className="awcf-form-grid">
                  <label className="full">Treatment name<input value={treatment.name} onChange={(e) => setTreatment({ ...treatment, name: e.target.value })} /></label>
                  <label>Category<input value={treatment.category || ""} onChange={(e) => setTreatment({ ...treatment, category: e.target.value })} /></label>
                  <label>Duration (min)<input type="number" value={treatment.durationMinutes} onChange={(e) => setTreatment({ ...treatment, durationMinutes: Number(e.target.value) })} /></label>
                  <label>Price<input type="number" value={treatment.price} onChange={(e) => setTreatment({ ...treatment, price: Number(e.target.value) })} /></label>
                  <label>Rebooking after days<input type="number" value={treatment.rebookingDays ?? ""} onChange={(e) => setTreatment({ ...treatment, rebookingDays: e.target.value === "" ? "" : Number(e.target.value) })} /></label>
                  <label>Buffer before<input type="number" value={treatment.bufferBefore || 0} onChange={(e) => setTreatment({ ...treatment, bufferBefore: Number(e.target.value) })} /></label>
                  <label>Buffer after<input type="number" value={treatment.bufferAfter || 0} onChange={(e) => setTreatment({ ...treatment, bufferAfter: Number(e.target.value) })} /></label>
                  <label className="full">Description<textarea value={treatment.description || ""} onChange={(e) => setTreatment({ ...treatment, description: e.target.value })} /></label>
                </div>
                <div className="awcf-form-actions">
                  {treatment.id && <button className="ghost" onClick={() => setTreatment(blankTreatment)}>Cancel</button>}
                  <button className="primary" disabled={saving} onClick={saveTreatment}><Save size={14} /> {saving ? "Saving…" : "Save Treatment"}</button>
                </div>
              </section>
            </div>
          )}

          {tab === "providers" && (
            <div className="awcf-grid">
              <section className="awcf-card">
                <div className="awcf-card-head"><h2>Providers</h2><span>{data.providers.length}</span></div>
                <div className="awcf-list">
                  {data.providers.map((item) => (
                    <button key={item.id} className="awcf-row" onClick={() => setProvider(item)}>
                      <div><strong>{item.name}</strong><span>{item.title || "Provider"}</span></div>
                      <div className="right"><span>{item.locationName || "All locations"}</span></div>
                    </button>
                  ))}
                  {!data.providers.length && <div className="awcf-empty">No providers added yet.</div>}
                </div>
              </section>

              <section className="awcf-card awcf-form-card">
                <h2>{provider.id ? "Edit Provider" : "Add Provider"}</h2>
                <div className="awcf-form-grid">
                  <label className="full">Provider name<input value={provider.name} onChange={(e) => setProvider({ ...provider, name: e.target.value })} /></label>
                  <label>Title<input value={provider.title || ""} onChange={(e) => setProvider({ ...provider, title: e.target.value })} /></label>
                  <label>Location<select value={provider.locationId || ""} onChange={(e) => setProvider({ ...provider, locationId: e.target.value })}><option value="">All locations</option>{data.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
                  <label>Email<input value={provider.email || ""} onChange={(e) => setProvider({ ...provider, email: e.target.value })} /></label>
                  <label>Phone<input value={provider.phone || ""} onChange={(e) => setProvider({ ...provider, phone: e.target.value })} /></label>
                </div>
                <div className="awcf-form-actions">
                  {provider.id && <button className="ghost" onClick={() => setProvider(blankProvider)}>Cancel</button>}
                  <button className="primary" disabled={saving} onClick={saveProvider}><Save size={14} /> {saving ? "Saving…" : "Save Provider"}</button>
                </div>
              </section>
            </div>
          )}

          {tab === "locations" && (
            <div className="awcf-grid">
              <section className="awcf-card">
                <div className="awcf-card-head"><h2>Locations</h2><span>{data.locations.length}</span></div>
                <div className="awcf-list">
                  {data.locations.map((item) => (
                    <button key={item.id} className="awcf-row" onClick={() => setLocation(item)}>
                      <div><strong>{item.name}</strong><span>{[item.city, item.state].filter(Boolean).join(", ") || "Clinic location"}</span></div>
                      <div className="right"><span>{item.timezone || "UTC"}</span></div>
                    </button>
                  ))}
                  {!data.locations.length && <div className="awcf-empty">No locations added yet.</div>}
                </div>
              </section>

              <section className="awcf-card awcf-form-card">
                <h2>{location.id ? "Edit Location" : "Add Location"}</h2>
                <div className="awcf-form-grid">
                  <label className="full">Location name<input value={location.name} onChange={(e) => setLocation({ ...location, name: e.target.value })} /></label>
                  <label className="full">Address<input value={location.addressLine1 || ""} onChange={(e) => setLocation({ ...location, addressLine1: e.target.value })} /></label>
                  <label>City<input value={location.city || ""} onChange={(e) => setLocation({ ...location, city: e.target.value })} /></label>
                  <label>State<input value={location.state || ""} onChange={(e) => setLocation({ ...location, state: e.target.value })} /></label>
                  <label>Postal code<input value={location.postalCode || ""} onChange={(e) => setLocation({ ...location, postalCode: e.target.value })} /></label>
                  <label>Country<input value={location.country || ""} onChange={(e) => setLocation({ ...location, country: e.target.value })} /></label>
                  <label className="full">Timezone<input value={location.timezone || "UTC"} onChange={(e) => setLocation({ ...location, timezone: e.target.value })} /></label>
                </div>
                <div className="awcf-form-actions">
                  {location.id && <button className="ghost" onClick={() => setLocation(blankLocation)}>Cancel</button>}
                  <button className="primary" disabled={saving} onClick={saveLocation}><Save size={14} /> {saving ? "Saving…" : "Save Location"}</button>
                </div>
              </section>
            </div>
          )}

          {tab === "services-availability" && (
            <div className="awcf-card awcf-availability">
              <div className="awcf-card-head"><h2>Services & Availability</h2><span>{data.providers.length} providers</span></div>
              <p>Provider availability is stored per provider and treatment duration/buffers are stored per treatment. The AI booking rules from the universal Setup page apply on top of these clinic rules.</p>
              <div className="awcf-service-summary">
                <div><strong>{data.treatments.length}</strong><span>Active treatments</span></div>
                <div><strong>{data.providers.length}</strong><span>Providers</span></div>
                <div><strong>{data.locations.length}</strong><span>Locations</span></div>
              </div>
              <button className="primary" onClick={() => setTab("providers")}><Plus size={14} /> Manage Providers</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
