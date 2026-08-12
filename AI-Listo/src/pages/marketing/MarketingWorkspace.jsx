import React, { useEffect, useMemo, useState } from "react";
import { icons as lucideIcons } from "lucide-react";
import "./MarketingWorkspace.css";

const campaigns = [
  [
    "Q2 Product Launch",
    "Product Launch",
    "mail linkedin facebook search",
    "Product Interest",
    "2,890 contacts",
    "Active",
    "$12,000",
    "$7,432",
    "342",
    "8.4%",
    "285%",
    "May 01, 2025",
    "John Smith",
  ],
  [
    "Webinar: AI for Business",
    "Webinar",
    "mail linkedin calendar-days",
    "Business Leaders",
    "1,450 contacts",
    "Active",
    "$5,000",
    "$2,359",
    "189",
    "12.2%",
    "412%",
    "May 05, 2025",
    "Sophia Martinez",
  ],
  [
    "Customer Retention May",
    "Nurture",
    "mail",
    "Existing Customers",
    "4,230 contacts",
    "Active",
    "$3,000",
    "$1,127",
    "156",
    "6.3%",
    "198%",
    "May 02, 2025",
    "Liam Johnson",
  ],
  [
    "Google Ads - Brand",
    "Paid Search",
    "search",
    "Lookalike 1%",
    "3,200 contacts",
    "Active",
    "$8,000",
    "$5,186",
    "278",
    "9.1%",
    "336%",
    "Apr 28, 2025",
    "John Smith",
  ],
  [
    "LinkedIn Awareness",
    "Brand Awareness",
    "linkedin",
    "Lookalike 2%",
    "5,600 contacts",
    "Scheduled",
    "$6,000",
    "$0",
    "0",
    "0%",
    "0%",
    "May 15, 2025",
    "Olivia Bennett",
  ],
  [
    "Free Trial Promotion",
    "Promotion",
    "mail search linkedin",
    "Trial Users",
    "1,920 contacts",
    "Completed",
    "$4,000",
    "$3,824",
    "276",
    "14.7%",
    "521%",
    "Apr 10, 2025",
    "Ethan Walker",
  ],
  [
    "Website Traffic Boost",
    "Traffic",
    "search",
    "All Visitors",
    "",
    "Paused",
    "$2,500",
    "$1,203",
    "56",
    "2.9%",
    "78%",
    "Apr 20, 2025",
    "Sophia Martinez",
  ],
  [
    "Industry Report Download",
    "Content Offer",
    "mail linkedin",
    "Industry Pros",
    "2,100 contacts",
    "Completed",
    "$1,800",
    "$1,341",
    "98",
    "11.5%",
    "287%",
    "Apr 01, 2025",
    "Liam Johnson",
  ],
];

const stats = [
  ["send", "Active Campaigns", "28", "12 launching soon", "20%"],
  ["users-round", "Total Leads (This Month)", "2,453", "+342 new leads", "16%"],
  ["mail", "Email Open Rate", "34.6%", "+2.1% vs last month", "6%"],
  [
    "mouse-pointer-2",
    "Click Through Rate",
    "7.8%",
    "+0.6% vs last month",
    "9%",
  ],
  ["flag", "Conversions (This Month)", "156", "Leads to Customers", "18%"],
  [
    "circle-dollar-sign",
    "Cost Per Lead",
    "$14.32",
    "-$2.18 vs last month",
    "13%",
  ],
  [
    "chart-no-axes-combined",
    "ROI (This Month)",
    "312%",
    "+24% vs last month",
    "9%",
  ],
];
const statTones = [
  "blue",
  "green",
  "amber",
  "purple",
  "teal",
  "rose",
  "indigo",
];

const recentActivityItems = [
  {
    icon: "badge-plus",
    tone: "blue",
    title: "Campaign created",
    subtitle: "Q2 Product Launch",
    time: "10:24 AM",
  },
  {
    icon: "mail",
    tone: "indigo",
    title: "Email sent",
    subtitle: "Customer Retention May",
    time: "09:15 AM",
  },
  {
    icon: "user-plus",
    tone: "cyan",
    title: "New lead added",
    subtitle: "From Webinar: AI for Business",
    time: "08:47 AM",
  },
  {
    icon: "file-input",
    tone: "amber",
    title: "Form submitted",
    subtitle: "Contact Us Form",
    time: "Yesterday",
  },
  {
    icon: "circle-pause",
    tone: "rose",
    title: "Campaign paused",
    subtitle: "Website Traffic Boost",
    time: "Yesterday",
  },
];

