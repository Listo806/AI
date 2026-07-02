import { X } from "lucide-react";

export default function PipelineListModal({
  open,
  title,
  subtitle,
  items = [],
  hasMore = false,
  loading = false,
  emptyText = "No data available.",
  onClose,
  onLoadMore,
  renderItem,
}) {
  if (!open) return null;

  return (
    <div className="pipeline-modal-overlay">
      <div className="pipeline-modal command-output-modal">
        <div className="pipeline-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="pipeline-modal-subtitle">{subtitle}</p>}
          </div>

          <button type="button" className="pipeline-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pipeline-modal-body activity-modal-body">
          {items.length ? (
            items.map((item, index) => renderItem(item, index))
          ) : (
            <div className="activity-modal-empty">{emptyText}</div>
          )}

          {hasMore && (
            <button
              className="pipeline-load-more-btn"
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}