import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./CalendarPage.css";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAppointments,
  fetchAppointmentStats,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  fetchTeamMembers,
  searchCrm,
  fetchProperties,
  fetchAppointmentActivity,
} from "../../api/calendarApi";

// How each logged action reads in the appointment Activity list.
const ACTION_VERB = {
  created: "created this appointment",
  updated: "updated the appointment",
  rescheduled: "rescheduled the appointment",
  canceled: "canceled the appointment",
};

// Meeting types. Labels match what the client asked for; keys are unchanged so
// existing appointments keep their type.
const TYPES = [
  { key: "showing", label: "Showing", color: "#16a34a", bg: "#f0fdf4" },
  { key: "consultation", label: "Consultation", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "call", label: "Follow-up Call", color: "#d97706", bg: "#fffbeb" },
  { key: "meeting", label: "Team Meeting", color: "#2563eb", bg: "#eff6ff" },
  { key: "other", label: "Other", color: "#64748b", bg: "#f1f5f9" },
];
const typeInfo = (t) => TYPES.find((x) => x.key === t) || TYPES[4];
const STATUSES = ["pending", "confirmed", "completed", "canceled"];
const REMINDERS = [
  { v: 0, l: "No reminder" },
  { v: 15, l: "15 minutes before" },
  { v: 30, l: "30 minutes before" },
  { v: 60, l: "1 hour before" },
  { v: 120, l: "2 hours before" },
  { v: 1440, l: "1 day before" },
];
const VIEWS = ["day", "week", "month", "agenda"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_H = 56;

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d) => { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; };
const startOfMonth = (d) => { const x = startOfDay(d); x.setDate(1); return x; };
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isToday = (d) => sameDay(d, new Date());
const fmtTime = (d) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const fmtDayLabel = (d) => d.toLocaleDateString([], { weekday: "short", day: "numeric" });
const fmtFull = (d) => d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const formatHour = (h) => { const am = h < 12; const hr = h % 12 === 0 ? 12 : h % 12; return `${hr} ${am ? "AM" : "PM"}`; };
const toLocalInput = (d) => {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

// The CRM record an appointment is linked to (lead or contact), for display.
const crmLabelOf = (a, t) => {
  if (a.leadName) return `${a.leadName} (${t("calendar.lead")})`;
  if (a.contactName) return `${a.contactName} (${t("calendar.contact")})`;
  return "";
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const typeLabel = (key) => t(`calendar.type.${typeInfo(key).key}`);
  const weekdayShort = (i) => t(`calendar.weekdayShort.${i}`);

  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [properties, setProperties] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("view"); // 'view' | 'form'
  const [editing, setEditing] = useState(null); // appointment being viewed/edited
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [activity, setActivity] = useState([]);

  // CRM picker state (type-ahead over leads + contacts).
  const [crmQuery, setCrmQuery] = useState("");
  const [crmResults, setCrmResults] = useState([]);
  const [crmOpen, setCrmOpen] = useState(false);
  const crmTimer = useRef(null);

  const range = useMemo(() => {
    if (view === "day") return { from: startOfDay(anchor), to: addDays(startOfDay(anchor), 1) };
    if (view === "month") { const from = startOfWeek(startOfMonth(anchor)); return { from, to: addDays(from, 42) }; }
    if (view === "agenda") { const from = startOfDay(anchor); return { from, to: addDays(from, 30) }; }
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 7) };
  }, [view, anchor]);

  const load = useCallback(async () => {
    try {
      const [appts, s] = await Promise.all([
        fetchAppointments(range.from.toISOString(), range.to.toISOString()),
        fetchAppointmentStats(range.from.toISOString(), range.to.toISOString()),
      ]);
      const list = (Array.isArray(appts) ? appts : appts?.data || []).map((a) => ({
        ...a, start: new Date(a.startAt), end: new Date(a.endAt),
      }));
      setItems(list);
      setStats(s || null);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // Load the "Assigned Agent" options and the property list once.
  useEffect(() => {
    (async () => {
      try {
        const m = await fetchTeamMembers();
        setMembers(Array.isArray(m) ? m : m?.data || []);
      } catch { setMembers([]); }
      try {
        const p = await fetchProperties();
        setProperties(Array.isArray(p) ? p : p?.data || []);
      } catch { setProperties([]); }
    })();
  }, []);

  // Debounced CRM search while the picker is open.
  useEffect(() => {
    if (!crmOpen) return;
    if (crmTimer.current) clearTimeout(crmTimer.current);
    crmTimer.current = setTimeout(async () => {
      try {
        const r = await searchCrm(crmQuery);
        setCrmResults(Array.isArray(r) ? r : r?.data || []);
      } catch { setCrmResults([]); }
    }, 250);
    return () => crmTimer.current && clearTimeout(crmTimer.current);
  }, [crmQuery, crmOpen]);

  const move = (dir) => {
    if (view === "day") setAnchor((d) => addDays(d, dir));
    else if (view === "week") setAnchor((d) => addDays(d, dir * 7));
    else if (view === "month") setAnchor((d) => { const x = new Date(d); x.setMonth(x.getMonth() + dir); return x; });
    else setAnchor((d) => addDays(d, dir * 30));
  };

  const rangeLabel = useMemo(() => {
    if (view === "day") return anchor.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (view === "month") return anchor.toLocaleDateString([], { month: "long", year: "numeric" });
    const s = startOfWeek(anchor); const e = addDays(s, 6);
    return `${s.toLocaleDateString([], { month: "short", day: "numeric" })} - ${e.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
  }, [view, anchor]);

  const blankForm = (preset = {}) => {
    const start = preset.at ? new Date(preset.at) : (() => { const x = new Date(anchor); x.setHours(9, 0, 0, 0); return x; })();
    const end = new Date(start); end.setHours(start.getHours() + 1);
    return {
      title: "", type: preset.type || "showing", status: "confirmed",
      startAt: toLocalInput(start), endAt: toLocalInput(end),
      location: "", attendeeName: "", attendeeEmail: "", notes: "",
      // Default the agent to the current user, per the client's spec.
      assignedTo: user?.id || "",
      leadId: "", contactId: "", propertyId: "",
      reminderMinutesBefore: 60,
    };
  };

  const openNew = (preset = {}) => {
    setEditing(null);
    setError("");
    setForm(blankForm(preset));
    setCrmQuery(""); setCrmResults([]); setCrmOpen(false);
    setMode("form");
    setModalOpen(true);
  };

  // Clicking an appointment opens the read-only detail view first.
  const openView = async (a) => {
    setEditing(a);
    setError("");
    setMode("view");
    setModalOpen(true);
    setActivity([]);
    try {
      const log = await fetchAppointmentActivity(a.id);
      setActivity(Array.isArray(log) ? log : log?.data || []);
    } catch {
      setActivity([]);
    }
  };

  const openEditFromView = () => {
    const a = editing;
    if (!a) return;
    setForm({
      title: a.title || "", type: a.type || "other", status: a.status || "pending",
      startAt: toLocalInput(a.start), endAt: toLocalInput(a.end),
      location: a.location || "", attendeeName: a.attendeeName || "",
      attendeeEmail: a.attendeeEmail || "", notes: a.notes || "",
      assignedTo: a.assignedTo || "",
      leadId: a.leadId || "", contactId: a.contactId || "",
      propertyId: a.propertyId || "",
      reminderMinutesBefore: a.reminderMinutesBefore ?? 60,
    });
    setCrmQuery(crmLabelOf(a, t)); setCrmResults([]); setCrmOpen(false);
    setError("");
    setMode("form");
  };

  const pickCrm = (r) => {
    setForm((f) => ({
      ...f,
      leadId: r.kind === "lead" ? r.id : "",
      contactId: r.kind === "contact" ? r.id : "",
      // Auto-fill the attendee so reminders have someone to reach.
      attendeeName: f.attendeeName || r.name || "",
      attendeeEmail: f.attendeeEmail || r.email || "",
    }));
    setCrmQuery(`${r.name} (${r.kind === "lead" ? t("calendar.lead") : t("calendar.contact")})`);
    setCrmOpen(false);
  };

  const clearCrm = () => {
    setForm((f) => ({ ...f, leadId: "", contactId: "" }));
    setCrmQuery(""); setCrmResults([]);
  };

  const save = async () => {
    if (!form.title.trim()) { setError(t("calendar.errTitleRequired")); return; }
    if (!form.startAt || !form.endAt) { setError(t("calendar.errTimesRequired")); return; }
    if (new Date(form.endAt) <= new Date(form.startAt)) { setError(t("calendar.errEndAfterStart")); return; }
    setSaving(true); setError("");
    const payload = {
      title: form.title.trim(), type: form.type, status: form.status,
      startAt: new Date(form.startAt).toISOString(), endAt: new Date(form.endAt).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: form.location, attendeeName: form.attendeeName,
      attendeeEmail: form.attendeeEmail, notes: form.notes,
      assignedTo: form.assignedTo || null,
      leadId: form.leadId || null,
      contactId: form.contactId || null,
      propertyId: form.propertyId || null,
      reminderMinutesBefore: Number(form.reminderMinutesBefore) || 0,
    };
    try {
      if (editing) await updateAppointment(editing.id, payload);
      else await createAppointment(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e.message || t("calendar.errSave"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm(t("calendar.confirmDelete"))) return;
    setSaving(true);
    try { await deleteAppointment(editing.id); setModalOpen(false); await load(); }
    catch (e) { setError(e.message || t("calendar.errDelete")); }
    finally { setSaving(false); }
  };

  // One-click open of the linked CRM record.
  const openLinkedRecord = () => {
    if (!editing) return;
    if (editing.leadId) navigate(`/dashboard/leads/${editing.leadId}`);
    else if (editing.contactId) navigate(`/dashboard/contacts`);
  };

  const upcoming = useMemo(() => {
    const now = new Date();
    return items.filter((a) => a.end >= now).sort((a, b) => a.start - b.start).slice(0, 5);
  }, [items]);

  const kpi = stats || { total: 0, confirmed: 0, pending: 0, completed: 0, canceled: 0 };
  const gridDays = view === "day" ? [startOfDay(anchor)] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i));
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const monthCells = Array.from({ length: 42 }, (_, i) => addDays(startOfWeek(startOfMonth(anchor)), i));

  const eventStyle = (a) => {
    const startMin = a.start.getHours() * 60 + a.start.getMinutes();
    const endMin = a.end.getHours() * 60 + a.end.getMinutes();
    const top = Math.max(0, ((startMin - START_HOUR * 60) / 60) * HOUR_H);
    const height = Math.max(22, ((endMin - startMin) / 60) * HOUR_H);
    const info = typeInfo(a.type);
    return { top, height, background: info.bg, borderLeftColor: info.color };
  };

  const agendaGroups = useMemo(() => {
    const map = {};
    items.slice().sort((a, b) => a.start - b.start).forEach((a) => {
      const key = startOfDay(a.start).toDateString();
      (map[key] = map[key] || []).push(a);
    });
    return Object.entries(map);
  }, [items]);

  // Always let the current user assign to themselves, even if the team-members
  // list does not include them (e.g. an owner tracked outside team_members).
  const agentOptions = useMemo(() => {
    const list = [...members];
    if (user?.id && !list.some((m) => m.id === user.id)) {
      list.unshift({ id: user.id, name: user.name || user.email || t("calendar.me") });
    }
    return list;
  }, [members, user]);

  const memberName = (id) => {
    const m = agentOptions.find((x) => x.id === id);
    return m ? m.name : null;
  };

  return (
    <div className="cal-page">
      <div className="cal-header">
        <h1>{t("calendar.title")}</h1>
        <p className="cal-sub">{t("calendar.subtitle")}</p>
      </div>

      <div className="cal-toolbar">
        <button className="cal-btn" onClick={() => setAnchor(new Date())}>{t("calendar.today")}</button>
        <button className="cal-btn" onClick={() => move(-1)}>&#8249;</button>
        <button className="cal-btn" onClick={() => move(1)}>&#8250;</button>
        <div className="cal-range">{rangeLabel}</div>
        <div className="cal-spacer" />
        <div className="cal-views">
          {VIEWS.map((v) => (
            <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
              {t(`calendar.view.${v}`)}
            </button>
          ))}
        </div>
        <button className="cal-btn cal-btn-primary" onClick={() => openNew()}>+ {t("calendar.newAppointment")}</button>
      </div>

      <div className="cal-kpis">
        <div className="cal-kpi"><div className="n">{kpi.total}</div><div className="l">{t("calendar.kpiTotal")}</div></div>
        <div className="cal-kpi"><div className="n" style={{ color: "#16a34a" }}>{kpi.confirmed}</div><div className="l">{t("calendar.status.confirmed")}</div></div>
        <div className="cal-kpi"><div className="n" style={{ color: "#d97706" }}>{kpi.pending}</div><div className="l">{t("calendar.status.pending")}</div></div>
        <div className="cal-kpi"><div className="n" style={{ color: "#2563eb" }}>{kpi.completed}</div><div className="l">{t("calendar.status.completed")}</div></div>
        <div className="cal-kpi"><div className="n" style={{ color: "#dc2626" }}>{kpi.canceled}</div><div className="l">{t("calendar.status.canceled")}</div></div>
      </div>

      <div className="cal-body">
        <div>
          {view === "agenda" ? (
            <div className="cal-agenda">
              {agendaGroups.length === 0 && <div className="cal-empty">{t("calendar.emptyRange")}</div>}
              {agendaGroups.map(([key, evs]) => (
                <div key={key} className="cal-agenda-day">
                  <h4>{new Date(key).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</h4>
                  {evs.map((a) => (
                    <div key={a.id} className="cal-agenda-item" style={{ borderLeftColor: typeInfo(a.type).color }} onClick={() => openView(a)}>
                      <div className="time">{fmtTime(a.start)} - {fmtTime(a.end)}</div>
                      <div><strong>{a.title}</strong>{a.attendeeName ? ` · ${a.attendeeName}` : ""}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : view === "month" ? (
            <div className="cal-month">
              {WEEKDAYS.map((w, i) => <div key={w} className="mh">{weekdayShort(i)}</div>)}
              {monthCells.map((d, i) => {
                const dayEvents = items.filter((a) => sameDay(a.start, d));
                return (
                  <div key={i} className={`cal-month-cell ${d.getMonth() === anchor.getMonth() ? "" : "muted"} ${isToday(d) ? "today" : ""}`}>
                    <div className="dn">{d.getDate()}</div>
                    {dayEvents.slice(0, 3).map((a) => {
                      const info = typeInfo(a.type);
                      return (
                        <div key={a.id} className="cal-chip" style={{ background: info.bg, borderLeftColor: info.color }} onClick={() => openView(a)}>
                          {fmtTime(a.start)} {a.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="cal-chip" style={{ background: "#f1f5f9", borderLeftColor: "#94a3b8" }}>{t("calendar.moreCount", { count: dayEvents.length - 3 })}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cal-grid-wrap">
              <div className={`cal-grid ${view === "day" ? "day" : ""}`}>
                <div className="cal-corner" />
                {gridDays.map((d, i) => (
                  <div key={i} className={`cal-daycol-head ${isToday(d) ? "today" : ""}`}>{fmtDayLabel(d)}</div>
                ))}
                <div>
                  {hours.map((h) => <div key={h} className="cal-hourlabel">{formatHour(h)}</div>)}
                </div>
                {gridDays.map((d, i) => (
                  <div key={i} className="cal-daycol">
                    {hours.map((h) => (
                      <div key={h} className="cal-hourcell" onClick={() => { const at = new Date(d); at.setHours(h, 0, 0, 0); openNew({ at }); }} />
                    ))}
                    {items.filter((a) => sameDay(a.start, d)).map((a) => (
                      <div key={a.id} className="cal-event" style={eventStyle(a)} onClick={(e) => { e.stopPropagation(); openView(a); }}>
                        <div className="t">{fmtTime(a.start)} {a.title}</div>
                        {a.attendeeName && <div className="m">{a.attendeeName}</div>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cal-legend">
            {TYPES.map((ty) => (
              <span key={ty.key}><span className="dot" style={{ background: ty.color }} />{typeLabel(ty.key)}</span>
            ))}
          </div>
        </div>

        <div className="cal-panel">
          <div className="cal-card">
            <h3>{anchor.toLocaleDateString([], { month: "long", year: "numeric" })}</h3>
            <div className="cal-mini">
              {WEEKDAYS.map((w, i) => <div key={w} className="cell head">{weekdayShort(i)[0]}</div>)}
              {monthCells.map((d, i) => (
                <div key={i} className={`cell ${d.getMonth() !== anchor.getMonth() ? "muted" : ""} ${isToday(d) ? "today" : ""}`}
                  onClick={() => { setAnchor(new Date(d)); setView("day"); }}>
                  {d.getDate()}
                </div>
              ))}
            </div>
          </div>

          <div className="cal-card">
            <h3>{t("calendar.upcoming", { count: upcoming.length })}</h3>
            <div className="cal-up">
              {upcoming.length === 0 ? (
                <div className="cal-empty">{t("calendar.nothingUpcoming")}</div>
              ) : (
                upcoming.map((a) => (
                  <div key={a.id} className="cal-up-item" style={{ borderLeftColor: typeInfo(a.type).color }} onClick={() => openView(a)}>
                    <div className="t">{a.title}</div>
                    <div>{fmtTime(a.start)} · {a.attendeeName || typeLabel(a.type)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cal-card cal-qa">
            <h3>{t("calendar.quickActions")}</h3>
            <button onClick={() => openNew({ type: "showing" })}>📅 {t("calendar.qaShowing")}</button>
            <button onClick={() => openNew({ type: "consultation" })}>👥 {t("calendar.qaConsultation")}</button>
            <button onClick={() => openNew({ type: "call" })}>📞 {t("calendar.qaCall")}</button>
            <button onClick={() => openNew({ type: "meeting" })}>🤝 {t("calendar.qaMeeting")}</button>
          </div>
        </div>
      </div>

      {modalOpen && mode === "view" && editing && (
        <div className="cal-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="cal-modal">
            <div className="cal-detail-head">
              <span className="cal-type-pill" style={{ background: typeInfo(editing.type).bg, color: typeInfo(editing.type).color }}>
                {typeLabel(editing.type)}
              </span>
              <span className={`cal-status-pill s-${editing.status}`}>{t(`calendar.status.${editing.status}`)}</span>
            </div>
            <h2>{editing.title}</h2>
            {error && <div className="cal-err">{error}</div>}

            <div className="cal-detail-rows">
              <div className="cal-detail-row"><span>{t("calendar.field.when")}</span><div>{fmtFull(editing.start)} – {fmtTime(editing.end)}</div></div>
              {editing.location && <div className="cal-detail-row"><span>{t("calendar.field.location")}</span><div>{editing.location}</div></div>}
              <div className="cal-detail-row"><span>{t("calendar.field.agent")}</span><div>{editing.assignedToName || memberName(editing.assignedTo) || t("calendar.unassigned")}</div></div>
              {(editing.leadName || editing.contactName) && (
                <div className="cal-detail-row">
                  <span>{editing.leadName ? t("calendar.lead") : t("calendar.contact")}</span>
                  <div>
                    <button className="cal-link-btn" onClick={openLinkedRecord}>
                      {editing.leadName || editing.contactName} ↗
                    </button>
                  </div>
                </div>
              )}
              {(editing.attendeeName || editing.attendeeEmail) && (
                <div className="cal-detail-row"><span>{t("calendar.field.attendee")}</span><div>{editing.attendeeName}{editing.attendeeEmail ? ` · ${editing.attendeeEmail}` : ""}</div></div>
              )}
              {editing.propertyTitle && <div className="cal-detail-row"><span>{t("calendar.field.property")}</span><div>{editing.propertyTitle}</div></div>}
              <div className="cal-detail-row"><span>{t("calendar.field.reminder")}</span><div>{t(`calendar.reminder.${(REMINDERS.find((r) => r.v === editing.reminderMinutesBefore) || { v: 0 }).v}`)}{editing.reminderSentAt ? t("calendar.reminderSentSuffix") : ""}</div></div>
              {editing.notes && <div className="cal-detail-row"><span>{t("calendar.field.notes")}</span><div style={{ whiteSpace: "pre-wrap" }}>{editing.notes}</div></div>}
            </div>

            <div className="cal-activity">
              <h4>{t("calendar.activity")}</h4>
              {activity.length === 0 ? (
                <div className="cal-empty">{t("calendar.noActivity")}</div>
              ) : (
                <div className="cal-activity-list">
                  {activity.map((ev) => (
                    <div key={ev.id} className="cal-activity-item">
                      <span className="dot" />
                      <div>
                        <div className="a"><strong>{ev.actorName}</strong> {ACTION_VERB[ev.action] ? t(`calendar.actionVerb.${ev.action}`) : ev.action}{ev.detail ? ` · ${ev.detail}` : ""}</div>
                        <div className="ts">{new Date(ev.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cal-modal-actions">
              <div>
                <button className="cal-btn" style={{ color: "#dc2626" }} onClick={remove} disabled={saving}>{t("calendar.delete")}</button>
              </div>
              <div className="right">
                {(editing.leadId || editing.contactId) && (
                  <button className="cal-btn" onClick={openLinkedRecord}>{t("calendar.openContact")}</button>
                )}
                <button className="cal-btn" onClick={() => setModalOpen(false)}>{t("calendar.close")}</button>
                <button className="cal-btn cal-btn-primary" onClick={openEditFromView}>{t("calendar.edit")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && mode === "form" && form && (
        <div className="cal-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="cal-modal">
            <h2>{editing ? t("calendar.editAppointment") : t("calendar.newAppointment")}</h2>
            {error && <div className="cal-err">{error}</div>}
            <div className="cal-field">
              <label>{t("calendar.field.title")}</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("calendar.placeholderTitle")} />
            </div>
            <div className="cal-row2">
              <div className="cal-field">
                <label>{t("calendar.field.meetingType")}</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((ty) => <option key={ty.key} value={ty.key}>{typeLabel(ty.key)}</option>)}
                </select>
              </div>
              <div className="cal-field">
                <label>{t("calendar.field.status")}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t(`calendar.status.${s}`)}</option>)}
                </select>
              </div>
            </div>
            <div className="cal-row2">
              <div className="cal-field">
                <label>{t("calendar.field.start")}</label>
                <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
              </div>
              <div className="cal-field">
                <label>{t("calendar.field.end")}</label>
                <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
              </div>
            </div>

            <div className="cal-row2">
              <div className="cal-field">
                <label>{t("calendar.field.assignedAgent")}</label>
                <select value={form.assignedTo || ""} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">{t("calendar.unassigned")}</option>
                  {agentOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.id === user?.id ? ` (${t("calendar.me")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cal-field">
                <label>{t("calendar.field.reminder")}</label>
                <select value={form.reminderMinutesBefore} onChange={(e) => setForm({ ...form, reminderMinutesBefore: Number(e.target.value) })}>
                  {REMINDERS.map((r) => <option key={r.v} value={r.v}>{t(`calendar.reminder.${r.v}`)}</option>)}
                </select>
              </div>
            </div>

            <div className="cal-field cal-crm">
              <label>{t("calendar.field.contactLead")}</label>
              <div className="cal-crm-input">
                <input
                  value={crmQuery}
                  placeholder={t("calendar.placeholderCrm")}
                  onChange={(e) => { setCrmQuery(e.target.value); setCrmOpen(true); if (form.leadId || form.contactId) setForm((f) => ({ ...f, leadId: "", contactId: "" })); }}
                  onFocus={() => setCrmOpen(true)}
                  onBlur={() => setTimeout(() => setCrmOpen(false), 150)}
                />
                {(form.leadId || form.contactId) && (
                  <button type="button" className="cal-crm-clear" onClick={clearCrm} title={t("calendar.unlink")}>×</button>
                )}
                {crmOpen && crmResults.length > 0 && (
                  <div className="cal-crm-results">
                    {crmResults.map((r) => (
                      <div key={`${r.kind}-${r.id}`} className="cal-crm-item" onClick={() => pickCrm(r)}>
                        <strong>{r.name}</strong>
                        <span className="k">{r.kind === "lead" ? t("calendar.lead") : t("calendar.contact")}</span>
                        {r.email && <span className="e">{r.email}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="cal-field">
              <label>{t("calendar.field.propertyOptional")}</label>
              <select value={form.propertyId || ""} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
                <option value="">{t("calendar.noProperty")}</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title || p.address || t("calendar.untitledProperty")}</option>
                ))}
              </select>
            </div>

            <div className="cal-field">
              <label>{t("calendar.field.location")}</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t("calendar.placeholderLocation")} />
            </div>
            <div className="cal-row2">
              <div className="cal-field">
                <label>{t("calendar.field.attendeeName")}</label>
                <input value={form.attendeeName} onChange={(e) => setForm({ ...form, attendeeName: e.target.value })} />
              </div>
              <div className="cal-field">
                <label>{t("calendar.field.attendeeEmail")}</label>
                <input value={form.attendeeEmail} onChange={(e) => setForm({ ...form, attendeeEmail: e.target.value })} />
              </div>
            </div>
            <div className="cal-field">
              <label>{t("calendar.field.notes")}</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="cal-modal-actions">
              <div>
                {editing && <button className="cal-btn" style={{ color: "#dc2626" }} onClick={remove} disabled={saving}>{t("calendar.delete")}</button>}
              </div>
              <div className="right">
                <button className="cal-btn" onClick={() => (editing ? setMode("view") : setModalOpen(false))} disabled={saving}>{t("calendar.cancel")}</button>
                <button className="cal-btn cal-btn-primary" onClick={save} disabled={saving}>
                  {saving ? t("calendar.saving") : editing ? t("calendar.save") : t("calendar.create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
