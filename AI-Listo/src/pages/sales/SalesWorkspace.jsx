import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Bell,
  Settings2,
  Download,
  Upload,
  Eye,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileText,
  ClipboardList,
  PackageCheck,
  BadgeDollarSign,
  ShoppingCart,
  Percent,
  Users,
  RotateCcw,
  Table2,
  List,
  CalendarDays,
  CircleCheck,
  Clock3,
  ReceiptText,
  ChevronDown,
} from "lucide-react";
import "./SalesWorkspace.css";

const QUOTES = [
  {
    id: "Q-2025-1042",
    customer: "TechFlow Solutions",
    segment: "Enterprise",
    contact: "Olivia Bennett",
    role: "CTO",
    deal: "Website Redesign",
    stage: "Proposal Sent",
    value: 8750,
    status: "Sent",
    valid: "May 30, 2025",
    validNote: "5 days left",
    owner: "John Smith",
    created: "May 20, 2025",
    createdTime: "10:24 AM",
  },
  {
    id: "Q-2025-1041",
    customer: "Bright Marketing",
    segment: "SMB",
    contact: "Ethan Walker",
    role: "Marketing Director",
    deal: "Brand Campaign",
    stage: "Negotiation",
    value: 14200,
    status: "Viewed",
    valid: "May 28, 2025",
    validNote: "3 days left",
    owner: "Sophia Martinez",
    created: "May 19, 2025",
    createdTime: "03:15 PM",
  },
  {
    id: "Q-2025-1040",
    customer: "GreenLeaf Realty",
    segment: "Enterprise",
    contact: "Sophia Martinez",
    role: "Operations Manager",
    deal: "CRM Implementation",
    stage: "Proposal Sent",
    value: 12500,
    status: "Sent",
    valid: "May 25, 2025",
    validNote: "0 days left",
    owner: "Liam Johnson",
    created: "May 19, 2025",
    createdTime: "11:45 AM",
  },
  {
    id: "Q-2025-1039",
    customer: "Summit Enterprises",
    segment: "Enterprise",
    contact: "Liam Johnson",
    role: "IT Director",
    deal: "Software Licenses",
    stage: "Qualification",
    value: 6300,
    status: "Draft",
    valid: "May 31, 2025",
    validNote: "6 days left",
    owner: "John Smith",
    created: "May 18, 2025",
    createdTime: "09:20 AM",
  },
  {
    id: "Q-2025-1038",
    customer: "Innovate Labs",
    segment: "SMB",
    contact: "Noah Davis",
    role: "Founder",
    deal: "Mobile App",
    stage: "Negotiation",
    value: 20900,
    status: "Viewed",
    valid: "May 29, 2025",
    validNote: "4 days left",
    owner: "Olivia Bennett",
    created: "May 18, 2025",
    createdTime: "08:50 AM",
  },
  {
    id: "Q-2025-1037",
    customer: "NextGen Industries",
    segment: "Enterprise",
    contact: "Ava Thompson",
    role: "COO",
    deal: "System Integration",
    stage: "Proposal Sent",
    value: 18750,
    status: "Sent",
    valid: "Jun 02, 2025",
    validNote: "8 days left",
    owner: "Sophia Martinez",
    created: "May 17, 2025",
    createdTime: "02:30 PM",
  },
  {
    id: "Q-2025-1036",
    customer: "Pulse Technologies",
    segment: "SMB",
    contact: "Mason Clark",
    role: "Sales Manager",
    deal: "Annual Subscription",
    stage: "Qualification",
    value: 3450,
    status: "Draft",
    valid: "May 26, 2025",
    validNote: "1 day left",
    owner: "Liam Johnson",
    created: "May 17, 2025",
    createdTime: "10:15 AM",
  },
  {
    id: "Q-2025-1035",
    customer: "BlueStone Architects",
    segment: "SMB",
    contact: "Isabella White",
    role: "Project Manager",
    deal: "Design Software",
    stage: "Proposal Sent",
    value: 4900,
    status: "Sent",
    valid: "May 27, 2025",
    validNote: "2 days left",
    owner: "John Smith",
    created: "May 16, 2025",
    createdTime: "04:05 PM",
  },
];

