import React, { useEffect, useMemo, useState } from "react";
import "./CustomerServiceWorkspace.css";

const tickets = [
  [
    "TKT-2025-2458",
    "Login issue on customer portal",
    "TechFlow Solutions",
    "Olivia Bennett",
    "Web",
    "Account Access",
    "High",
    "Open",
    "In Progress",
    "John Smith",
    "May 20, 2025",
    "09:24 AM",
    "12 min ago",
  ],
  [
    "TKT-2025-2457",
    "Payment not processing",
    "Bright Marketing",
    "Ethan Walker",
    "Email",
    "Billing & Payments",
    "High",
    "In Progress",
    "In Progress",
    "Sophia Martinez",
    "May 20, 2025",
    "08:15 AM",
    "21 min ago",
  ],
  [
    "TKT-2025-2456",
    "Feature request: New report",
    "GreenLeaf Realty",
    "Sophia Martinez",
    "Portal",
    "Feature Request",
    "Medium",
    "Open",
    "On Track",
    "Liam Johnson",
    "May 20, 2025",
    "07:45 AM",
    "45 min ago",
  ],
  [
    "TKT-2025-2455",
    "Data export not working",
    "Summit Enterprises",
    "Liam Johnson",
    "Chat",
    "Technical Issue",
    "High",
    "In Progress",
    "At Risk",
    "John Smith",
    "May 19, 2025",
    "04:32 PM",
    "1h ago",
  ],
  [
    "TKT-2025-2454",
    "Integrate with QuickBooks",
    "Innovate Labs",
    "Noah Davis",
    "Email",
    "Integration",
    "Medium",
    "Pending",
    "On Track",
    "Olivia Bennett",
    "May 19, 2025",
    "03:11 PM",
    "2h ago",
  ],
  [
    "TKT-2025-2453",
    "How to set up automations?",
    "NextGen Industries",
    "Ava Thompson",
    "Portal",
    "How-To / Support",
    "Low",
    "Open",
    "On Track",
    "Sophia Martinez",
    "May 19, 2025",
    "02:05 PM",
    "2h ago",
  ],
  [
    "TKT-2025-2452",
    "Unable to upload documents",
    "Pulse Technologies",
    "Mason Clark",
    "Web",
    "Technical Issue",
    "High",
    "In Progress",
    "At Risk",
    "Liam Johnson",
    "May 18, 2025",
    "11:48 AM",
    "3h ago",
  ],
  [
    "TKT-2025-2451",
    "Subscription downgrade help",
    "BlueStone Architects",
    "Isabella White",
    "Chat",
    "Billing & Payments",
    "Low",
    "Resolved",
    "Completed",
    "John Smith",
    "May 18, 2025",
    "10:22 AM",
    "Yesterday",
  ],
];

const stats = [
  ["users-round", "Open Tickets", "248", "+18 from yesterday", "14%"],
  [
    "circle-check-big",
    "Tickets Resolved (This Month)",
    "732",
    "+94 from last month",
    "16%",
  ],
  ["clock-3", "Avg. Response Time", "1h 25m", "Goal: < 2h", "22% faster"],
  [
    "timer-reset",
    "Avg. Resolution Time",
    "8h 42m",
    "Goal: < 24h",
    "18% faster",
  ],
  [
    "star",
    "Customer Satisfaction",
    "4.7 / 5",
    "Based on 412 ratings",
    "0.3 pts",
  ],
  ["shield-check", "SLA Compliance", "95.2%", "Goal: > 90%", "3.7%"],
];

