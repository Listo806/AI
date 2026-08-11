import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Pencil,
  MessageSquare,
  FileText,
  UserRound,
  Activity,
} from "lucide-react";

export default function TeamActivityCard({ activity = [] }) {
  const navigate = useNavigate();

  const getIcon = (item, index) => {
    const type = String(item?.type || item?.eventType || "").toLowerCase();

    if (
      type.includes("complete") ||
      type.includes("closed") ||
      type.includes("success")
    ) {
      return CheckCircle2;
    }

    if (
      type.includes("update") ||
      type.includes("edit") ||
      type.includes("change")
    ) {
      return Pencil;
    }

    if (
      type.includes("comment") ||
      type.includes("message") ||
      type.includes("respond")
    ) {
      return MessageSquare;
    }

    if (
      type.includes("file") ||
      type.includes("document") ||
      type.includes("upload")
    ) {
      return FileText;
    }

    if (
      type.includes("member") ||
      type.includes("user") ||
      type.includes("invite")
    ) {
      return UserRound;
    }

    const icons = [
      Activity,
      CheckCircle2,
      Pencil,
      MessageSquare,
      FileText,
      UserRound,
    ];

    return icons[index % icons.length];
  };

  const rows = Array.isArray(activity) ? activity.slice(0, 5) : [];

  return (
    <div className="tw-mini-card tw-recent-activity">
      <div className="tw-mini-head">
        <strong>Recent Activity</strong>
        <span>All Activity⌄</span>
      </div>

      <div className="tw-activity-rows">
        {rows.length > 0 ? (
          rows.map((item, index) => {
            const Icon = getIcon(item, index);

            const title =
              item?.message ||
              item?.title ||
              item?.action ||
              item?.type ||
              "Team activity";

            const description =
              item?.sub ||
              item?.description ||
              item?.details ||
              item?.email ||
              "";

            const time =
              item?.time ||
              item?.timeAgo ||
              item?.relativeTime ||
              item?.createdAt ||
              item?.created_at ||
              "";

            return (
              <div
                className="tw-activity-row"
                key={item?.id || item?._id || `${title}-${index}`}
              >
                <span className="tw-activity-icon">
                  <Icon size={13} />
                </span>

                <div className="tw-activity-copy">
                  <b>{title}</b>
                  {description ? <span>{description}</span> : null}
                </div>

                <time>{time}</time>
              </div>
            );
          })
        ) : (
          <div className="tw-activity-empty">
            No recent activity
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          navigate("/dashboard/team/activity?type=team")
        }
      >
        View all activity →
      </button>
    </div>
  );
}