import Skeleton from "./Skeleton";

// Generic workspace loading skeleton: a header, a KPI card row, a tab strip and
// a table. Used while a workspace's access check resolves, so every workspace
// gets a consistent, professional loading state instead of a spinner.
export default function WorkspaceSkeleton() {
  const wrap = { padding: "28px 32px", display: "flex", flexDirection: "column", gap: 22, maxWidth: "100%" };
  const cardRow = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 16,
  };
  const card = {
    background: "#fff",
    border: "1px solid #eef2f6",
    borderRadius: 14,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };
  const tabStrip = { display: "flex", gap: 22, borderBottom: "1px solid #eef2f6", paddingBottom: 12 };
  const tableCard = { background: "#fff", border: "1px solid #eef2f6", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 14 };

  return (
    <div style={wrap} aria-busy="true" aria-label="Loading workspace">
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton width={280} height={26} />
          <Skeleton width={340} height={14} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Skeleton width={220} height={40} radius={10} />
          <Skeleton width={120} height={40} radius={10} />
        </div>
      </div>

      {/* KPI cards */}
      <div style={cardRow}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div style={card} key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton width={90} height={12} />
              <Skeleton width={28} height={28} radius={8} />
            </div>
            <Skeleton width={70} height={26} />
            <Skeleton width={110} height={11} />
          </div>
        ))}
      </div>

      {/* tabs */}
      <div style={tabStrip}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={80 + (i % 3) * 18} height={16} />
        ))}
      </div>

      {/* table */}
      <div style={tableCard}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <Skeleton width={180} height={18} />
          <Skeleton width={120} height={34} radius={9} />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Skeleton width={22} height={22} radius={6} />
            <Skeleton width="26%" height={14} />
            <Skeleton width="16%" height={14} />
            <Skeleton width={90} height={22} radius={999} />
            <Skeleton width="14%" height={14} />
            <Skeleton width="10%" height={14} style={{ marginLeft: "auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
