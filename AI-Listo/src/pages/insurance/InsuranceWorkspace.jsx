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
  ShieldCheck,
  CalendarClock,
  ClipboardList,
  BadgeDollarSign,
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  Table2,
  List,
  CalendarDays,
  CircleCheck,
  FileCheck2,
  ReceiptText,
  Umbrella,
  ChevronDown,
} from "lucide-react";
import "./InsuranceWorkspace.css";

const POLICIES = [
  {
    id: "POL-2025-1248",
    holder: "TechFlow Solutions",
    contact: "Olivia Bennett",
    type: "Commercial General Liability",
    carrier: "Travelers Insurance",
    carrierMark: "☂",
    period: "Jan 15, 2025 - Jan 15, 2026",
    premium: 4250,
    status: "Active",
    billing: "Jan 15, 2026",
    billingNote: "in 243 days",
    agent: "John Smith",
  },
  {
    id: "POL-2025-1247",
    holder: "Bright Marketing",
    contact: "Ethan Walker",
    type: "Professional Liability",
    carrier: "Hiscox",
    carrierMark: "H",
    period: "Feb 01, 2025 - Feb 01, 2026",
    premium: 2180,
    status: "Active",
    billing: "Feb 01, 2026",
    billingNote: "in 260 days",
    agent: "Sophia Martinez",
  },
  {
    id: "POL-2025-1246",
    holder: "GreenLeaf Realty",
    contact: "Sophia Martinez",
    type: "Property Insurance",
    carrier: "State Farm",
    carrierMark: "●",
    period: "Apr 10, 2025 - Apr 10, 2026",
    premium: 6750,
    status: "Active",
    billing: "Apr 10, 2026",
    billingNote: "in 328 days",
    agent: "Liam Johnson",
  },
  {
    id: "POL-2025-1245",
    holder: "Summit Enterprises",
    contact: "Liam Johnson",
    type: "Workers Compensation",
    carrier: "The Hartford",
    carrierMark: "H",
    period: "Mar 05, 2025 - Mar 05, 2026",
    premium: 3920,
    status: "Active",
    billing: "Mar 05, 2026",
    billingNote: "in 292 days",
    agent: "John Smith",
  },
  {
    id: "POL-2025-1244",
    holder: "Innovate Labs",
    contact: "Noah Davis",
    type: "Cyber Liability",
    carrier: "CNA",
    carrierMark: "CNA",
    period: "May 01, 2025 - May 01, 2026",
    premium: 5600,
    status: "Pending",
    billing: "-",
    billingNote: "",
    agent: "Olivia Bennett",
  },
  {
    id: "POL-2025-1243",
    holder: "NextGen Industries",
    contact: "Ava Thompson",
    type: "Commercial Auto",
    carrier: "Progressive",
    carrierMark: "P",
    period: "Feb 20, 2025 - Feb 20, 2026",
    premium: 3150,
    status: "Active",
    billing: "Feb 20, 2026",
    billingNote: "in 279 days",
    agent: "Sophia Martinez",
  },
  {
    id: "POL-2025-1242",
    holder: "Pulse Technologies",
    contact: "Mason Clark",
    type: "Directors & Officers",
    carrier: "Chubb",
    carrierMark: "C",
    period: "Jan 30, 2025 - Jan 30, 2026",
    premium: 4780,
    status: "Active",
    billing: "Jan 30, 2026",
    billingNote: "in 258 days",
    agent: "Liam Johnson",
  },
  {
    id: "POL-2025-1241",
    holder: "BlueStone Architects",
    contact: "Isabella White",
    type: "Umbrella Liability",
    carrier: "AIG",
    carrierMark: "AIG",
    period: "Mar 12, 2025 - Mar 12, 2026",
    premium: 2850,
    status: "Cancelled",
    billing: "-",
    billingNote: "",
    agent: "John Smith",
  },
];

const INSURANCE_STATS = [
  ["Active Policies", "1,248", "$3,245,750", "Total Premium", "15%", ShieldCheck, "blue"],
  ["Policies Expiring (30 Days)", "87", "$221,840", "Premium at Risk", "8%", CalendarClock, "amber"],
  ["Open Claims", "56", "$174,520", "Total Claimed", "12%", ClipboardList, "purple"],
  ["Claims Paid (This Month)", "32", "$98,650", "Paid Amount", "18%", BadgeDollarSign, "green"],
  ["Commissions Due", "$28,430", "12 Pending", "", "14%", ShoppingCart, "pink"],
  ["Renewal Rate", "76.8%", "This Month", "", "6.3%", TrendingUp, "mint"],
];

