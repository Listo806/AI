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