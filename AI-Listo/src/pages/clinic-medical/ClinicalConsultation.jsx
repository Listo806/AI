import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Circle,
  ClipboardList,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  Save,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { clinicMedicalApi } from "../../api/clinicMedicalApi";
import "./ClinicMedical.css";

const ENCOUNTER_TYPES = [
  "General Consultation",
  "Follow-up Visit",
  "Preventive Care",
  "Chronic Care",
];

const ROS_ITEMS = [
  "Constitutional",
  "Eyes",
  "ENT",
  "Cardiovascular",
  "Respiratory",
  "Gastrointestinal",
  "Genitourinary",
  "Musculoskeletal",
  "Skin",
  "Neurologic",
  "Psychiatric",
  "Endocrine",
  "Hematologic",
  "Allergic / Immunologic",
];

const text = (value) => String(value ?? "").trim();
const has = (value) => text(value).length > 0;
const hasVitals = (vitals = {}) =>
  Object.values(vitals || {}).some((value) => has(value));

const fmtEncounterDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const activeMedication = (medication) =>
  String(medication?.status || "").toLowerCase() === "active";

export default function ClinicalConsultation() {
  const { consultationId } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setError("");
        const response = await clinicMedicalApi.consultation(consultationId);
        const next = response?.data ?? response;
        if (!alive) return;

        setData(next);

        if (next?.patient?.id) {
          try {
            const patientResponse = await clinicMedicalApi.patient(next.patient.id);
            if (alive) setPatientData(patientResponse?.data ?? patientResponse);
          } catch {
            if (alive) setPatientData(null);
          }
        }
      } catch (e) {
        if (alive) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "Could not load consultation.",
          );
        }
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [consultationId]);

  const setField = (key, value) => {
    setData((current) => ({
      ...current,
      consultation: {
        ...current.consultation,
        [key]: value,
      },
    }));
  };

  if (!data) {
    return (
      <div className="cm consultation cm-consult-v3">
        <div className="cm-empty">{error || "Loading consultation…"}</div>
      </div>
    );
  }

  const c = data.consultation || {};
  const p = data.patient || {};
  const vitals = c.vitals || {};
  const ros = Array.isArray(c.reviewOfSystems) ? c.reviewOfSystems : [];

  const medications = patientData?.medications || [];
  const orders = patientData?.orders || [];
  const conditions = patientData?.conditions || [];
  const consultations = patientData?.consultations || [];
  const alerts = patientData?.alerts || data.alerts || [];

  const activeMedications = medications.filter(activeMedication);
  const latestDiagnosis =
    consultations.find((item) => has(item?.diagnosis)) ||
    conditions.find((item) => has(item?.label)) ||
    null;

  const setVital = (key, value) =>
    setField("vitals", { ...vitals, [key]: value });

  const toggleRos = (item) => {
    const next = ros.includes(item)
      ? ros.filter((value) => value !== item)
      : [...ros, item];
    setField("reviewOfSystems", next);
  };

  const completionItems = [
    {
      label: "Visit Details",
      done: has(c.encounterType) && has(c.visitReason),
    },
    { label: "Vital Signs", done: hasVitals(vitals) },
    {
      label: "Clinical Notes",
      done: has(c.clinicalObservations) || has(c.physicalExamination),
    },
    {
      label: "Assessment",
      done: has(c.assessment) || has(c.diagnosis),
    },
    {
      label: "Care Plan",
      done:
        has(c.carePlan) ||
        has(c.followUpTimeframe) ||
        has(c.patientInstructions),
    },
    {
      label: "Signature",
      done: Boolean(c.signed_at || c.signedAt || c.status === "completed"),
    },
  ];

  const completedCount = completionItems.filter((item) => item.done).length;
  const completionPercent = Math.round(
    (completedCount / completionItems.length) * 100,
  );

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await clinicMedicalApi.saveConsultation(
        consultationId,
        c,
      );
      const next = response?.data ?? response;
      if (next?.consultation) setData(next);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Could not save consultation.",
      );
    } finally {
      setSaving(false);
    }
  };

  const complete = async () => {
    setSaving(true);
    setError("");
    try {
      await clinicMedicalApi.completeConsultation(consultationId, {
        ...c,
        signatureName: c.signatureName || c.providerName || null,
        status: "completed",
      });
      nav(`/dashboard/clinic-medical/patients/${p.id}`);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Could not complete consultation.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cm consultation cm-consult-v3">
      <div className="cm-top cmc3-top">
        <div className="cm-heading cmc3-heading">
          <CalendarDays />
          <div>
            <h1>Clinical Consultation</h1>
            <p>Document today's patient encounter.</p>
          </div>
        </div>

        <div className="cm-actions cmc3-actions">
          <button type="button" onClick={save} disabled={saving}>
            <Save />
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)}>
            <FileText />
            Preview Summary
          </button>
          <button
            type="button"
            className="primary"
            onClick={complete}
            disabled={saving}
          >
            <Stethoscope />
            Complete &amp; Sign
          </button>
        </div>
      </div>

      {error && <div className="cm-error cmc3-error">{error}</div>}

      <div className="cmc3-patient">
        <i>{p.initials || "—"}</i>
        <div className="cmc3-patient-name">
          <h2>{p.name || "Patient"}</h2>
          <b>MRN&nbsp; {p.medicalRecordNo || "—"}</b>
        </div>

        <div className="cmc3-patient-meta">
          <span>
            <UserRound />
            {p.gender || "—"} · {p.age ?? "—"} years
          </span>
          <span>
            <UserRound />
            {c.providerName || "Unassigned"}
          </span>
          <span>
            <CalendarDays />
            {fmtEncounterDate(c.encounterAt)}
          </span>
        </div>

        {alerts[0] && (
          <div className="cmc3-header-alert">
            <AlertTriangle />
            {alerts[0].label}
          </div>
        )}
      </div>

      <div className="cmc3-layout">
        <main className="cmc3-main">
          <div className="cmc3-first-row">
            <section className="cm-panel cmc3-panel cmc3-visit">
              <h3>
                <FileText />
                Visit Details
              </h3>

              <div className="cmc3-fields cmc3-fields-visit">
                <label>
                  Encounter Type
                  <select
                    value={c.encounterType || ""}
                    onChange={(e) => setField("encounterType", e.target.value)}
                  >
                    <option value="">Select encounter type</option>
                    {ENCOUNTER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Reason for Visit
                  <input
                    value={c.visitReason || ""}
                    onChange={(e) => setField("visitReason", e.target.value)}
                  />
                </label>
              </div>

              <label className="cmc3-block-label">
                Symptoms / History
                <textarea
                  value={c.symptoms || ""}
                  onChange={(e) => setField("symptoms", e.target.value)}
                />
              </label>
            </section>

            <section className="cm-panel cmc3-panel cmc3-vitals">
              <h3>
                <HeartPulse />
                Vital Signs
              </h3>

              <div className="cmc3-vitals-grid">
                {[
                  ["bloodPressure", "Blood Pressure"],
                  ["heartRate", "Heart Rate"],
                  ["temperature", "Temperature"],
                  ["respiratoryRate", "Respiratory Rate"],
                  ["oxygenSaturation", "O₂ Saturation"],
                  ["weight", "Weight"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      value={vitals[key] || ""}
                      onChange={(e) => setVital(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          <section className="cm-panel cmc3-panel cmc3-notes">
            <h3>
              <UserRound />
              Clinical Notes &amp; Examination
            </h3>

            <div className="cmc3-notes-grid">
              <div className="cmc3-notes-left">
                <label className="cmc3-sub-label">Review of Systems</label>
                <div className="cmc3-ros">
                  {ROS_ITEMS.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={ros.includes(item) ? "active" : ""}
                      onClick={() => toggleRos(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <label className="cmc3-block-label">
                  Clinical Observations
                  <textarea
                    value={c.clinicalObservations || ""}
                    onChange={(e) =>
                      setField("clinicalObservations", e.target.value)
                    }
                  />
                </label>
              </div>

              <label className="cmc3-block-label cmc3-exam">
                Physical Examination
                <textarea
                  value={c.physicalExamination || ""}
                  onChange={(e) =>
                    setField("physicalExamination", e.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="cm-panel cmc3-panel cmc3-assessment">
            <h3>
              <Stethoscope />
              Assessment &amp; Diagnosis
            </h3>

            <div className="cmc3-assessment-grid">
              <label>
                Assessment
                <textarea
                  value={c.assessment || ""}
                  onChange={(e) => setField("assessment", e.target.value)}
                />
              </label>

              <label>
                Diagnosis
                <input
                  value={c.diagnosis || ""}
                  onChange={(e) => setField("diagnosis", e.target.value)}
                />
              </label>

              <label>
                ICD-10
                <input
                  placeholder="e.g. Z00.00"
                  value={c.icd10 || ""}
                  onChange={(e) => setField("icd10", e.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="cmc3-bottom-row">
            <section className="cm-panel cmc3-panel cmc3-care">
              <h3>
                <FileText />
                Care Plan
              </h3>

              <div className="cmc3-care-grid">
                <label className="cmc3-block-label">
                  Treatment Plan
                  <textarea
                    value={c.carePlan || ""}
                    onChange={(e) => setField("carePlan", e.target.value)}
                  />
                </label>

                <div className="cmc3-data-column">
                  <label className="cmc3-sub-label">Prescriptions</label>
                  <div className="cmc3-data-list">
                    {activeMedications.length ? (
                      activeMedications.slice(0, 2).map((med) => (
                        <span key={med.id}>
                          <Pill />
                          {med.name}
                          {med.dosage ? ` ${med.dosage}` : ""}
                        </span>
                      ))
                    ) : (
                      <small>No active prescriptions</small>
                    )}
                  </div>
                </div>

                <div className="cmc3-data-column">
                  <label className="cmc3-sub-label">Lab &amp; Imaging Orders</label>
                  <div className="cmc3-data-list">
                    {orders.length ? (
                      orders.slice(0, 2).map((order) => (
                        <span key={order.id}>
                          <ClipboardList />
                          {order.name}
                        </span>
                      ))
                    ) : (
                      <small>No current orders</small>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="cm-panel cmc3-panel cmc3-follow">
              <h3>
                <CalendarDays />
                Follow-Up &amp; Patient Instructions
              </h3>

              <div className="cmc3-follow-grid">
                <label>
                  Follow-up Timeframe
                  <input
                    placeholder="e.g. 2 weeks"
                    value={c.followUpTimeframe || ""}
                    onChange={(e) =>
                      setField("followUpTimeframe", e.target.value)
                    }
                  />
                </label>

                <label>
                  Patient Instructions
                  <textarea
                    value={c.patientInstructions || ""}
                    onChange={(e) =>
                      setField("patientInstructions", e.target.value)
                    }
                  />
                </label>
              </div>
            </section>
          </div>
        </main>

        <aside className="cmc3-side">
          <section className="cm-panel cmc3-completion">
            <h3>
              <Stethoscope />
              Encounter Completion
            </h3>

            <div className="cmc3-completion-top">
              <div
                className="cmc3-ring"
                style={{
                  background: `conic-gradient(#4b38f2 ${completionPercent * 3.6}deg, #ececff 0deg)`,
                }}
              >
                <span>{completionPercent}%</span>
              </div>

              <div className="cmc3-progress-wrap">
                <div className="cmc3-progress">
                  <i style={{ width: `${completionPercent}%` }} />
                </div>
              </div>

              <b>
                {completedCount} of {completionItems.length}
              </b>
            </div>

            <div className="cmc3-checks">
              {completionItems.map((item) => (
                <div key={item.label} className={item.done ? "done" : ""}>
                  {item.done ? <Check /> : <Circle />}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="cm-panel cmc3-alerts">
            <header>
              <h3>
                <AlertTriangle />
                Patient Alerts
              </h3>
            </header>

            <div className="cmc3-alert-cards">
              {alerts.length ? (
                alerts.slice(0, 1).map((alert) => (
                  <article className="danger" key={alert.id}>
                    <AlertTriangle />
                    <div>
                      <b>{alert.label}</b>
                      {alert.reaction && <span>Reaction: {alert.reaction}</span>}
                    </div>
                    {alert.severity && <em>{alert.severity}</em>}
                  </article>
                ))
              ) : (
                <div className="cmc3-empty-alert">No active alerts.</div>
              )}

              {activeMedications[0] && (
                <article>
                  <Pill />
                  <div>
                    <b>Current Medication</b>
                    <span>
                      {activeMedications[0].name}
                      {activeMedications[0].dosage
                        ? ` ${activeMedications[0].dosage}`
                        : ""}
                    </span>
                  </div>
                  <em className="active">Active</em>
                </article>
              )}

              {latestDiagnosis && (
                <article>
                  <FileText />
                  <div>
                    <b>Last Diagnosis</b>
                    <span>
                      {latestDiagnosis.diagnosis || latestDiagnosis.label}
                    </span>
                    {latestDiagnosis.encounterAt && (
                      <small>{fmtEncounterDate(latestDiagnosis.encounterAt)}</small>
                    )}
                  </div>
                </article>
              )}
            </div>
          </section>
        </aside>
      </div>

      {previewOpen && (
        <div
          className="cm-modal-bg cmc3-preview-bg"
          onMouseDown={() => setPreviewOpen(false)}
        >
          <div
            className="cmc3-preview"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <h2>Consultation Summary</h2>
                <p>
                  {p.name || "Patient"} · MRN {p.medicalRecordNo || "—"}
                </p>
              </div>
              <button type="button" onClick={() => setPreviewOpen(false)}>
                ×
              </button>
            </header>

            <div className="cmc3-preview-body">
              {[
                ["Encounter Type", c.encounterType],
                ["Reason for Visit", c.visitReason],
                ["Symptoms / History", c.symptoms],
                ["Clinical Observations", c.clinicalObservations],
                ["Physical Examination", c.physicalExamination],
                ["Assessment", c.assessment],
                ["Diagnosis", c.diagnosis],
                ["ICD-10", c.icd10],
                ["Care Plan", c.carePlan],
                ["Follow-up", c.followUpTimeframe],
                ["Patient Instructions", c.patientInstructions],
              ].map(([label, value]) => (
                <div className="cmc3-summary-row" key={label}>
                  <b>{label}</b>
                  <span>{has(value) ? value : "—"}</span>
                </div>
              ))}
            </div>

            <footer>
              <button type="button" onClick={() => window.print()}>
                Print
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