const statTones = ["blue", "green", "purple", "amber", "gold", "indigo"];
const channelIconMap = {
  Web: "globe-2",
  Email: "mail",
  Portal: "monitor",
  Chat: "message-circle",
  Phone: "phone",
};
const recentActivityItems = [
  {
    icon: "ticket-check",
    tone: "blue",
    title: "Ticket TKT-2025-2457 updated",
    subtitle: "Status changed to In Progress",
    time: "12 min ago",
  },
  {
    icon: "circle-check-big",
    tone: "green",
    title: "Ticket TKT-2025-2451 resolved",
    subtitle: "Resolution time: 2h 15m",
    time: "1h ago",
  },
  {
    icon: "ticket-plus",
    tone: "cyan",
    title: "New ticket TKT-2025-2458 created",
    subtitle: "by Olivia Bennett",
    time: "2h ago",
  },
  {
    icon: "alarm-clock",
    tone: "red",
    title: "SLA breached on TKT-2025-2449",
    subtitle: "Response time exceeded",
    time: "3h ago",
  },
  {
    icon: "star",
    tone: "green",
    title: "Customer satisfaction received",
    subtitle: "Rating: 5 Stars",
    time: "4h ago",
  },
];
const topAgents = [
  { name: "John Smith", resolved: 156, csat: "4.9★", response: "58m" },
  { name: "Sophia Martinez", resolved: 148, csat: "4.8★", response: "1h 04m" },
  { name: "Liam Johnson", resolved: 132, csat: "4.7★", response: "1h 12m" },
  { name: "Olivia Bennett", resolved: 121, csat: "4.7★", response: "1h 18m" },
  { name: "Ethan Walker", resolved: 98, csat: "4.6★", response: "1h 25m" },
];

const tabs = [
  ["settings", "Overview"],
  ["badge-help", "Tickets"],
  ["users", "Customers"],
  ["library", "Knowledge Base"],
  ["alarm-clock", "SLA & Escalations"],
  ["network", "Automation"],
  ["file-chart-column", "Reports"],
  ["clipboard-check", "Surveys"],
];
const I = ({ name, size = 16 }) => (
  <i data-lucide={name} style={{ width: size, height: size }} />
);