const SALES_STATS = [
  ["Open Quotes", "$124,750", "28 Quotes", "18%", FileText, "blue"],
  ["Open Proposals", "$98,420", "19 Proposals", "14%", ClipboardList, "purple"],
  ["Orders This Month", "$265,480", "32 Orders", "24%", PackageCheck, "green"],
  [
    "Outstanding Invoices",
    "$87,430",
    "16 Invoices",
    "12%",
    BadgeDollarSign,
    "amber",
  ],
  ["Commissions Due", "$21,650", "8 Pending", "15%", ShoppingCart, "cyan"],
  ["Conversion Rate", "24.6%", "This Month", "6%", Percent, "pink"],
];

const PIPELINE = [
  ["Qualification", "$45,250", "12 Deals", "blue"],
  ["Proposal Sent", "$78,600", "18 Deals", "green"],
  ["Negotiation", "$56,300", "9 Deals", "amber"],
  ["Order", "$128,760", "16 Deals", "purple"],
  ["Won", "$96,400", "14 Deals", "mint"],
];

const ACTIVITY = [
  [
    "New quote created",
    "Q-2025-1042 for TechFlow Solutions",
    "10:24 AM",
    ShoppingCart,
  ],
  ["Quote viewed", "Q-2025-1041 by Ethan Walker", "09:15 AM", Eye],
  [
    "Order confirmed",
    "SO-2025-1540 for GreenLeaf Realty",
    "Yesterday",
    PackageCheck,
  ],
  [
    "Invoice paid",
    "INV-2025-2156 from Bright Marketing",
    "Yesterday",
    ReceiptText,
  ],
];

const REPS = [
  ["John Smith", "$42,850", "14 Orders"],
  ["Sophia Martinez", "$31,200", "11 Orders"],
  ["Liam Johnson", "$26,540", "9 Orders"],
  ["Olivia Bennett", "$18,910", "6 Orders"],
  ["Ethan Walker", "$9,260", "4 Orders"],
];

