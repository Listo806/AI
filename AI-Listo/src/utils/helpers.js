/**
 * Build a CSV from an array of rows (each row an array of cell values) and
 * trigger a browser download. Reused by the Dashboard and Analytics exports.
 */
export function downloadCsv(filename, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const csv = rows
    .map((row) =>
      (Array.isArray(row) ? row : [row])
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "export.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function formatTimeAgo(date) {
  if (!date) return "Just now";

  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);

    if (count > 0) {
      return `${count} ${interval.label}${
        count > 1 ? "s" : ""
      } ago`;
    }
  }

  return "Just now";
}