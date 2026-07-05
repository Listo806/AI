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
import "./activity.css";

import useTeamDashboard from "./hooks/useTeamDashboard";

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
  const [stats, setStats] = useState({
    totalActivities: 0,
    messages: 0,
    calls: 0,
    aiActions: 0,
  });

  const { selectedTeamId } = useTeamDashboard();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
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

  const handleExport = () => {
    const qs = new URLSearchParams({
      search,
      type,
      userId,
      dateFrom,
      dateTo,
      sort,
    });

    window.open(
      `${import.meta.env.VITE_API_URL}/teams/${selectedTeamId}/activities/export?${qs}`,

      "_blank",
    );
  };
  return (
    <div className="team-activity-page">
      <div className="team-performance-header heading_page">
        <Activity />
        <h1 className="team-page-title">Team Activity</h1>
      </div>
      <div className="team-members-filters">
        <div className="team-search-box">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search activities..."
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
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="user:asc">User A-Z</option>
          <option value="user:desc">User Z-A</option>
          <option value="type:asc">Type</option>
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="team-filter-select"
        >
          <option value="all">All Activities</option>
          <option value="team">Team</option>
          <option value="lead">Leads</option>
          <option value="property">Properties</option>
          <option value="user">Users</option>
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
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
        <button className="team-primary-btn" onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="team-activity-stats">
        <div className="team-activity-stat-card">
          <span>Total Activities</span>
          <h2>{stats.totalActivities}</h2>
          <p>Latest team activity logs</p>
        </div>

        <div className="team-activity-stat-card">
          <span>Messages Sent</span>
          <h2>{stats.messages}</h2>
          <p>Tracked from team events</p>
        </div>

        <div className="team-activity-stat-card">
          <span>Calls Scheduled</span>
          <h2>{stats.calls}</h2>
          <p>Tracked from team events</p>
        </div>

        <div className="team-activity-stat-card">
          <span>AI Actions</span>
          <h2>{stats.aiActions}</h2>
          <p>Automation activity</p>
        </div>
      </div>

      <div className="team-card">
        <div className="team-card-header">
          <div>
            <h3 className="team-card-title">Recent Team Activities</h3>
            <p className="team-card-description">
              Latest updates from your organization
            </p>
          </div>
        </div>

        <div className="team-activity-table">
          <div className="team-activity-table-head">
            <div>User</div>
            <div>Activity</div>
            <div>Time</div>
          </div>

          <div className="team-activity-table-body">
            {loading ? (
              <div className="team-activity-row">
                <div>Loading activities...</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="team-activity-row">
                <div>No activities found.</div>
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
                            "Unknown User"}
                        </div>

                        <div className="team-activity-user-role">
                          {String(activity.entityType || "")
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </div>
                      </div>
                    </div>

                    <div className="team-activity-action">
                      {activity.message || "Team activity updated"}
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
        Showing <b>{activities.length}</b> of <b>{pagination.total}</b>{" "}
        activities
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
                <h2>Activity Detail</h2>

                <p>{selectedActivity.time}</p>
              </div>

              <button onClick={() => setSelectedActivity(null)}>✕</button>
            </div>

            <div className="team-drawer-section">
              <label>User</label>

              <div>
                {selectedActivity.userName ||
                  selectedActivity.userEmail ||
                  "Unknown"}
              </div>
            </div>

            <div className="team-drawer-section">
              <label>Event Type</label>

              <div>{selectedActivity.eventType}</div>
            </div>

            <div className="team-drawer-section">
              <label>Entity</label>

              <div>{selectedActivity.entityType}</div>
            </div>

            <div className="team-drawer-section">
              <label>Activity</label>

              <div>{selectedActivity.message}</div>
            </div>

            <div className="team-drawer-section">
              <label>Created</label>

              <div>{new Date(selectedActivity.createdAt).toLocaleString()}</div>
            </div>

            <div className="team-drawer-section">
              <div className="team-timeline">
                <h3>Timeline</h3>

                <div className="timeline-item">
                  <div className="timeline-dot" />

                  <div>
                    <strong>Event</strong>

                    <p>{selectedActivity.eventType}</p>
                  </div>
                </div>

                {selectedActivity.oldValue && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>Old Value</strong>

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
                      <strong>New Value</strong>

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
                      <strong>Entity</strong>

                      <p>{selectedActivity.entityId}</p>
                    </div>
                  </div>
                )}

                {selectedActivity.browser && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>Browser</strong>

                      <p>{selectedActivity.browser}</p>
                    </div>
                  </div>
                )}

                {selectedActivity.device && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>Device</strong>

                      <p>{selectedActivity.device}</p>
                    </div>
                  </div>
                )}

                {selectedActivity.ip && (
                  <div className="timeline-item">
                    <div className="timeline-dot" />

                    <div>
                      <strong>IP Address</strong>

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