const POLICY_TYPES = [
  ["Commercial General Liability", "32% (399)", "blue"],
  ["Professional Liability", "18% (224)", "royal"],
  ["Property Insurance", "16% (199)", "green"],
  ["Workers Compensation", "12% (150)", "mint"],
  ["Cyber Liability", "8% (100)", "purple"],
  ["Other", "14% (176)", "gray"],
];

const ACTIVITY = [
  ["New policy created", "POL-2025-1248 for TechFlow Solutions", "10:24 AM", ShieldCheck],
  ["Claim #CLM-2025-1042 updated to In Review", "GreenLeaf Realty", "09:15 AM", ClipboardList],
  ["Payment received", "POL-2025-1246 from GreenLeaf Realty", "Yesterday", ReceiptText],
  ["Policy renewal sent", "POL-2025-1243 to NextGen Industries", "Yesterday", CalendarClock],
  ["Claim #CLM-2025-1041 approved", "Bright Marketing", "May 18", CircleCheck],
];

const RENEWALS = [
  ["TechFlow Solutions", "Commercial General Liability", "POL-2025-1248", "Jan 15, 2026", "$4,250.00", "in 12 days"],
  ["Bright Marketing", "Professional Liability", "POL-2025-1247", "Feb 01, 2026", "$2,180.00", "in 29 days"],
  ["GreenLeaf Realty", "Property Insurance", "POL-2025-1246", "Feb 10, 2026", "$6,750.00", "in 38 days"],
  ["Summit Enterprises", "Workers Compensation", "POL-2025-1245", "Mar 05, 2026", "$3,920.00", "in 61 days"],
];

