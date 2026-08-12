import React, { useEffect, useMemo, useState } from "react";
import "./FinancialServicesWorkspace.css";

const clientsSeed = [
  {
    id: "CL-2025-2356",
    name: "Robert Johnson",
    kind: "Individual",
    type: "Retail Client",
    advisor: "John Smith",
    advisorRole: "Senior Advisor",
    account: "Investment Portfolio",
    aum: "$1,250,000.00",
    risk: "Moderate",
    status: "Active",
    activity: "May 20, 2025",
    time: "10:24 AM",
    review: "Jun 20, 2025",
    due: "in 31 days",
  },
  {
    id: "CL-2025-2355",
    name: "GreenLeaf Enterprises",
    kind: "Business",
    type: "Corporate Client",
    advisor: "Sophia Martinez",
    advisorRole: "Financial Advisor",
    account: "Business Account",
    aum: "$4,780,000.00",
    risk: "Moderate High",
    status: "Active",
    activity: "May 19, 2025",
    time: "03:15 PM",
    review: "Jun 19, 2025",
    due: "in 30 days",
  },
  {
    id: "CL-2025-2354",
    name: "Michael Thompson",
    kind: "Individual",
    type: "Retail Client",
    advisor: "Liam Johnson",
    advisorRole: "Wealth Advisor",
    account: "Retirement Account",
    aum: "$750,000.00",
    risk: "Conservative",
    status: "Active",
    activity: "May 19, 2025",
    time: "11:45 AM",
    review: "May 28, 2025",
    due: "in 9 days",
  },
  {
    id: "CL-2025-2353",
    name: "Bright Future LLC",
    kind: "Business",
    type: "Corporate Client",
    advisor: "Olivia Bennett",
    advisorRole: "Senior Advisor",
    account: "Business Account",
    aum: "$2,350,000.00",
    risk: "Moderate",
    status: "Active",
    activity: "May 19, 2025",
    time: "09:20 AM",
    review: "Jun 18, 2025",
    due: "in 29 days",
  },
  {
    id: "CL-2025-2352",
    name: "Emily Davis",
    kind: "Individual",
    type: "Retail Client",
    advisor: "Ethan Walker",
    advisorRole: "Financial Advisor",
    account: "Investment Portfolio",
    aum: "$950,000.00",
    risk: "Moderate Low",
    status: "Active",
    activity: "May 18, 2025",
    time: "08:50 AM",
    review: "Jun 18, 2025",
    due: "in 29 days",
  },
  {
    id: "CL-2025-2351",
    name: "Summit Holdings Inc.",
    kind: "Business",
    type: "Corporate Client",
    advisor: "John Smith",
    advisorRole: "Senior Advisor",
    account: "Business Account",
    aum: "$6,250,000.00",
    risk: "High",
    status: "Active",
    activity: "May 17, 2025",
    time: "02:30 PM",
    review: "Jun 17, 2025",
    due: "in 28 days",
  },
  {
    id: "CL-2025-2350",
    name: "James Wilson",
    kind: "Individual",
    type: "Retail Client",
    advisor: "Sophia Martinez",
    advisorRole: "Financial Advisor",
    account: "Investment Portfolio",
    aum: "$1,100,000.00",
    risk: "Moderate",
    status: "Inactive",
    activity: "May 16, 2025",
    time: "10:15 AM",
    review: "May 30, 2025",
    due: "in 11 days",
  },
  {
    id: "CL-2025-2349",
    name: "NextGen Solutions",
    kind: "Business",
    type: "Corporate Client",
    advisor: "Liam Johnson",
    advisorRole: "Wealth Advisor",
    account: "Business Account",
    aum: "$3,890,000.00",
    risk: "Moderate High",
    status: "Active",
    activity: "May 18, 2025",
    time: "08:05 PM",
    review: "Jun 16, 2025",
    due: "in 27 days",
  },
];

