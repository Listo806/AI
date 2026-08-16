import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import { STATUS_TONE } from "./projectFormat";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function PjwProjectCalendar({ refreshTick, onOpenProject }) {
  const today = useMemo(() => new Date(), []);
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstDay = new Date(cur.y, cur.m, 1);
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    projectsApi
      .listProjects({
        dateFrom: ymd(cur.y, cur.m, 1),
        dateTo: ymd(cur.y, cur.m, daysInMonth),
        limit: 200,
      })
      .then((res) => {
        if (alive) {
          setRows(res?.data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [cur.y, cur.m, daysInMonth, refreshTick]);

  const byDay = useMemo(() => {
    const map = {};
    rows.forEach((p) => {
      if (!p.dueDate) return;
      // Due dates are stored as UTC-midnight timestamps; read the calendar date
      // straight from the ISO date portion so a negative-UTC viewer does not see
      // an off-by-one (or lose a first-of-month item).
      const s = typeof p.dueDate === "string" ? p.dueDate : new Date(p.dueDate).toISOString();
      const m = s.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return;
      const yy = Number(m[1]);
      const mm = Number(m[2]) - 1;
      const dd = Number(m[3]);
      if (yy !== cur.y || mm !== cur.m) return;
      (map[dd] = map[dd] || []).push(p);
    });
    return map;
  }, [rows, cur.y, cur.m]);

  const dueCount = Object.values(byDay).reduce((a, b) => a + b.length, 0);

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const prev = () => setCur((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const next = () => setCur((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));

  const isToday = (d) =>
    d && cur.y === today.getFullYear() && cur.m === today.getMonth() && d === today.getDate();

  return (
    <div className="pjw-cal">
      <div className="pjw-cal-head">
        <button type="button" className="pjw-square" onClick={prev} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <b>
          {MONTHS[cur.m]} {cur.y}
        </b>
        <button type="button" className="pjw-square" onClick={next} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
        <span className="pjw-cell-muted" style={{ marginLeft: "auto" }}>
          {loading ? "Loading…" : `${dueCount} due this month`}
        </span>
      </div>
      <div className="pjw-cal-grid pjw-cal-dow">
        {DOW.map((d) => (
          <div key={d} className="pjw-cal-dow-cell">
            {d}
          </div>
        ))}
      </div>
      <div className="pjw-cal-grid">
        {cells.map((d, idx) => (
          <div key={idx} className={`pjw-cal-cell ${d ? "" : "empty"} ${isToday(d) ? "today" : ""}`}>
            {d ? <span className="pjw-cal-daynum">{d}</span> : null}
            {(byDay[d] || []).map((p) => (
              <button
                key={p.id}
                type="button"
                className="pjw-cal-chip"
                title={`${p.name} · ${p.statusLabel}`}
                style={{ borderLeftColor: STATUS_TONE[p.status] || "#cbd5e1" }}
                onClick={() => onOpenProject?.(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
