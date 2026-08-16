import Skeleton from "../../components/Skeleton";

// Skeleton compositions for the Projects workspace, matching each tab's real
// layout so loading never shows bare "Loading…" text.

const arr = (n) => Array.from({ length: n });

export function TableSkeletonRows({ cols, rows = 6 }) {
  return arr(rows).map((_, r) => (
    <tr key={r}>
      {arr(cols).map((__, c) => (
        <td key={c}>
          <Skeleton height={13} width={c === 0 ? "72%" : c === cols - 1 ? "48px" : "55%"} />
        </td>
      ))}
    </tr>
  ));
}

export function CardsSkeleton({ count = 6 }) {
  return (
    <div className="pjw-cards">
      {arr(count).map((_, i) => (
        <div className="pjw-card" key={i} style={{ cursor: "default" }}>
          <div className="pjw-card-top">
            <Skeleton width="60%" height={16} />
            <Skeleton width={64} height={20} radius={999} />
          </div>
          <Skeleton width="40%" height={12} />
          <Skeleton width="100%" height={10} radius={999} />
          <div className="pjw-card-meta">
            <Skeleton width={80} height={12} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelLines({ n = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 2px" }}>
      {arr(n).map((_, j) => (
        <Skeleton key={j} width={`${92 - j * 12}%`} height={12} />
      ))}
    </div>
  );
}

export function PanelsSkeleton() {
  return (
    <section className="pjw-bottom">
      {arr(4).map((_, i) => (
        <article className="pjw-panel" key={i}>
          <div className="pjw-panel-head">
            <Skeleton width={150} height={15} />
          </div>
          <PanelLines n={4} />
        </article>
      ))}
    </section>
  );
}

export function TwoColPanelsSkeleton({ count = 4 }) {
  return (
    <div className="pjw-two-col">
      {arr(count).map((_, i) => (
        <article className="pjw-panel" key={i}>
          <div className="pjw-panel-head">
            <Skeleton width={140} height={15} />
          </div>
          <PanelLines n={4} />
        </article>
      ))}
    </div>
  );
}

export function MetricsSkeleton({ count = 4 }) {
  return (
    <div className="pjw-metrics">
      {arr(count).map((_, i) => (
        <div className="pjw-metric" key={i}>
          <Skeleton width={90} height={12} />
          <Skeleton width={70} height={24} />
        </div>
      ))}
    </div>
  );
}

export function FilesSkeleton({ count = 5 }) {
  return (
    <div className="pjw-tab-panel">
      {arr(count).map((_, i) => (
        <div className="pjw-file-row" key={i}>
          <Skeleton width={38} height={38} radius={10} />
          <div style={{ flex: 1 }}>
            <Skeleton width="38%" height={14} />
            <div style={{ height: 7 }} />
            <Skeleton width={130} height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton({ rows = 8 }) {
  return (
    <div className="pjw-detail-grid">
      {arr(rows).map((_, i) => (
        <div className="pjw-kv" key={i}>
          <Skeleton width={70} height={10} />
          <Skeleton width="72%" height={14} />
        </div>
      ))}
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="pjw-tab-panel">
      <MetricsSkeleton count={4} />
      <TwoColPanelsSkeleton count={4} />
    </div>
  );
}

export function TimeExpensesSkeleton() {
  return (
    <>
      <MetricsSkeleton count={4} />
      <TwoColPanelsSkeleton count={3} />
    </>
  );
}
