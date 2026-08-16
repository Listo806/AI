import PjwDashboardPanels from "./PjwDashboardPanels";
import { PanelsSkeleton } from "./PjwSkeleton";

export default function PjwOverview({ overview }) {
  if (!overview) {
    return (
      <div className="pjw-tab-panel">
        <PanelsSkeleton />
      </div>
    );
  }
  return (
    <div className="pjw-tab-panel">
      <PjwDashboardPanels overview={overview} />
    </div>
  );
}
