import PjwDashboardPanels from "./PjwDashboardPanels";

export default function PjwOverview({ overview }) {
  if (!overview) return <div className="pjw-loading">Loading…</div>;
  return (
    <div className="pjw-tab-panel">
      <PjwDashboardPanels overview={overview} />
    </div>
  );
}