const upcomingCampaignItems = [
  {
    icon: "briefcase-business",
    tone: "linkedin",
    title: "LinkedIn Awareness",
    subtitle: "Brand Awareness",
    date: "May 15, 2025",
  },
  {
    icon: "mail",
    tone: "email",
    title: "Product Demo Email",
    subtitle: "Nurture",
    date: "May 16, 2025",
  },
  {
    icon: "video",
    tone: "webinar",
    title: "Customer Webinar",
    subtitle: "Webinar",
    date: "May 17, 2025",
  },
  {
    icon: "file-text",
    tone: "content",
    title: "Case Study Launch",
    subtitle: "Content Offer",
    date: "May 18, 2025",
  },
  {
    icon: "megaphone",
    tone: "social",
    title: "Paid Social Campaign",
    subtitle: "Traffic",
    date: "May 19, 2025",
  },
];

const tabs = [
  ["settings", "Overview"],
  ["badge-dollar-sign", "Campaigns"],
  ["users", "Audiences"],
  ["mail", "Email & SMS"],
  ["panels-top-left", "Forms & Landing Pages"],
  ["network", "Automation"],
  ["file-text", "Content"],
  ["file-chart-column", "Reports"],
  ["target", "Attribution"],
];
const iconAliases = {
  linkedin: "BriefcaseBusiness",
  facebook: "Users",
  google: "Search",
  search: "Search",
  "pause-circle": "CirclePause",
};

const toPascalIconName = (name = "") =>
  name
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

