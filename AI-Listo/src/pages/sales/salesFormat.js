// Shared display helpers for the Sales Workspace sections/modals.

export function money(value) {
  if (value == null) return "-";
  const n = Number(value);
  if (!isFinite(n)) return "-";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

// <input type="date"> needs YYYY-MM-DD in local time (toISOString shifts to UTC).
export function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysLeftNote(validUntil) {
  if (!validUntil) return { text: "", danger: false };
  const d = new Date(validUntil);
  if (isNaN(d.getTime())) return { text: "", danger: false };
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return { text: "expired", danger: true };
  if (diff === 0) return { text: "0 days left", danger: true };
  return { text: `${diff} day${diff === 1 ? "" : "s"} left`, danger: false };
}

export function initials(name) {
  return String(name || "")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