const stats = [
  ["users", "Total Clients", "2,356", "Active Clients", "15%"],
  [
    "calendar-days",
    "Applications In Progress",
    "142",
    "Total Applications",
    "8%",
  ],
  [
    "shield-check",
    "Accounts Under Management",
    "1,780",
    "Total Accounts",
    "12%",
  ],
  [
    "circle-dollar-sign",
    "Assets Under Management",
    "$48,750,320",
    "Total AUM",
    "18%",
  ],
  [
    "badge-dollar-sign",
    "Revenue (This Month)",
    "$385,420",
    "Total Revenue",
    "14%",
  ],
  ["chart-no-axes-combined", "Conversion Rate", "24.6%", "This Month", "6.3%"],
];

const tabs = [
  ["settings", "Overview"],
  ["users", "Clients"],
  ["file-text", "Applications"],
  ["wallet-cards", "Accounts"],
  ["receipt-text", "Transactions"],
  ["chart-pie", "Investments"],
  ["files", "Documents"],
  ["network", "Commissions"],
  ["file-chart-column", "Reports"],
];

function Icon({ name, size = 16 }) {
  return <i data-lucide={name} style={{ width: size, height: size }} />;
}

function Donut({ title, center, subtitle, rows }) {
  return (
    <div className="fsw-panel fsw-donut-panel">
      <div className="fsw-panel-head">
        <b>{title}</b>
        <select>
          <option>This Month</option>
        </select>
      </div>
      <div className="fsw-donut-body">
        <div className="fsw-donut">
          <div>
            <strong>{center}</strong>
            <span>{subtitle}</span>
          </div>
        </div>
        <div className="fsw-legend">
          {rows.map((r, i) => (
            <div key={r[0]}>
              <span className={`dot d${i}`}></span>
              <span>{r[0]}</span>
              <b>{r[1]}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FinancialServicesWorkspace() {
  const [tab, setTab] = useState("Clients");
  const [search, setSearch] = useState("");
  const [clientType, setClientType] = useState("Client Type");
  const [status, setStatus] = useState("Status");
  const [risk, setRisk] = useState("Risk Level");
  const [selected, setSelected] = useState([]);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [tab, showNew, selected]);

  const rows = useMemo(
    () =>
      clientsSeed.filter((c) => {
        const q = search.toLowerCase();
        return (
          (!q ||
            `${c.id} ${c.name} ${c.advisor} ${c.account}`
              .toLowerCase()
              .includes(q)) &&
          (clientType === "Client Type" || c.type === clientType) &&
          (status === "Status" || c.status === status) &&
          (risk === "Risk Level" || c.risk === risk)
        );
      }),
    [search, clientType, status, risk],
  );

  const reset = () => {
    setSearch("");
    setClientType("Client Type");
    setStatus("Status");
    setRisk("Risk Level");
  };

  return (
    <div className="fsw-page">
      <header className="fsw-header">
        <div>
          <h1>Financial Services Workspace</h1>
          <p>
            Manage your entire client journey from application to portfolio
            management.
          </p>
        </div>
        <div className="fsw-header-actions">
          <div className="fsw-global-search">
            <Icon name="search" />
            <input placeholder="Search clients, accounts, applications, documents..." />
            <kbd>⌘ K</kbd>
          </div>
          <button className="fsw-new">
            <Icon name="plus" /> New <Icon name="chevron-down" size={14} />
          </button>
          
        </div>
      </header>

      <section className="fsw-stats">
        {stats.map(([icon, label, value, sub, trend]) => (
          <div className="fsw-stat" key={label}>
            <div className="fsw-stat-top">
              <span>{label}</span>
              <span className="fsw-stat-icon">
                <Icon name={icon} size={20} />
              </span>
            </div>
            <strong>{value}</strong>
            <small>{sub}</small>
            <div className="fsw-trend">
              ↑ {trend} <span>vs last month</span>
            </div>
          </div>
        ))}
      </section>

      <nav className="fsw-tabs">
        {tabs.map(([icon, label]) => (
          <button
            key={label}
            className={tab === label ? "active" : ""}
            onClick={() => setTab(label)}
          >
            <Icon name={icon} />
            {label}
          </button>
        ))}
      </nav>

      {tab === "Clients" ? (
        <>
          <section className="fsw-section-title">
            <div>
              <h2>Clients</h2>
              <p>View and manage all clients</p>
            </div>
            <div className="fsw-section-actions">
              <button>
                <Icon name="upload" />
                Import
              </button>
              <button>
                <Icon name="download" />
                Export
              </button>
              <button>
                <Icon name="settings-2" />
              </button>
              <button className="primary" onClick={() => setShowNew(true)}>
                <Icon name="plus" />
                New Client
              </button>
            </div>
          </section>

          <div className="fsw-filters">
            <label className="fsw-search">
              <Icon name="search" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
              />
            </label>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
            >
              <option>Client Type</option>
              <option>Retail Client</option>
              <option>Corporate Client</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select value={risk} onChange={(e) => setRisk(e.target.value)}>
              <option>Risk Level</option>
              {[
                "Conservative",
                "Moderate Low",
                "Moderate",
                "Moderate High",
                "High",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select>
              <option>Advisor</option>
            </select>
            <select>
              <option>Account Type</option>
            </select>
            <select>
              <option>Date Range</option>
            </select>
            <select>
              <option>All Time</option>
            </select>
            <button className="fsw-more">
              More Filters <Icon name="chevron-down" size={14} />
            </button>
            <button className="fsw-reset" onClick={reset}>
              <Icon name="rotate-ccw" size={14} />
              Reset
            </button>
            <span className="fsw-view-label"></span>
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

          <div className="fsw-table-wrap">
            <table className="fsw-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>
                  <th>Client ID</th>
                  <th>Client Name</th>
                  <th>Client Type</th>
                  <th>Primary Advisor</th>
                  <th>Account Type</th>
                  <th>AUM / Balance</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th>Next Review</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={c.id}>
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
                      <a>{c.id}</a>
                    </td>
                    <td>
                      <b>{c.name}</b>
                      <small>{c.kind}</small>
                    </td>
                    <td>{c.type}</td>
                    <td>
                      <div className="fsw-advisor">
                        <span className={`avatar a${i % 4}`}>
                          {c.advisor
                            .split(" ")
                            .map((x) => x[0])
                            .join("")}
                        </span>
                        <span>
                          <b>{c.advisor}</b>
                          <small>{c.advisorRole}</small>
                        </span>
                      </div>
                    </td>
                    <td>{c.account}</td>
                    <td className="money">{c.aum}</td>
                    <td>
                      <span
                        className={`risk ${c.risk.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {c.risk}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.activity}
                      <small>{c.time}</small>
                    </td>
                    <td>
                      {c.review}
                      <small className="due">{c.due}</small>
                    </td>
                    <td>
                      <div className="fsw-row-actions">
                        <button>
                          <Icon name="eye" size={15} />
                        </button>
                        <button>
                          <Icon name="pencil" size={15} />
                        </button>
                        <button>
                          <Icon name="ellipsis-vertical" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="fsw-pagination">
              <span>Showing 1 to {rows.length} of 2,356 clients</span>
              <div>
                <button>‹</button>
                {[1, 2, 3, 4, 5].map((x) => (
                  <button className={x === 1 ? "active" : ""} key={x}>
                    {x}
                  </button>
                ))}
                <span>...</span>
                <button>295</button>
                <button>›</button>
              </div>
              <select>
                <option>20 / page</option>
              </select>
            </div>
          </div>

          <section className="fsw-bottom-grid">
            <Donut
              title="Applications by Status"
              center="142"
              subtitle="Total Applications"
              rows={[
                ["In Progress", "42 (29.6%)"],
                ["Under Review", "38 (26.8%)"],
                ["Pending Documents", "24 (16.9%)"],
                ["Approved", "22 (15.5%)"],
                ["Declined", "16 (11.2%)"],
              ]}
            />
            <Donut
              title="Portfolio Allocation (AUM)"
              center="$48.75M"
              subtitle="Total AUM"
              rows={[
                ["Equities", "52.3% ($25.52M)"],
                ["Fixed Income", "24.1% ($11.75M)"],
                ["Cash & Cash Equivalents", "12.7% ($6.20M)"],
                ["Real Estate", "6.6% ($3.22M)"],
                ["Alternatives", "4.3% ($2.06M)"],
              ]}
            />
            <div className="fsw-panel">
              <div className="fsw-panel-head">
                <b>Recent Activity</b>
                <select>
                  <option>All Activity</option>
                </select>
              </div>
              <div className="fsw-activity">
                {[
                  [
                    "file-plus",
                    "New application submitted",
                    "APP-2025-1420 by Robert Johnson",
                    "10:24 AM",
                  ],
                  [
                    "wallet-cards",
                    "Account opened",
                    "ACC-2025-7891 for Emily Davis",
                    "09:15 AM",
                  ],
                  [
                    "file-check",
                    "Document uploaded",
                    "KYC Document for Michael Thompson",
                    "Yesterday",
                  ],
                  [
                    "badge-dollar-sign",
                    "Investment transaction",
                    "BUY - AAPL 100 Shares for CL-2025-2356",
                    "Yesterday",
                  ],
                  [
                    "calendar-check",
                    "Review completed",
                    "Annual Review for GreenLeaf Enterprises",
                    "May 18",
                  ],
                ].map((x) => (
                  <div key={x[1]}>
                    <span>
                      <Icon name={x[0]} />
                    </span>
                    <p>
                      <b>{x[1]}</b>
                      <small>{x[2]}</small>
                    </p>
                    <time>{x[3]}</time>
                  </div>
                ))}
              </div>
              <button className="fsw-link">
                View all activity <Icon name="arrow-right" />
              </button>
            </div>
            <div className="fsw-panel">
              <div className="fsw-panel-head">
                <b>Upcoming Reviews</b>
                <select>
                  <option>Next 30 Days</option>
                </select>
              </div>
              <div className="fsw-reviews">
                {clientsSeed.slice(0, 5).map((c, i) => (
                  <div key={c.id}>
                    <span className={`avatar a${i % 4}`}>
                      {c.name
                        .split(" ")
                        .map((x) => x[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <p>
                      <b>{c.name}</b>
                      <small>
                        {i % 2 ? "Quarterly Review" : "Annual Review"}
                      </small>
                    </p>
                    <time>
                      {c.review}
                      <small>{c.due}</small>
                    </time>
                  </div>
                ))}
              </div>
              <button className="fsw-link">
                View all reviews <Icon name="arrow-right" />
              </button>
            </div>
          </section>
        </>
      ) : (
        <div className="fsw-placeholder">
          <Icon
            name={tabs.find((x) => x[1] === tab)?.[0] || "landmark"}
            size={38}
          />
          <h2>{tab}</h2>
          <p>{tab} workspace is ready for the next implementation step.</p>
        </div>
      )}

      {showNew && (
        <div
          className="fsw-modal-backdrop"
          onMouseDown={() => setShowNew(false)}
        >
          <div className="fsw-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div>
              <h3>New Client</h3>
              <button onClick={() => setShowNew(false)}>
                <Icon name="x" />
              </button>
            </div>
            <label>
              Client name
              <input placeholder="Enter client name" />
            </label>
            <label>
              Client type
              <select>
                <option>Retail Client</option>
                <option>Corporate Client</option>
              </select>
            </label>
            <label>
              Primary advisor
              <select>
                <option>John Smith</option>
                <option>Sophia Martinez</option>
                <option>Liam Johnson</option>
              </select>
            </label>
            <div className="fsw-modal-actions">
              <button onClick={() => setShowNew(false)}>Cancel</button>
              <button className="primary" onClick={() => setShowNew(false)}>
                Create Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
