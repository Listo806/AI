import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bot,
  CalendarDays,
  Clock3,
  DollarSign,
  Download,
  Filter,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { clinicMedicalApi } from "../../api/clinicMedicalApi";
import "./ClinicMedical.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "—";

const csv = (name, rows) => {
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

const stageLabel = (key) => {
  const labels = {
    new_inquiry: "New Inquiry",
    patient_registered: "Patient Registered",
    appointment_scheduled: "Appointment Scheduled",
    checked_in: "Checked In",
    consultation: "Consultation",
    follow_up: "Follow-Up",
  };
  return labels[key] || key.replaceAll("_", " ");
};

export default function ClinicMedicalWorkspace() {
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState("all");
  const [provider, setProvider] = useState("all");

  const load = () => {
    setLoading(true);
    setErr("");
    clinicMedicalApi
      .dashboard()
      .then((r) => setD(r?.data ?? r))
      .catch((e) =>
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Could not load clinic dashboard",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const metrics = d?.metrics || {};
  const cards = [
    ["New Patients", metrics.newPatients, metrics.newPatientsTrend, Users],
    [
      "Consultations Scheduled",
      metrics.consultationsScheduled,
      metrics.consultationsTrend,
      CalendarDays,
    ],
    [
      "Today's Appointments",
      metrics.todayAppointments,
      metrics.todayAppointmentsTrend,
      CalendarDays,
    ],
    [
      "Attendance Rate",
      `${metrics.attendanceRate ?? 0}%`,
      metrics.attendanceTrend,
      Activity,
    ],
    [
      "Revenue Today",
      fmtMoney(metrics.revenueToday),
      metrics.revenueTrend,
      DollarSign,
    ],
    ["Follow-Up Due", metrics.followUpDue, metrics.followUpTrend, RefreshCw],
  ];

  const providers = useMemo(
    () => [
      ...new Set(
        (d?.todaySchedule || []).map((v) => v.providerName).filter(Boolean),
      ),
    ],
    [d],
  );

  const schedule = useMemo(
    () =>
      (d?.todaySchedule || []).filter(
        (a) =>
          (scheduleStatus === "all" || a.status === scheduleStatus) &&
          (provider === "all" || a.providerName === provider),
      ),
    [d, scheduleStatus, provider],
  );

  const exportDashboard = () =>
    csv(`clinic-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Time", "Patient", "Visit Reason", "Provider", "Status"],
      ...schedule.map((a) => [
        a.startAt,
        a.patientName,
        a.title,
        a.providerName,
        a.status,
      ]),
    ]);

  const revenueSeries = d?.revenue?.series || [];
  const revenueMax = Math.max(
    Number(d?.revenue?.max || 0),
    ...revenueSeries.map(Number),
    1,
  );

  return (
    <div className="cm cm-dashboard-reference">
      <div className="cm-top cmd-top">
        <div className="cm-heading cmd-heading">
          <Stethoscope />
          <div>
            <h1>Clinic &amp; Medical Workspace</h1>
            <p>
              Manage patients, consultations, appointments, clinical activity,
              and clinic operations.
            </p>
          </div>
        </div>

        <div className="cm-actions cmd-actions">
          <button onClick={() => nav("/dashboard/calendar?workspace_id=clinic-medical")}>
            <CalendarDays />
            Today
            <span className="cmd-chevron">⌄</span>
          </button>
          <button
            className={showFilters ? "active-filter" : ""}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter />
            Filters
          </button>
          <button onClick={exportDashboard}>
            <Download />
            Export
          </button>
        </div>
      </div>

      {err && (
        <div className="cm-error">
          {err} <button onClick={load}>Retry</button>
        </div>
      )}

      {showFilters && (
        <div className="cm-filterbar dashboard-filter cmd-filterbar">
          <label>
            Schedule Status
            <select
              value={scheduleStatus}
              onChange={(e) => setScheduleStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              {[
                ...new Set(
                  (d?.todaySchedule || []).map((v) => v.status).filter(Boolean),
                ),
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <label>
            Provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="all">All providers</option>
              {providers.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <button
            onClick={() => {
              setScheduleStatus("all");
              setProvider("all");
            }}
          >
            <X />
            Clear
          </button>
        </div>
      )}

      <section className="cm-ai cmd-ai">
        <div className="cm-ai-icon cmd-ai-icon">
          <Bot />
        </div>

        <div className="cm-ai-copy cmd-ai-copy">
          <small>AI RECEPTIONIST</small>
          <h2>
            Your clinic&apos;s AI agent is {d?.ai?.active ? "active" : "ready"}
            {d?.ai?.active && <b>▶&nbsp; Live</b>}
          </h2>
          <p>
            Answering patient inquiries, qualifying visit reasons, and booking
            appointments.
          </p>
        </div>

        <div className="cmd-ai-stats">
          <div className="cm-ai-stat cmd-ai-stat">
            <div>
              <MessageCircle />
              <strong>{d?.ai?.conversationsToday ?? 0}</strong>
            </div>
            <span>Conversations Today</span>
          </div>

          <div className="cm-ai-stat cmd-ai-stat">
            <div>
              <CalendarDays />
              <strong>{d?.ai?.consultationsBooked ?? 0}</strong>
            </div>
            <span>Consultations Booked</span>
          </div>

          <div className="cm-ai-stat cmd-ai-stat">
            <div>
              <Zap />
              <strong>
                {d?.ai?.avgResponseSeconds
                  ? `${d.ai.avgResponseSeconds}s`
                  : "—"}
              </strong>
            </div>
            <span>Avg Response</span>
          </div>
        </div>

        <div className="cm-ai-buttons cmd-ai-buttons">
          <button
            className="primary"
            onClick={() =>
              nav("/dashboard/whatsapp?workspace_id=clinic-medical")
            }
          >
            View Conversations
          </button>
          <button
            onClick={() =>
              nav("/dashboard/ai-cortexa?workspace_id=clinic-medical")
            }
          >
            Manage AI Agent
          </button>
        </div>
      </section>

      <div className="cm-kpis cmd-kpis">
        {cards.map(([label, value, trend, Icon]) => (
          <div className="cm-kpi cmd-kpi" key={label}>
            <Icon />
            <div className="cmd-kpi-copy">
              <span>{label}</span>
              <div className="cmd-kpi-value">
                <strong>{value ?? 0}</strong>
                <em className={Number(trend) < 0 ? "down" : ""}>
                  <TrendingUp />
                  {Number(trend) > 0 ? "+" : ""}
                  {trend ?? 0}%
                </em>
              </div>
              <small>vs. previous week</small>
            </div>
          </div>
        ))}
      </div>

      <div className="cm-main-grid cmd-main-grid">
        <section className="cm-panel schedule cmd-panel cmd-schedule">
          <header>
            <h3>
              <CalendarDays />
              Today&apos;s Clinical Schedule
            </h3>
            <button
              onClick={() =>
                nav("/dashboard/calendar?workspace_id=clinic-medical")
              }
            >
              View All
            </button>
          </header>

          <div className="cm-table cmd-table">
            <div className="tr th">
              <span>Time</span>
              <span>Patient</span>
              <span>Visit Reason</span>
              <span>Provider</span>
              <span>Status</span>
            </div>

            {loading ? (
              <div className="cm-empty">Loading schedule…</div>
            ) : schedule.length ? (
              schedule.slice(0, 5).map((a) => (
                <div className="tr" key={a.id}>
                  <span>{fmtTime(a.startAt)}</span>
                  <button
                    className="link"
                    onClick={() =>
                      a.patientId &&
                      nav(`/dashboard/clinic-medical/patients/${a.patientId}`)
                    }
                  >
                    {a.patientName || "Patient"}
                  </button>
                  <span>{a.title}</span>
                  <span>{a.providerName || "Unassigned"}</span>
                  <span>
                    <i className={`status ${a.status}`}>{a.status}</i>
                  </span>
                </div>
              ))
            ) : (
              <div className="cm-empty">
                No clinical appointments match the current filters.
              </div>
            )}
          </div>

          <footer>
            <button
              onClick={() =>
                nav("/dashboard/calendar?workspace_id=clinic-medical")
              }
            >
              <CalendarDays />
              View Calendar
            </button>
            <button
              className="primary"
              onClick={() =>
                nav(
                  "/dashboard/calendar?workspace_id=clinic-medical&action=new",
                )
              }
            >
              ⊕&nbsp; Add Appointment
            </button>
          </footer>
        </section>

        <section className="cm-panel pipeline cmd-panel cmd-pipeline">
          <header>
            <h3>
              <Users />
              Patient Pipeline
            </h3>
            <button onClick={() => nav("/dashboard/clinic-medical/patients")}>
              View Pipeline
            </button>
          </header>

          <div className="cm-stages cmd-stages">
            {Object.entries(d?.pipeline || {}).map(([key, value]) => (
              <div key={key}>
                <span>{stageLabel(key)}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <header className="sub">
            <h3>
              <Clock3 />
              Patients Requiring Follow-Up
            </h3>
            <button
              onClick={() =>
                nav("/dashboard/clinic-medical/patients?followUp=yes")
              }
            >
              View All
            </button>
          </header>

          <div className="cm-follow cmd-follow">
            {(d?.followUps || []).length ? (
              d.followUps.slice(0, 4).map((x) => (
                <div key={x.id}>
                  <button
                    className="link"
                    onClick={() =>
                      nav(`/dashboard/clinic-medical/patients/${x.patientId}`)
                    }
                  >
                    {x.patientName}
                  </button>
                  <span>{x.reason}</span>
                  <b>{x.dueLabel}</b>
                  <button
                    onClick={() =>
                      nav(
                        `/dashboard/whatsapp?workspace_id=clinic-medical&contact_id=${x.patientId}`,
                      )
                    }
                  >
                    Send Reminder
                  </button>
                </div>
              ))
            ) : (
              <div className="cm-empty small">No follow-ups due.</div>
            )}
          </div>
        </section>

        <section className="cm-panel reasons cmd-panel cmd-reasons">
          <header>
            <h3>
              <Activity />
              Visit Reasons
            </h3>
            <span>Last 30 Days</span>
          </header>

          {(d?.visitReasons || []).length ? (
            d.visitReasons.map((x, index) => (
              <div className={`reason reason-${index}`} key={x.label}>
                <label>{x.label}</label>
                <i>
                  <b style={{ width: `${x.percent}%` }} />
                </i>
                <strong>{x.percent}%</strong>
              </div>
            ))
          ) : (
            <div className="cm-empty">No visit-reason data yet.</div>
          )}
        </section>
      </div>

      <div className="cm-bottom-grid cmd-bottom-grid">
        <section className="cm-panel cmd-panel cmd-provider">
          <header>
            <h3>
              <Users />
              Provider Activity
            </h3>
            <span>This Week</span>
          </header>

          <div className="provider-head">
            <span>Provider</span>
            <span>Appointments</span>
            <span>Patients Seen</span>
            <span>Attendance</span>
          </div>

          {(d?.providers || []).length ? (
            d.providers.slice(0, 4).map((x) => (
              <div className="provider-row" key={x.id}>
                <b>{x.name}</b>
                <span>{x.appointments}</span>
                <span>{x.patientsSeen}</span>
                <span>{x.attendance}%</span>
              </div>
            ))
          ) : (
            <div className="cm-empty small">No provider activity yet.</div>
          )}
        </section>

        <section className="cm-panel cmd-panel cmd-revenue">
          <header>
            <h3>
              <Activity />
              Revenue Overview
            </h3>
            <span>Last 7 Days</span>
          </header>

          <div className="revenue-total">
            {fmtMoney(d?.revenue?.total)}
            <em>
              {Number(d?.revenue?.trend || 0) >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(Number(d?.revenue?.trend || 0))}%
            </em>
            <small>vs. previous week</small>
          </div>

          {revenueSeries.length ? (
            <div className="cmd-chart">
              <div className="cmd-chart-y">
                <span>${Math.round(revenueMax / 1000)}K</span>
                <span>${Math.round((revenueMax * 0.66) / 1000)}K</span>
                <span>${Math.round((revenueMax * 0.33) / 1000)}K</span>
                <span>$0</span>
              </div>
              <div className="cmd-chart-plot">
                <div className="cmd-chart-grid" />
                <div className="cmd-chart-line">
                  {revenueSeries.map((v, i) => (
                    <i
                      key={i}
                      style={{
                        left: `${
                          revenueSeries.length === 1
                            ? 50
                            : (i / (revenueSeries.length - 1)) * 100
                        }%`,
                        bottom: `${Math.max(
                          3,
                          (Number(v) / revenueMax) * 92,
                        )}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="cmd-chart-days">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    .slice(0, revenueSeries.length)
                    .map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="cm-empty small">No clinic revenue recorded.</div>
          )}
        </section>

        <section className="cm-panel cmd-panel cmd-ai-activity">
          <header>
            <h3>
              <Sparkles />
              AI Agent Activity
            </h3>
            <button
              onClick={() =>
                nav("/dashboard/ai-cortexa?workspace_id=clinic-medical")
              }
            >
              View All
            </button>
          </header>

          <div className="activity-list cmd-activity-list">
            {(d?.aiActivity || []).length ? (
              d.aiActivity.slice(0, 5).map((x) => (
                <div key={x.id}>
                  <time>{fmtTime(x.createdAt)}</time>
                  <span>{x.title}</span>
                </div>
              ))
            ) : (
              <div className="cm-empty small">No AI activity yet.</div>
            )}
          </div>

          <div className="cm-note cmd-note">
            ⓘ&nbsp;&nbsp; Clinical inquiries are directed to your team as
            needed.
          </div>
        </section>
      </div>
    </div>
  );
}