export default function InsuranceWorkspace() {
  const [activeTab, setActiveTab] = useState("Policies");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return POLICIES;
    return POLICIES.filter((item) =>
      [
        item.id,
        item.holder,
        item.contact,
        item.type,
        item.carrier,
        item.agent,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [search]);

  return (
    <div className="insurance-ws">
      <div className="insurance-ws-header">
        <div>
          <h1>Insurance Workspace</h1>
          <p>Manage your entire insurance lifecycle from quote to claim and renewal.</p>
        </div>

        <div className="insurance-ws-header-actions">
          <label className="insurance-ws-global-search">
            <Search size={15} />
            <input placeholder="Search policies, claims, clients, documents..." />
            <kbd>⌘ K</kbd>
          </label>
          <button className="insurance-ws-new">
            <Plus size={15} />
            New
          </button>
        </div>
      </div>

      <div className="insurance-ws-stat-grid">
        {INSURANCE_STATS.map(
          ([label, value, sub1, sub2, change, Icon, tone]) => (
            <div className="insurance-ws-stat-card" key={label}>
              <div className={`insurance-ws-stat-icon ${tone}`}>
                <Icon size={18} />
              </div>
              <span>{label}</span>
              <strong>{value}</strong>
              {sub1 && <small>{sub1}</small>}
              {sub2 && <small>{sub2}</small>}
              <em>↑ {change} <b>vs last month</b></em>
            </div>
          ),
        )}
      </div>

      <nav className="insurance-ws-tabs">
        {[
          "Overview",
          "Policies",
          "Claims",
          "Quotes",
          "Renewals",
          "Carriers",
          "Commissions",
          "Documents",
          "Reports",
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

      <section className="insurance-ws-policies">
        <div className="insurance-ws-section-head">
          <div>
            <h2>{activeTab}</h2>
            <p>
              {activeTab === "Policies"
                ? "View and manage all insurance policies"
                : `${activeTab} workspace is ready for the next implementation step.`}
            </p>
          </div>

          <div className="insurance-ws-section-actions">
            <button><Upload size={14} /> Import</button>
            <button><Download size={14} /> Export</button>
            <button><Settings2 size={14} /></button>
            <button className="primary"><Plus size={14} /> New Policy</button>
          </div>
        </div>

        <div className="insurance-ws-filters">
          <label>
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies..."
            />
          </label>

          {[
            "Status · All Statuses",
            "Policy Type · All Types",
            "Carrier · All Carriers",
            "Agent · All Agents",
            "Date Range · All Time",
            "More Filters",
          ].map((item) => (
            <button key={item}>{item}<ChevronDown size={14} /></button>
          ))}

          <button className="reset"><RotateCcw size={13} /> Reset</button>

          <span>View</span>
          <button><Table2 size={13} /> Table</button>
          <button><List size={13} /></button>
          <button><CalendarDays size={13} /></button>
        </div>

        <div className="insurance-ws-table-wrap">
          <table className="insurance-ws-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Policy #</th>
                <th>Policyholder</th>
                <th>Policy Type</th>
                <th>Carrier</th>
                <th>Coverage Period</th>
                <th>Premium</th>
                <th>Status</th>
                <th>Next Billing</th>
                <th>Agent</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((policy) => (
                <tr key={policy.id}>
                  <td><input type="checkbox" /></td>
                  <td className="policy-id">{policy.id}</td>

                  <td>
                    <div className="insurance-ws-two-line">
                      <strong>{policy.holder}</strong>
                      <span>{policy.contact}</span>
                    </div>
                  </td>

                  <td>{policy.type}</td>

                  <td>
                    <div className="insurance-ws-carrier">
                      <span>{policy.carrierMark}</span>
                      <strong>{policy.carrier}</strong>
                    </div>
                  </td>

                  <td>{policy.period}</td>

                  <td>
                    <div className="insurance-ws-two-line premium">
                      <strong>
                        ${policy.premium.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                      <span>Annual</span>
                    </div>
                  </td>

                  <td>
                    <span className={`insurance-ws-status ${policy.status.toLowerCase()}`}>
                      {policy.status}
                    </span>
                  </td>

                  <td>
                    <div className="insurance-ws-two-line billing">
                      <strong>{policy.billing}</strong>
                      {policy.billingNote && <span>{policy.billingNote}</span>}
                    </div>
                  </td>

                  <td>
                    <div className="insurance-ws-agent">
                      <span>
                        {policy.agent
                          .split(" ")
                          .map((x) => x[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      {policy.agent}
                    </div>
                  </td>

                  <td>
                    <div className="insurance-ws-row-actions">
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

        <div className="insurance-ws-pagination">
          <span>Showing 1 to 8 of 1,248 policies</span>
          <div>
            <button><ChevronLeft size={14} /></button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>4</button>
            <button>5</button>
            <span>...</span>
            <button>156</button>
            <button><ChevronRight size={14} /></button>
          </div>
          <select defaultValue="20">
            <option value="20">20 / page</option>
          </select>
        </div>
      </section>

      <div className="insurance-ws-bottom">
        <div className="insurance-ws-bottom-card type-card">
          <div className="insurance-ws-card-head">
            <strong>Policies by Type</strong>
            <span>This Month⌄</span>
          </div>

          <div className="insurance-ws-type-layout">
            <div className="insurance-ws-donut">
              <b>1,248<small>Total Policies</small></b>
            </div>

            <div className="insurance-ws-legend">
              {POLICY_TYPES.map(([label, value, tone]) => (
                <p key={label}>
                  <i className={tone} />
                  <span>{label}</span>
                  <strong>{value}</strong>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="insurance-ws-bottom-card">
          <div className="insurance-ws-card-head">
            <strong>Recent Activity</strong>
            <span>All Activity⌄</span>
          </div>

          <div className="insurance-ws-activity-list">
            {ACTIVITY.map(([title, sub, time, Icon]) => (
              <div className="insurance-ws-activity-row" key={title}>
                <span><Icon size={13} /></span>
                <div>
                  <strong>{title}</strong>
                  <small>{sub}</small>
                </div>
                <time>{time}</time>
              </div>
            ))}
          </div>

          <button className="insurance-ws-link-btn">View all activity →</button>
        </div>

        <div className="insurance-ws-bottom-card">
          <div className="insurance-ws-card-head">
            <strong>Upcoming Renewals</strong>
            <span>Next 30 Days⌄</span>
          </div>

          <div className="insurance-ws-renewals">
            {RENEWALS.map(([client, type, id, date, premium, days]) => (
              <div key={id}>
                <Umbrella size={13} />
                <div>
                  <strong>{client}</strong>
                  <small>{type}</small>
                </div>
                <span>{id}</span>
                <span>{date}</span>
                <div className="amount">
                  <strong>{premium}</strong>
                  <small>{days}</small>
                </div>
              </div>
            ))}
          </div>

          <button className="insurance-ws-link-btn">View all renewals →</button>
        </div>
      </div>
    </div>
  );
}