function I({ name, size = 16 }) {
  const iconName = iconAliases[name] || toPascalIconName(name);
  const LucideIcon = lucideIcons[iconName] || lucideIcons.Circle;

  return <LucideIcon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function Icon({ name, size = 16 }) {
  return <I name={name} size={size} />;
}

export default function MarketingWorkspace() {
  const [tab, setTab] = useState("Campaigns");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [type, setType] = useState("All Types");
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [tab, showNew, selected]);
  const filtered = useMemo(
    () =>
      campaigns.filter((c) => {
        const q = search.toLowerCase();
        return (
          (!q || c.join(" ").toLowerCase().includes(q)) &&
          (status === "All Statuses" || c[5] === status) &&
          (type === "All Types" || c[1] === type)
        );
      }),
    [search, status, type],
  );

  return (
    <div className="mkw-page">
      <div className="mkw-header">
        <div>
          <h1>Marketing Workspace</h1>
          <p>Plan, execute, and optimize campaigns that drive growth.</p>
        </div>
        <div className="mkw-header-actions">
          <div className="mkw-global-search">
            <I name="search" />
            <input placeholder="Search campaigns, audiences, contacts..." />
            <kbd>⌘ K</kbd>
          </div>
          <button className="primary">
            <I name="plus" />
            Create
            <I name="chevron-down" size={13} />
          </button>
        </div>
      </div>
      <div className="mkw-stats">
        {stats.map((s, i) => (
          <div className={`mkw-stat mkw-stat-${statTones[i]}`} key={s[1]}>
            <div>
              <span>{s[1]}</span>
              <em>
                <I name={s[0]} size={19} />
              </em>
            </div>
            <strong>{s[2]}</strong>
            <small>{s[3]}</small>
            <p>
              ↑ {s[4]} <span>vs last month</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mkw-tabs">
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

      {tab === "Campaigns" ? (
        <>
          <div className="mkw-section-head">
            <div>
              <h2>Campaigns</h2>
              <p>Manage and track all your marketing campaigns</p>
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
                New Campaign
              </button>
            </div>
          </div>
          <div className="mkw-filters">
            <label>
              <I name="search" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns..."
              />
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All Statuses</option>
              <option>Active</option>
              <option>Scheduled</option>
              <option>Completed</option>
              <option>Paused</option>
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>All Types</option>
              {[...new Set(campaigns.map((x) => x[1]))].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select>
              <option>All Channels</option>
            </select>
            <select>
              <option>Date Range</option>
            </select>
            <select>
              <option>This Month</option>
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
          <div className="mkw-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>
                  <th>Campaign Name</th>
                  <th>Type</th>
                  <th>Channel</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Leads</th>
                  <th>Conv. Rate</th>
                  <th>ROI</th>
                  <th>Start Date</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c[0]}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(c.id)}
                        onChange={() =>
                          setSelected((s) =>
                            s.includes(c.id)
                              ? s.filter((x) => x !== c.id)
                              : [...s, c.id],
                          )
                        }
                      />
                    </td>
                    <td>
                      <b>{c[0]}</b>
                    </td>
                    <td>{c[1]}</td>
                    <td>
                      <div className="channels">
                        {c[2].split(" ").map((x, j) => (
                          <span key={j}>
                            <I name={x} size={14} />
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <b>{c[3]}</b>
                      <small>{c[4]}</small>
                    </td>
                    <td>
                      <span className={`pill ${c[5].toLowerCase()}`}>
                        {c[5]}
                      </span>
                    </td>
                    <td>{c[6]}</td>
                    <td>{c[7]}</td>
                    <td>{c[8]}</td>
                    <td>{c[9]}</td>
                    <td>{c[10]}</td>
                    <td>{c[11]}</td>
                    <td>
                      <span className={`avatar a${i % 4}`}>
                        {c[12]
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button>
                          <I name="chart-no-axes-column-increasing" size={14} />
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
            <div className="mkw-pagination">
              <span>Showing 1 to {filtered.length} of 28 campaigns</span>
              <div>
                <button className="active">1</button>
                <button>2</button>
                <button>3</button>
                <button>4</button>
              </div>
              <select>
                <option>20 / page</option>
              </select>
            </div>
          </div>
          <div className="mkw-bottom">
            <div className="mkw-panel">
              <div className="mkw-panel-head">
                <b>Leads Over Time</b>
                <select>
                  <option>This Month</option>
                </select>
              </div>
              <div className="line-legend">
                <span>
                  <i className="blue" />
                  Total Leads <b>2,453</b>
                </span>
                <span>
                  <i className="green" />
                  Converted Leads <b>156</b>
                </span>
              </div>
              <svg className="line-chart" viewBox="0 0 400 170">
                <polyline
                  points="20,135 60,115 100,100 140,84 180,88 220,72 260,76 300,64 340,58 380,42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <polyline
                  className="converted"
                  points="20,150 60,140 100,132 140,125 180,116 220,111 260,114 300,108 340,105 380,98"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
            </div>
            <div className="mkw-panel">
              <div className="mkw-panel-head">
                <b>Leads by Channel</b>
                <select>
                  <option>This Month</option>
                </select>
              </div>
              <div className="mkw-donut-body">
                <div className="mkw-donut">
                  <div>
                    <strong>2,453</strong>
                    <span>Total Leads</span>
                  </div>
                </div>
                <div className="mkw-legend">
                  {[
                    ["Email", "42% (1,030)"],
                    ["Paid Search", "26% (638)"],
                    ["Social Media", "18% (442)"],
                    ["Direct", "8% (196)"],
                    ["Referrals", "4% (98)"],
                    ["Other", "2% (49)"],
                  ].map((r, i) => (
                    <p key={r[0]}>
                      <i className={`d${i}`} />
                      <span>{r[0]}</span>
                      <b>{r[1]}</b>
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="mkw-panel">
              <div className="mkw-panel-head">
                <b>Top Performing Campaigns</b>
                <select>
                  <option>This Month</option>
                </select>
              </div>
              <div className="rank-list">
                {campaigns.slice(0, 5).map((c, i) => (
                  <p key={c[0]}>
                    <b>{i + 1}</b>
                    <span>
                      <strong>{c[0]}</strong>
                      <small>{c[8]} leads</small>
                    </span>
                    <em>
                      {c[9]}
                      <i style={{ width: `${90 - i * 10}%` }} />
                    </em>
                  </p>
                ))}
              </div>
              <button className="link">View full report →</button>
            </div>
            <div className="mkw-panel">
              <div className="mkw-panel-head">
                <b>Recent Activity</b>
                <select>
                  <option>All Activity</option>
                </select>
              </div>
              <div className="mini-list mkw-activity-list">
                {recentActivityItems.map((item) => (
                  <p key={item.title}>
                    <span className={`mkw-mini-icon ${item.tone}`}>
                      <I name={item.icon} size={14} />
                    </span>
                    <span>
                      <b>{item.title}</b>
                      <small>{item.subtitle}</small>
                    </span>
                    <time>{item.time}</time>
                  </p>
                ))}
              </div>
              <button className="link">View all activity →</button>
            </div>
            <div className="mkw-panel">
              <div className="mkw-panel-head">
                <b>Upcoming Campaigns</b>
                <select>
                  <option>Next 7 Days</option>
                </select>
              </div>
              <div className="mini-list mkw-upcoming-list">
                {upcomingCampaignItems.map((item) => (
                  <p key={item.title}>
                    <span className={`mkw-mini-icon ${item.tone}`}>
                      <I name={item.icon} size={14} />
                    </span>
                    <span>
                      <b>{item.title}</b>
                      <small>{item.subtitle}</small>
                    </span>
                    <time>{item.date}</time>
                  </p>
                ))}
              </div>
              <button className="link">View calendar →</button>
            </div>
          </div>
        </>
      ) : (
        <div className="placeholder">
          <I
            name={tabs.find((x) => x[1] === tab)?.[0] || "megaphone"}
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
              <h3>New Campaign</h3>
              <button onClick={() => setShowNew(false)}>×</button>
            </div>
            <label>
              Campaign name
              <input placeholder="Enter campaign name" />
            </label>
            <label>
              Type
              <select>
                <option>Product Launch</option>
                <option>Webinar</option>
                <option>Promotion</option>
              </select>
            </label>
            <label>
              Budget
              <input placeholder="$0" />
            </label>
            <footer>
              <button onClick={() => setShowNew(false)}>Cancel</button>
              <button className="primary" onClick={() => setShowNew(false)}>
                Create Campaign
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