function Donut({ title, rows }) {
  return (
    <div className="csw-panel">
      <div className="csw-panel-head">
        <b>{title}</b>
        <select>
          <option>This Month</option>
        </select>
      </div>
      <div className="csw-donut-body">
        <div className="csw-donut">
          <div>
            <strong>248</strong>
            <span>Total Tickets</span>
          </div>
        </div>
        <div className="csw-legend">
          {rows.map((r, i) => (
            <p key={r[0]}>
              <i className={`d${i}`} />
              <span>{r[0]}</span>
              <b>{r[1]}</b>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
function Icon({ name, size = 16 }) {
  return <i data-lucide={name} style={{ width: size, height: size }} />;
}
export default function CustomerServiceWorkspace() {
  const [tab, setTab] = useState("Tickets");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Status");
  const [priority, setPriority] = useState("Priority");
  const [channel, setChannel] = useState("Channel");
  const [showNew, setShowNew] = useState(false);
  useEffect(() => window.lucide?.createIcons(), [tab, showNew]);
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    window.lucide?.createIcons();
  }, [tab, showNew, selected]);
  const filtered = useMemo(
    () =>
      tickets.filter((t) => {
        const q = search.toLowerCase();
        return (
          (!q || t.join(" ").toLowerCase().includes(q)) &&
          (status === "Status" || t[7] === status) &&
          (priority === "Priority" || t[6] === priority) &&
          (channel === "Channel" || t[4] === channel)
        );
      }),
    [search, status, priority, channel],
  );

  return (
    <div className="csw-page">
      <div className="csw-header">
        <div>
          <h1>Customer Service Workspace</h1>
          <p>Deliver amazing support experiences and resolve issues faster.</p>
        </div>
        <div className="csw-header-actions">
          <div className="csw-global-search">
            <I name="search" />
            <input placeholder="Search tickets, customers, agents, or KB..." />
            <kbd>⌘ K</kbd>
          </div>
          <button className="primary">
            <I name="plus" />
            New Ticket
            <I name="chevron-down" size={13} />
          </button>
        </div>
      </div>

      <div className="csw-stats">
        {stats.map((s, i) => (
          <div className={`csw-stat csw-stat-${statTones[i]}`} key={s[1]}>
            <div>
              <span>{s[1]}</span>
              <em>
                <I name={s[0]} size={19} />
              </em>
            </div>
            <strong>{s[2]}</strong>
            <small>{s[3]}</small>
            <p>
              ↑ {s[4]} <span>vs last 7 days</span>
            </p>
          </div>
        ))}
      </div>

      <div className="csw-tabs">
        {tabs.map((t) => (
          <button
            key={t[1]}
            className={tab === t[1] ? "active" : ""}
            onClick={() => setTab(t[1])}
          >
            <I name={t[0]} />
            {t[1]}
          </button>
        ))}
      </div>

      {tab === "Tickets" ? (
        <>
          <div className="csw-section-head">
            <div>
              <h2>Tickets</h2>
              <p>View, manage and resolve customer tickets</p>
            </div>
            <div>
              <button>
                <I name="upload" />
                Import
              </button>
              <button>
                <I name="download" />
                Export
              </button>
              <button>
                <I name="settings-2" />
              </button>
              <button className="primary" onClick={() => setShowNew(true)}>
                <I name="plus" />
                New Ticket
              </button>
            </div>
          </div>
          <div className="csw-filters">
            <label>
              <I name="search" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
              />
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Status</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Pending</option>
              <option>Resolved</option>
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option>Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option>Channel</option>
              <option>Web</option>
              <option>Email</option>
              <option>Portal</option>
              <option>Chat</option>
            </select>
            <select>
              <option>Category</option>
            </select>
            <select>
              <option>Assigned To</option>
            </select>
            <select>
              <option>SLA Status</option>
            </select>
            <select>
              <option>Date Range</option>
            </select>
            <select>
              <option>More Filters</option>
            </select>
            <button className="reset">↻ Reset</button>
            <span></span>
            <button className="fsw-view">
              <Icon name="table-2" />
              Table
              <Icon name="chevron-down" size={13} />
            </button>
            <button className="fsw-square">
              <Icon name="list" />
            </button>
            <button className="fsw-square">
              <Icon name="calendar-days" />
            </button>
            <button className="fsw-square">
              <Icon name="calendar" />
            </button>
          </div>
          <div className="csw-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t[0]}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(t[0])}
                        onChange={() =>
                          setSelected((s) =>
                            s.includes(t[0])
                              ? s.filter((x) => x !== t[0])
                              : [...s, t[0]],
                          )
                        }
                      />
                    </td>
                    <td>
                      <a>{t[0]}</a>
                    </td>
                    <td>{t[1]}</td>
                    <td>
                      <b>{t[2]}</b>
                      <small>{t[3]}</small>
                    </td>
                    <td>
                      <span
                        className={`csw-channel csw-channel-${t[4].toLowerCase()}`}
                      >
                        <I name={channelIconMap[t[4]] || "circle"} size={14} />
                        {t[4]}
                      </span>
                    </td>
                    <td>{t[5]}</td>
                    <td>
                      <span className={`pill ${t[6].toLowerCase()}`}>
                        {t[6]}
                      </span>
                    </td>
                    <td>
                      <span className={`pill blue`}>{t[7]}</span>
                    </td>
                    <td>
                      <span
                        className={`pill ${t[8] === "At Risk" ? "red" : "green"}`}
                      >
                        {t[8]}
                      </span>
                    </td>
                    <td>
                      <span className={`avatar a${i % 4}`}>
                        {t[9]
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </span>
                      {t[9]}
                    </td>
                    <td>
                      {t[10]}
                      <small>{t[11]}</small>
                    </td>
                    <td className="recent">{t[12]}</td>
                    <td>
                      <div className="row-actions">
                        <button>
                          <I name="eye" size={14} />
                        </button>
                        <button>
                          <I name="pencil" size={14} />
                        </button>
                        <button>
                          <I name="ellipsis-vertical" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="csw-pagination">
              <span>Showing 1 to {filtered.length} of 248 tickets</span>
              <div>
                <button className="active">1</button>
                <button>2</button>
                <button>3</button>
                <button>4</button>
                <button>5</button>
                <span>...</span>
                <button>31</button>
              </div>
              <select>
                <option>20 / page</option>
              </select>
            </div>
          </div>
          <div className="csw-bottom">
            <Donut
              title="Tickets by Status"
              rows={[
                ["Open", "68 (27.4%)"],
                ["In Progress", "74 (29.8%)"],
                ["Pending", "42 (16.9%)"],
                ["Resolved", "48 (19.4%)"],
                ["Closed", "16 (6.5%)"],
              ]}
            />
            <Donut
              title="Tickets by Channel"
              rows={[
                ["Portal", "102 (41.1%)"],
                ["Email", "68 (27.4%)"],
                ["Web", "45 (18.1%)"],
                ["Chat", "28 (11.3%)"],
                ["Phone", "5 (2.0%)"],
              ]}
            />
            <div className="csw-panel csw-sla-panel">
              <div className="csw-panel-head">
                <b>SLA Performance</b>
                <select>
                  <option>This Month</option>
                </select>
              </div>
              <div className="csw-sla-content">
                <div className="csw-sla-ring-wrap">
                  <div className="csw-sla-ring">
                    <div className="csw-sla-ring-center">
                      <strong>95.2%</strong>
                      <span>SLA Compliance</span>
                    </div>
                  </div>
                  <p className="goal">Goal: &gt; 90%</p>
                </div>
                <div className="csw-sla-legend">
                  <p>
                    <i className="sla-dot on-track" />
                    <span>On Track</span>
                    <b>186 (75.0%)</b>
                  </p>
                  <p>
                    <i className="sla-dot at-risk" />
                    <span>At Risk</span>
                    <b>35 (14.1%)</b>
                  </p>
                  <p>
                    <i className="sla-dot breached" />
                    <span>Breached</span>
                    <b>27 (10.9%)</b>
                  </p>
                </div>
              </div>
            </div>
            <div className="csw-panel">
              <div className="csw-panel-head">
                <b>Recent Activity</b>
                <select>
                  <option>All Activity</option>
                </select>
              </div>
              <div className="mini-list csw-activity-list">
                {recentActivityItems.map((item) => (
                  <p key={item.title}>
                    <span className={`csw-activity-icon ${item.tone}`}>
                      <I name={item.icon} size={14} />
                    </span>
                    <span className="csw-activity-copy">
                      <b>{item.title}</b>
                      <small>{item.subtitle}</small>
                    </span>
                    <time>{item.time}</time>
                  </p>
                ))}
              </div>
              <button className="link">View all activity →</button>
            </div>
            <div className="csw-panel">
              <div className="csw-panel-head">
                <b>Top Performing Agents</b>
                <select>
                  <option>This Month</option>
                </select>
              </div>
              <div className="agent-list">
                {topAgents.map((agent, i) => (
                  <p key={agent.name}>
                    <b>{i + 1}</b>
                    <span className={`avatar a${i % 4}`}>
                      {agent.name
                        .split(" ")
                        .map((x) => x[0])
                        .join("")}
                    </span>
                    <span className="agent-name">{agent.name}</span>
                    <small>
                      <b>{agent.resolved}</b>
                    </small>
                    <small>
                      <b>{agent.csat}</b>
                    </small>
                  </p>
                ))}
              </div>
              <button className="link">View full leaderboard →</button>
            </div>
          </div>
        </>
      ) : (
        <div className="placeholder">
          <I
            name={tabs.find((x) => x[1] === tab)?.[0] || "headphones"}
            size={40}
          />
          <h2>{tab}</h2>
          <p>UI placeholder for the next implementation step.</p>
        </div>
      )}

      {showNew && (
        <div className="modal-bg" onMouseDown={() => setShowNew(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div>
              <h3>New Ticket</h3>
              <button onClick={() => setShowNew(false)}>×</button>
            </div>
            <label>
              Subject
              <input placeholder="Enter ticket subject" />
            </label>
            <label>
              Customer
              <input placeholder="Customer name" />
            </label>
            <label>
              Priority
              <select>
                <option>Medium</option>
                <option>High</option>
                <option>Low</option>
              </select>
            </label>
            <footer>
              <button onClick={() => setShowNew(false)}>Cancel</button>
              <button className="primary" onClick={() => setShowNew(false)}>
                Create Ticket
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