export default function SalesWorkspace() {
  const [activeTab, setActiveTab] = useState("Quotes");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return QUOTES;
    return QUOTES.filter((item) =>
      [item.id, item.customer, item.contact, item.deal, item.owner]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [search]);

  return (
    <div className="sales-ws">
      <div className="sales-ws-header">
        <div>
          <h1>Sales Workspace</h1>
          <p>Manage your entire sales cycle from quote to commission.</p>
        </div>

        <div className="sales-ws-header-actions">
          <label className="sales-ws-global-search">
            <Search size={15} />
            <input placeholder="Search anything..." />
            <kbd>⌘ K</kbd>
          </label>
          <button className="sales-ws-quick-create">
            <Plus size={15} />
            Quick Create
          </button>
        </div>
      </div>

      <div className="sales-ws-stat-grid">
        {SALES_STATS.map(([label, value, sub, change, Icon, tone]) => (
          <div className="sales-ws-stat-card" key={label}>
            <div className={`sales-ws-stat-icon ${tone}`}>
              <Icon size={18} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{sub}</small>
            <em>
              ↑ {change} <b>vs last month</b>
            </em>
          </div>
        ))}
      </div>

      <nav className="sales-ws-tabs">
        {[
          "Overview",
          "Customers",
          "Quotes",
          "Proposals",
          "Orders",
          "Contracts",
          "Invoices",
          "Commissions",
          "Returns",
        ].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="sales-ws-quotes">
        <div className="sales-ws-section-head">
          <div>
            <h2>{activeTab}</h2>
            <p>
              {activeTab === "Quotes"
                ? "Create, manage and track all your quotes"
                : `${activeTab} workspace is ready for the next implementation step.`}
            </p>
          </div>

          <div className="sales-ws-section-actions">
            <button>
              <Upload size={14} /> Import
            </button>
            <button>
              <Download size={14} /> Export
            </button>
            <button>
              <Settings2 size={14} />
            </button>
            <button className="primary">
              <Plus size={14} /> New Quote
            </button>
          </div>
        </div>

        <div className="sales-ws-filters">
          <label>
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quotes..."
            />
          </label>

          {["Status", "Owner", "Date Range", "Pipeline", "More Filters"].map(
            (item) => (
              <button key={item}>{item}<ChevronDown size={14}/></button>
            ),
          )}

          <button className="reset">
            <RotateCcw size={13} /> Reset
          </button>

          <span>View</span>
          <button>
            <Table2 size={13} /> Table
          </button>
          <button>
            <List size={13} />
          </button>
          <button>
            <CalendarDays size={13} />
          </button>
        </div>

        <div className="sales-ws-table-wrap">
          <table className="sales-ws-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>Quote #</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Pipeline / Deal</th>
                <th>Value</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th>Owner</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td className="quote-id">{quote.id}</td>

                  <td>
                    <div className="sales-ws-customer">
                      <strong>{quote.customer}</strong>
                      <span>{quote.segment}</span>
                    </div>
                  </td>

                  <td>
                    <div className="sales-ws-two-line">
                      <strong>{quote.contact}</strong>
                      <span>{quote.role}</span>
                    </div>
                  </td>

                  <td>
                    <div className="sales-ws-two-line deal">
                      <strong>{quote.deal}</strong>
                      <span>{quote.stage}</span>
                    </div>
                  </td>

                  <td className="sales-ws-money">
                    $
                    {quote.value.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td>
                    <span
                      className={`sales-ws-status ${quote.status.toLowerCase()}`}
                    >
                      {quote.status}
                    </span>
                  </td>

                  <td>
                    <div className="sales-ws-valid">
                      <strong>{quote.valid}</strong>
                      <span
                        className={
                          quote.validNote.startsWith("0") ? "danger" : ""
                        }
                      >
                        {quote.validNote}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="sales-ws-owner">
                      <span>
                        {quote.owner
                          .split(" ")
                          .map((x) => x[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      {quote.owner}
                    </div>
                  </td>

                  <td>
                    <div className="sales-ws-two-line">
                      <strong>{quote.created}</strong>
                      <span>{quote.createdTime}</span>
                    </div>
                  </td>

                  <td>
                    <div className="sales-ws-row-actions">
                      <Eye size={14} />
                      <Pencil size={14} />
                      <MoreVertical size={14} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sales-ws-pagination">
          <span>Showing 1 to 8 of 28 quotes</span>
          <div>
            <button>
              <ChevronLeft size={14} />
            </button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>4</button>
            <button>
              <ChevronRight size={14} />
            </button>
          </div>
          <select defaultValue="20">
            <option value="20">20 / page</option>
          </select>
        </div>
      </section>

      <div className="sales-ws-bottom">
        <div className="sales-ws-bottom-card pipeline">
          <div className="sales-ws-card-head">
            <strong>Sales Pipeline Summary</strong>
            <span>This Month⌄</span>
          </div>

          <div className="sales-ws-pipeline">
            {PIPELINE.map(([label, value, count, tone]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{count}</small>
                <i className={tone} />
              </div>
            ))}
          </div>

          <div className="sales-ws-pipeline-total">
            Total Pipeline Value: <strong>$405,310</strong>
          </div>
        </div>

        <div className="sales-ws-bottom-card">
          <div className="sales-ws-card-head">
            <strong>Recent Activity</strong>
            <span>All Activity⌄</span>
          </div>

          <div className="sales-ws-activity-list">
            {ACTIVITY.map(([title, sub, time, Icon]) => (
              <div className="sales-ws-activity-row" key={title}>
                <span>
                  <Icon size={13} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{sub}</small>
                </div>
                <time>{time}</time>
              </div>
            ))}
          </div>

          <button className="sales-ws-link-btn">View all activity →</button>
        </div>

        <div className="sales-ws-bottom-card">
          <div className="sales-ws-card-head">
            <strong>Top Performing Reps</strong>
            <span>This Month⌄</span>
          </div>

          <div className="sales-ws-reps">
            {REPS.map(([name, amount, orders], index) => (
              <div key={name}>
                <b>{index + 1}</b>
                <span className="avatar">
                  {name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <strong>{name}</strong>
                <span>{amount}</span>
                <small>{orders}</small>
              </div>
            ))}
          </div>

          <button className="sales-ws-link-btn">View full leaderboard →</button>
        </div>
      </div>
    </div>
  );
}
