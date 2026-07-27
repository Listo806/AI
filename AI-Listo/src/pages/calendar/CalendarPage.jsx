import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./CalendarPage.css";
import {
  fetchAppointments,
  fetchAppointmentStats,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../../api/calendarApi";

const TYPES = [
  { key: "showing", label: "Showing", color: "#16a34a", bg: "#f0fdf4" },
  { key: "consultation", label: "Consultation", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "call", label: "Call / Follow Up", color: "#d97706", bg: "#fffbeb" },
  { key: "meeting", label: "Meeting", color: "#2563eb", bg: "#eff6ff" },
  { key: "other", label: "Other", color: "#64748b", bg: "#f1f5f9" },
];
const typeInfo = (t) => TYPES.find((x) => x.key === t) || TYPES[4];
const STATUSES = ["pending", "confirmed", "completed", "canceled"];
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
const formatHour = (h) => { const am = h < 12; const hr = h % 12 === 0 ? 12 : h % 12; return `${hr} ${am ? "AM" : "PM"}`; };
const toLocalInput = (d) => {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

export default function CalendarPage() {
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);

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

  const openNew = (preset = {}) => {
    const start = preset.at ? new Date(preset.at) : (() => { const x = new Date(anchor); x.setHours(9, 0, 0, 0); return x; })();
    const end = new Date(start); end.setHours(start.getHours() + 1);
    setEditing(null);
    setError("");
    setForm({
      title: "", type: preset.type || "showing", status: "confirmed",
      startAt: toLocalInput(start), endAt: toLocalInput(end),
      location: "", attendeeName: "", attendeeEmail: "", notes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setError("");
    setForm({
      title: a.title || "", type: a.type || "other", status: a.status || "pending",
      startAt: toLocalInput(a.start), endAt: toLocalInput(a.end),
      location: a.location || "", attendeeName: a.attendeeName || "",
      attendeeEmail: a.attendeeEmail || "", notes: a.notes || "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.startAt || !form.endAt) { setError("Start and end times are required"); return; }
    setSaving(true); setError("");
    const payload = {
      title: form.title.trim(), type: form.type, status: form.status,
      startAt: new Date(form.startAt).toISOString(), endAt: new Date(form.endAt).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: form.location, attendeeName: form.attendeeName,
      attendeeEmail: form.attendeeEmail, notes: form.notes,
    };
    try {
      if (editing) await updateAppointment(editing.id, payload);
      else await createAppointment(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e.message || "Could not save the appointment");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm("Delete this appointment?")) return;
    setSaving(true);
    try { await deleteAppointment(editing.id); setModalOpen(false); await load(); }
    catch (e) { setError(e.message || "Could not delete"); }
    finally { setSaving(false); }
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

  return (
    <div className="cal-page">
      <div className="cal-header">
        <h1>Calendar</h1>
        <p className="cal-sub">Manage your appointments, showings, and meetings in one place.</p>
      </div>

      <div className="cal-toolbar">
        <button className="cal-btn" onClick={() => setAnchor(new Date())}>Today</button>
        <button className="cal-btn" onClick={() => move(-1)}>&#8249;</button>
        <button className="cal-btn" onClick={() => move(1)}>&#8250;</button>
        <div className="cal-range">{rangeLabel}</div>
        <div className="cal-spacer" />
        <div className="cal-views">
          {VIEWS.map((v) => (
            <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button className="cal-btn cal-btn-primary" onClick={() => openNew()}>+ New Appointment</button>
      </div>

      <div className="cal-kpis">
        <div className="cal-kpi"><div className="n">{kpi.total}</div><div className="l">Total Appointments</div></div>
        <div className="cal-kpi"><div className="n" style={{ color: "#16a34a" }}>{kpi.confirmed}</div><div className="l">Confirmed</div></div>
        <div className="cal-kpi"><div className="n" style={{ color: "#d97706" }}>{kpi.pending}</div><div className="l">Pending</div></div>
        <div className="cal-kpi"><div className="n" style={{ color: "#2563eb" }}>{kpi.completed}</div><div className="l">Completed</div></div>
        <div className="cal-kpi"><div className="n" style={{ color: "#dc2626" }}>{kpi.canceled}</div><div className="l">Canceled</div></div>
      </div>

      <div className="cal-body">
        <div>
          {view === "agenda" ? (
            <div className="cal-agenda">
              {agendaGroups.length === 0 && <div className="cal-empty">No appointments in this range.</div>}
              {agendaGroups.map(([key, evs]) => (
                <div key={key} className="cal-agenda-day">
                  <h4>{new Date(key).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</h4>
                  {evs.map((a) => (
                    <div key={a.id} className="cal-agenda-item" style={{ borderLeftColor: typeInfo(a.type).color }} onClick={() => openEdit(a)}>
                      <div className="time">{fmtTime(a.start)} - {fmtTime(a.end)}</div>
                      <div><strong>{a.title}</strong>{a.attendeeName ? ` · ${a.attendeeName}` : ""}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : view === "month" ? (
            <div className="cal-month">
              {WEEKDAYS.map((w) => <div key={w} className="mh">{w}</div>)}
              {monthCells.map((d, i) => {
                const dayEvents = items.filter((a) => sameDay(a.start, d));
                return (
                  <div key={i} className={`cal-month-cell ${d.getMonth() === anchor.getMonth() ? "" : "muted"} ${isToday(d) ? "today" : ""}`}>
                    <div className="dn">{d.getDate()}</div>
                    {dayEvents.slice(0, 3).map((a) => {
                      const info = typeInfo(a.type);
                      return (
                        <div key={a.id} className="cal-chip" style={{ background: info.bg, borderLeftColor: info.color }} onClick={() => openEdit(a)}>
                          {fmtTime(a.start)} {a.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="cal-chip" style={{ background: "#f1f5f9", borderLeftColor: "#94a3b8" }}>+{dayEvents.length - 3} more</div>
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
                      <div key={a.id} className="cal-event" style={eventStyle(a)} onClick={(e) => { e.stopPropagation(); openEdit(a); }}>
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
            {TYPES.map((t) => (
              <span key={t.key}><span className="dot" style={{ background: t.color }} />{t.label}</span>
            ))}
          </div>
        </div>

        <div className="cal-panel">
          <div className="cal-card">
            <h3>{anchor.toLocaleDateString([], { month: "long", year: "numeric" })}</h3>
            <div className="cal-mini">
              {WEEKDAYS.map((w) => <div key={w} className="cell head">{w[0]}</div>)}
              {monthCells.map((d, i) => (
                <div key={i} className={`cell ${d.getMonth() !== anchor.getMonth() ? "muted" : ""} ${isToday(d) ? "today" : ""}`}
                  onClick={() => { setAnchor(new Date(d)); setView("day"); }}>
                  {d.getDate()}
                </div>
              ))}
            </div>
          </div>

          <div className="cal-card">
            <h3>Upcoming ({upcoming.length})</h3>
            <div className="cal-up">
              {upcoming.length === 0 ? (
                <div className="cal-empty">Nothing upcoming.</div>
              ) : (
                upcoming.map((a) => (
                  <div key={a.id} className="cal-up-item" style={{ borderLeftColor: typeInfo(a.type).color }} onClick={() => openEdit(a)}>
                    <div className="t">{a.title}</div>
                    <div>{fmtTime(a.start)} · {a.attendeeName || typeInfo(a.type).label}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cal-card cal-qa">
            <h3>Quick Actions</h3>
            <button onClick={() => openNew({ type: "showing" })}>📅 Schedule Showing</button>
            <button onClick={() => openNew({ type: "consultation" })}>👥 New Buyer Consultation</button>
            <button onClick={() => openNew({ type: "call" })}>📞 Create Follow Up Call</button>
            <button onClick={() => openNew({ type: "meeting" })}>🤝 Add Team Meeting</button>
          </div>
        </div>
      </div>

      {modalOpen && form && (
        <div className="cal-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="cal-modal">
            <h2>{editing ? "Edit Appointment" : "New Appointment"}</h2>
            {error && <div className="cal-err">{error}</div>}
            <div className="cal-field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Property Showing" />
            </div>
            <div className="cal-row2">
              <div className="cal-field">
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div className="cal-field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="cal-row2">
              <div className="cal-field">
                <label>Start</label>
                <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
              </div>
              <div className="cal-field">
                <label>End</label>
                <input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
              </div>
            </div>
            <div className="cal-field">
              <label>Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="123 Ocean Drive" />
            </div>
            <div className="cal-row2">
              <div className="cal-field">
                <label>Attendee name</label>
                <input value={form.attendeeName} onChange={(e) => setForm({ ...form, attendeeName: e.target.value })} />
              </div>
              <div className="cal-field">
                <label>Attendee email</label>
                <input value={form.attendeeEmail} onChange={(e) => setForm({ ...form, attendeeEmail: e.target.value })} />
              </div>
            </div>
            <div className="cal-field">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="cal-modal-actions">
              <div>
                {editing && <button className="cal-btn" style={{ color: "#dc2626" }} onClick={remove} disabled={saving}>Delete</button>}
              </div>
              <div className="right">
                <button className="cal-btn" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
                <button className="cal-btn cal-btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
