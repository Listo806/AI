// Shared formatting + display helpers for the Projects / Client Delivery workspace.

export function money(n, currency = "USD") {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `$${Math.round(v).toLocaleString()}`;
  }
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtRelative(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
}

export function fmtRemaining(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "due today";
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

export function minutesToText(min) {
  const m = Number(min) || 0;
  if (m <= 0) return "0h";
  const hours = m / 60;
  if (hours >= 1) return `${Math.round(hours * 10) / 10}h`;
  return `${m}m`;
}

export function initials(name) {
  if (!name) return "?";
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function statusClass(status) {
  return `status-${String(status || "").replace(/_/g, "-")}`;
}

export function priorityClass(priority) {
  return `priority-${String(priority || "medium").toLowerCase()}`;
}

export function cap(s) {
  if (!s) return "";
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

export function pct(n) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  return `${Math.round(Number(n) * 10) / 10}%`;
}

// Palette used for donut / legend segments, keyed to canonical project status.
export const STATUS_TONE = {
  planning: "#8b5cf6",
  in_progress: "#3b82f6",
  in_review: "#f59e0b",
  on_hold: "#f97316",
  completed: "#22c55e",
  cancelled: "#94a3b8",
};
