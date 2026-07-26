import {
  CheckCircle2,
  Bell,
  CreditCard,
  UserPlus,
  UserMinus,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

import { useEffect, useState } from "react";

import { fetchTeamNotifications } from "./services/team.service";
import { formatTimeAgo } from "../../utils/helpers";
import useTeamDashboard from "./hooks/useTeamDashboard";

import "./notifications.css";

/* =====================================================
  HELPERS
===================================================== */

const formatType = (type) =>
  String(type || "notification")
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .trim();

const matchesBilling = (item) => {
  const type = String(item?.type || "").toLowerCase();
  const category = String(item?.category || "").toLowerCase();

  return (
    category === "billing" ||
    type.includes("billing") ||
    type.includes("seat") ||
    type.includes("payment") ||
    type.includes("subscription") ||
    type.includes("invoice")
  );
};

const matchesSecurity = (item) => {
  const type = String(item?.type || "").toLowerCase();
  const category = String(item?.category || "").toLowerCase();

  return (
    category === "security" ||
    type.includes("security") ||
    type.includes("login") ||
    type.includes("auth") ||
    type.includes("password")
  );
};

const getNotificationConfig = (item) => {
  const type = String(item?.type || "").toLowerCase();

  if (
    type.includes("member_added") ||
    type.includes("invited") ||
    type.includes("joined")
  ) {
    return { icon: UserPlus, className: "success" };
  }

  if (
    type.includes("member_removed") ||
    type.includes("deactivated") ||
    type.includes("removed")
  ) {
    return { icon: UserMinus, className: "danger" };
  }

  if (matchesBilling(item)) {
    return { icon: CreditCard, className: "billing" };
  }

  if (matchesSecurity(item)) {
    return { icon: ShieldAlert, className: "warning" };
  }

  if (type.includes("created") || type.includes("success")) {
    return { icon: CheckCircle2, className: "success" };
  }

  return { icon: Bell, className: "info" };
};

export default function TeamNotificationsPage() {
  const { selectedTeamId } = useTeamDashboard();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedTeamId) return;

    async function loadNotifications() {
      try {
        setLoading(true);
        setError("");

        const res = await fetchTeamNotifications(selectedTeamId);

        setNotifications(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        console.error("LOAD TEAM NOTIFICATIONS ERROR", err);
        setError("Unable to load notifications. Please try again.");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [selectedTeamId]);

  /* Stat cards derived from the real fetched notifications */
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const billingCount = notifications.filter(matchesBilling).length;
  const securityCount = notifications.filter(matchesSecurity).length;

  return (
    <div className="team-notifications-page">
      {/* HEADER */}
      <div className="team-performance-header heading_page">
        <Bell />
        <h1 className="team-page-title">Team Notifications</h1>
      </div>

      {/* STATS */}

      <div className="team-notifications-stats">
        <div className="team-notifications-stat-card">
          <span>Total Notifications</span>
          <h2>{totalCount}</h2>
          <p>Recent notifications</p>
        </div>

        <div className="team-notifications-stat-card">
          <span>Unread Alerts</span>
          <h2>{unreadCount}</h2>
          <p>Requires attention</p>
        </div>

        <div className="team-notifications-stat-card">
          <span>Billing Events</span>
          <h2>{billingCount}</h2>
          <p>Billing-related notifications</p>
        </div>

        <div className="team-notifications-stat-card">
          <span>Security Events</span>
          <h2>{securityCount}</h2>
          <p>Security-related notifications</p>
        </div>
      </div>

      {/* TABLE */}

      <div className="team-card">
        <div className="team-card-header">
          <div>
            <h3 className="team-card-title">Workspace Notifications</h3>

            <p className="team-card-description">
              Latest alerts and updates from your team
            </p>
          </div>
        </div>

        <div className="team-notifications-table">
          <div className="team-notifications-table-head">
            <div>Notification</div>
            <div>Category</div>
            <div>Time</div>
          </div>

          <div className="team-notifications-table-body">
            {loading ? (
              <div className="team-notifications-row">
                <div>Loading notifications...</div>
              </div>
            ) : error ? (
              <div className="team-notifications-row">
                <div>{error}</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="team-notifications-row">
                <div>No notifications</div>
              </div>
            ) : (
              notifications.map((item, index) => {
                const config = getNotificationConfig(item);
                const Icon = config.icon;

                return (
                  <div
                    key={item.id || index}
                    className="team-notifications-row"
                  >
                    {/* LEFT */}

                    <div className="team-notifications-main">
                      <div
                        className={`team-notifications-icon ${config.className}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div>
                        <div className="team-notifications-title">
                          {!item.isRead && (
                            <span
                              style={{
                                display: "inline-block",
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#3b82f6",
                                marginRight: 8,
                              }}
                            />
                          )}
                          {item.title || formatType(item.type)}
                        </div>

                        <div className="team-notifications-description">
                          {item.message || "No additional details"}
                        </div>
                      </div>
                    </div>

                    {/* CATEGORY */}

                    <div
                      className={`team-notifications-badge ${config.className}`}
                    >
                      {formatType(item.type)}
                    </div>

                    {/* TIME */}

                    <div className="team-notifications-time">
                      <span>{formatTimeAgo(item.createdAt)}</span>

                      <div className="team-notifications-arrow">
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
    </div>
  );
}
