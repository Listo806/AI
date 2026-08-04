import {
  Activity,
  MessageSquare,
  Phone,
  UserPlus,
  CheckCircle2,
  Bot,
  ArrowUpRight,
  UserMinus,
  Home,
  Edit3,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchTeamActivities } from "./services/team.service";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./activity.css";

import useTeamDashboard from "./hooks/useTeamDashboard";

const formatActivityLabel = (value) => {
  if (!value) return "Activity";

  return String(value)
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
const getActivityIcon = (activity) => {
  const text =
    `${activity?.eventType || ""} ${activity?.message || ""}`.toLowerCase();

  if (text.includes("member_added") || text.includes("invited"))
    return UserPlus;
  if (text.includes("member_removed") || text.includes("removed"))
    return UserMinus;
  if (text.includes("deal") || text.includes("closed")) return CheckCircle2;
  if (text.includes("message") || text.includes("responded"))
    return MessageSquare;
  if (text.includes("call")) return Phone;
  if (text.includes("property")) return Home;
  if (text.includes("lead") || text.includes("updated")) return Edit3;
  if (text.includes("ai")) return Bot;

  return Activity;
};

export default function TeamActivityPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalActivities: 0,
    messages: 0,
    calls: 0,
    aiActions: 0,
  });

  const { selectedTeamId } = useTeamDashboard();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("createdAt:desc");

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    if (!selectedTeamId) return;

    async function loadActivities() {
      try {
        setLoading(true);

        const res = await fetchTeamActivities(selectedTeamId, {
          page,
          limit,
          search,
          type,
          userId,
          dateFrom,
          dateTo,
          sort,
        });

        setStats(
          res?.stats || {
            totalActivities: 0,
            messages: 0,
            calls: 0,
            aiActions: 0,
          },
        );

        setActivities(res?.data || []);
        setPagination(
          res?.pagination || {
            total: 0,
            page: 1,
            limit,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        );
      } catch (error) {
        console.error("LOAD TEAM ACTIVITIES ERROR", error);
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [
    selectedTeamId,
    page,
    limit,
    search,
    type,
    userId,
    dateFrom,
    dateTo,
    sort,
  ]);

  useEffect(() => {
    const queryType = searchParams.get("type") || "all";

    const allowedTypes = ["all", "team", "lead", "property", "user", "ai"];

    const nextType = allowedTypes.includes(queryType) ? queryType : "all";

    setType(nextType);
    setPage(1);
  }, [searchParams]);

  const exportActivitiesCsv = () => {
    const headers = [
      t("team.csvUserName"),
      t("team.csvUserEmail"),
      t("team.eventType"),
      t("team.entityType"),
      t("team.activity"),
      t("team.time"),
      t("team.csvCreatedAt"),
    ];

    const rows = activities.map((activity) => [
      activity.userName || t("team.unknownUser"),
      activity.userEmail || "",
      formatActivityLabel(activity.eventType),
      formatActivityLabel(activity.entityType),
      activity.message || "",
      activity.time || "",
      activity.createdAt ? new Date(activity.createdAt).toLocaleString() : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "team-activities.csv";
    link.click();

    URL.revokeObjectURL(url);
  };
  return (
    <div className="team-activity-page">
      <div className="team-performance-header heading_page">
        <Activity />
        <h1 className="team-page-title">{t("team.activityTitle")}</h1>
      </div>
      <div className="team-members-filters">
        <div className="team-search-box">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("team.searchPlaceholder")}
          />
        </div>
        <div className="team-search-box">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);

              setPage(1);
            }}
          />
        </div>
        <div className="team-search-box">
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);

              setPage(1);
            }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);

            setPage(1);
          }}
          className="team-filter-select"
        >
          <option value="createdAt:desc">{t("team.sortNewest")}</option>
          <option value="createdAt:asc">{t("team.sortOldest")}</option>
          <option value="user:asc">{t("team.sortUserAsc")}</option>
          <option value="user:desc">{t("team.sortUserDesc")}</option>
          <option value="type:asc">{t("team.sortType")}</option>
        </select>
        <select
          value={type}
          onChange={(event) => {
            const nextType = event.target.value;
            setType(nextType);
            setPage(1);
            setSearchParams((currentParams) => {
              const nextParams = new URLSearchParams(currentParams);
              if (nextType === "all") {
                nextParams.delete("type");
              } else {
                nextParams.set("type", nextType);
              }
              return nextParams;
            });
          }}
          className="team-filter-select"
        >
          <option value="all">{t("team.filterAllActivities")}</option>
          <option value="team">{t("team.title")}</option>
          <option value="lead">{t("team.filterLeads")}</option>
          <option value="property">{t("team.filterProperties")}</option>
          <option value="user">{t("team.filterUsers")}</option>
          <option value="ai">AI</option>
        </select>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="team-filter-select"
        >
          <option value={10}>{t("team.perPage", { count: 10 })}</option>
          <option value={20}>{t("team.perPage", { count: 20 })}</option>
          <option value={50}>{t("team.perPage", { count: 50 })}</option>
          <option value={100}>{t("team.perPage", { count: 100 })}</option>
        </select>
        <button className="team-primary-btn" onClick={exportActivitiesCsv}>
          <Download size={16} />
          {t("team.exportCsv")}
        </button>
      </div>

      <div className="team-activity-stats">
        <div className="team-activity-stat-card">
          <span>{t("team.statTotalActivities")}</span>
          <h2>{stats.totalActivities}</h2>
          <p>{t("team.statTotalActivitiesSub")}</p>
        </div>

        <div className="team-activity-stat-card">
          <span>{t("team.statMessagesSent")}</span>
          <h2>{stats.messages}</h2>
          <p>{t("team.statTrackedFromEvents")}</p>
        </div>

        <div className="team-activity-stat-card">
          <span>{t("team.statCallsScheduled")}</span>
          <h2>{stats.calls}</h2>
          <p>{t("team.statTrackedFromEvents")}</p>
        </div>

        <div className="team-activity-stat-card">
          <span>{t("team.statAiActions")}</span>
          <h2>{stats.aiActions}</h2>
          <p>{t("team.statAutomationActivity")}</p>
        </div>
      </div>

      <div className="team-card">
        <div className="team-card-header">
          <div>
            <h3 className="team-card-title">{t("team.recentTeamActivities")}</h3>
            <p className="team-card-description">
              {t("team.recentTeamActivitiesSub")}
            </p>
          </div>
        </div>

        <div className="team-activity-table">
          <div className="team-activity-table-head">
            <div>{t("team.user")}</div>
            <div>{t("team.activity")}</div>
            <div>{t("team.time")}</div>
          </div>

          <div className="team-activity-table-body">
            {loading ? (
              <div className="team-activity-row">
                <div>{t("team.loadingActivities")}</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="team-activity-row">
                <div>{t("team.noActivitiesFound")}</div>
              </div>
            ) : (
              activities.map((activity, index) => {
                const Icon = getActivityIcon(activity);

                return (
                  <div
                    key={activity.id || index}
                    className="team-activity-row"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="team-activity-user">
                      <div className="team-activity-avatar">
                        <Icon size={18} />
                      </div>

                      <div>
                        <div className="team-activity-user-name">
                          {activity.userName ||
                            activity.userEmail ||
                            t("team.unknownUser")}
                        </div>

                        <div className="team-activity-user-role">
                          {formatActivityLabel(
                            activity.entityType || activity.eventType,
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="team-activity-action">
                      {activity.message || t("team.teamActivityUpdated")}
                    </div>

                    <div className="team-activity-time">
                      <span>{activity.time}</span>

                      <div className="team-activity-arrow">
                        <ArrowUpRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="team-pagination">
          <button disabled={!pagination.hasPrevPage} onClick={() => setPage(1)}>
            «
          </button>

          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            ‹
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                className={Number(page) === Number(p) ? "active" : ""}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ),
          )}

          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            ›
          </button>

          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage(pagination.totalPages)}
          >
            »
          </button>
        </div>
      )}

      <div className="team-table-info">
        {t("team.showing")} <b>{activities.length}</b> {t("team.of")}{" "}
        <b>{pagination.total}</b> {t("team.activitiesCount")}
      </div>
      {selectedActivity && (
        <>
          <div
            className="team-drawer-backdrop"
            onClick={() => setSelectedActivity(null)}
          />

          <aside className="team-activity-drawer">
            <div className="team-drawer-header">
              <div>
                <h2>{t("team.activityDetail")}</h2>

                <p>{selectedActivity.time}</p>
              </div>

              <button onClick={() => setSelectedActivity(null)}>✕</button>
            </div>

            <div className="team-drawer-section">
              <label>{t("team.user")}</label>

              <div>
                {selectedActivity.userName ||
                  selectedActivity.userEmail ||
                  t("team.unknown")}
              </div>
            </div>

            <div className="team-drawer-section">
              <label>{t("team.eventType")}</label>

              <div>{formatActivityLabel(selectedActivity.eventType)}</div>
            </div>

            <div className="team-drawer-section">
              <label>{t("team.entity")}</label>

              <div>{formatActivityLabel(selectedActivity.entityType)}</div>
            </div>

            <div className="team-drawer-section">
              <label>{t("team.activity")}</label>

              <div>{selectedActivity.message}</div>
            </div>

            <div className="team-drawer-section">
              <label>{t("team.createdLabel")}</label>

              <div>{new Date(selectedActivity.createdAt).toLocaleString()}</div>
            </div>

            <div className="team-drawer-section">
              <div className="team-timeline">
                <h3>{t("team.timeline")}</h3>

                <div className="timeline-item">
                  <div className="timeline-dot" />

                  <div>
                    <strong>{t("team.event")}</strong>

                    <p>{formatActivityLabel(selectedActivity.eventType)}</p>
                  </div>
                </div>

                {selectedActivity.oldValue && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>{t("team.oldValue")}</strong>

                      <pre>
                        {JSON.stringify(selectedActivity.oldValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedActivity.newValue && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>{t("team.newValue")}</strong>

                      <pre>
                        {JSON.stringify(selectedActivity.newValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedActivity.entityId && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>{t("team.entity")}</strong>

                      <p>{selectedActivity.entityId}</p>
                    </div>
                  </div>
                )}

                {selectedActivity.browser && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>{t("team.browser")}</strong>

                      <p>{selectedActivity.browser}</p>
                    </div>
                  </div>
                )}

                {selectedActivity.device && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>{t("team.device")}</strong>

                      <p>{selectedActivity.device}</p>
                    </div>
                  </div>
                )}

                {selectedActivity.ip && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>{t("team.ipAddress")}</strong>

                      <p>{selectedActivity.ip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
