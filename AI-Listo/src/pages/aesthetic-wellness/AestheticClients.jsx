import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive, ArrowDownUp, CalendarDays, ChevronLeft, ChevronRight, Download, Filter,
  Mail, MoreVertical, Plus, RefreshCw, Search, Sparkles, UsersRound
} from "lucide-react";
import aestheticClientsApi from "../../api/aestheticClientsApi";
import "./AestheticClients.css";

const unwrap = (r) => r?.data ?? r;
const money = (n) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0
}).format(Number(n || 0));
const date = (v) => v ? new Date(v).toLocaleDateString("en-US", {
  month: "short", day: "numeric", year: "numeric"
}) : "—";
const initials = (n) => String(n || "?").split(/\s+/).slice(0, 2)
  .map((x) => x[0]).join("").toUpperCase();

export default function AestheticClients() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], page: 1, limit: 20, total: 0, pages: 1 });
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [list, totals] = await Promise.all([
        aestheticClientsApi.list({ search, status, sort, page, limit: 20 }),
        aestheticClientsApi.stats(),
      ]);
      setData((d) => ({ ...d, ...(unwrap(list) || {}) }));
      setStats(unwrap(totals) || {});
    } catch (e) {
      setError(e?.message || "Unable to load clients.");
    } finally { setLoading(false); }
  }, [search, status, sort, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const open = (id) => navigate(`/dashboard/aesthetic-wellness/clients/${id}`);
  const message = (c) =>
    navigate(`/dashboard/whatsapp?workspace_id=aesthetic-wellness&contact_id=${c.id}`);
  const book = (c) =>
    navigate(`/dashboard/calendar?workspace_id=aesthetic-wellness&action=new&contact_id=${c.id}`);

  const archive = async (c) => {
    if (!window.confirm(`Archive ${c.name}? Their history will be preserved.`)) return;
    try { await aestheticClientsApi.archive(c.id); setMenu(null); load(); }
    catch (e) { setError(e?.message || "Unable to archive client."); }
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget).entries());
      if (!body.name?.trim() || !body.email?.trim()) throw new Error("Name and email are required.");
      if (modal?.id) await aestheticClientsApi.update(modal.id, body);
      else await aestheticClientsApi.create(body);
      setModal(null); await load();
    } catch (e) { setError(e?.message || "Unable to save client."); }
    finally { setSaving(false); }
  };

  const cards = [
    ["Total Clients", stats.totalClients || 0, UsersRound],
    ["Appointments Today", stats.appointmentsToday || 0, CalendarDays],
    ["Ready to Rebook", stats.readyToRebook || 0, RefreshCw],
    ["Follow-Up Required", stats.followUpRequired || 0, Mail],
  ];

  const exportCsv = () => {
    const rows = [
      ["Client","Phone","Email","Treatment Interest","Provider","Last Appointment","Next Appointment","Total Spent","Status"],
      ...data.items.map(c => [c.name,c.phone,c.email,c.treatmentInterest,c.providerName,date(c.lastAppointment),date(c.nextAppointment),c.totalSpent,c.clientStatus])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv" }));
    a.download = "aesthetic-wellness-clients.csv"; a.click(); URL.revokeObjectURL(a.href);
  };


  const clientStatusLabel = (c) =>
    c.clientStatusLabel ||
    String(c.clientStatus || "active")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const shownFrom = data.total ? (data.page - 1) * data.limit + 1 : 0;
  const shownTo = Math.min(data.page * data.limit, data.total);

  const mobileContent = (
    <div className="awc-mobile">
      <section className="awc-mobile-overview">
        <div className="awc-mobile-hero">
          <Sparkles />
          <h1>Clients</h1>
          <p>Manage client relationships and rebooking</p>
        </div>

        <div className="awc-mobile-actions">
          <button className="awc-ref-btn primary" onClick={() => setModal({})}>
            <Plus /><strong>Add Client</strong><ChevronRight />
          </button>
          <button className="awc-ref-btn" onClick={exportCsv}>
            <Download /><strong>Export Clients</strong><ChevronRight />
          </button>
        </div>

        <h2>Client Overview</h2>

        <div className="awc-ref-stats">
          {[
            ["Total Clients", stats.totalClients || 0, UsersRound, "↑ 12%", "vs. last month", "up", "all"],
            ["Appointments Today", stats.appointmentsToday || 0, CalendarDays, "↑ 9%", "vs. last week", "up", null],
            ["Ready to Rebook", stats.readyToRebook || 0, RefreshCw, "↑ 18%", "vs. last month", "up", "ready_to_rebook"],
            ["Follow-Up Required", stats.followUpRequired || 0, Mail, "↓ 6%", "vs. last week", "down", "follow_up"],
          ].map(([label, value, Icon, trend, compare, direction, target]) => (
            <button className="awc-ref-stat" key={label}
              onClick={() => {
                if (label === "Appointments Today") {
                  navigate("/dashboard/calendar?workspace_id=aesthetic-wellness");
                } else if (target) {
                  setStatus(target); setPage(1);
                  document.querySelector(".awc-mobile-directory")?.scrollIntoView({ behavior: "smooth" });
                }
              }}>
              <Icon />
              <span className="awc-ref-stat-value"><small>{label}</small><b>{value}</b></span>
              <span className={`awc-ref-trend ${direction}`}><b>{trend}</b><small>{compare}</small></span>
              <ChevronRight />
            </button>
          ))}
        </div>

        <div className="awc-ref-summary">
          <Sparkles />
          <span>{stats.totalClients || data.total || 0} clients across your active clinic workspace.</span>
        </div>

        <button className="awc-ref-btn awc-go-directory"
          onClick={() => document.querySelector(".awc-mobile-directory")?.scrollIntoView({ behavior: "smooth" })}>
          <Search /><strong>Continue to Client Directory</strong><ChevronRight />
        </button>
      </section>

      <section className="awc-mobile-directory">
        <header className="awc-ref-directory-head">
          <h1>Client Directory</h1>
          <p>{data.total || 0} clients</p>
        </header>

        <label className="awc-ref-search">
          <Search />
          <input value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, or email" />
        </label>

        <div className="awc-ref-select-row">
          <UsersRound />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="ready_to_rebook">Ready to Rebook</option>
            <option value="follow_up">Follow-Up</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronRight />
        </div>

        <button className="awc-ref-btn awc-ref-compact">
          <Filter /><strong>Filters</strong><ChevronRight />
        </button>

        <div className="awc-ref-select-row orange">
          <ArrowDownUp />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name:asc">Sort Clients</option>
            <option value="name:desc">Name Z–A</option>
            <option value="spent:desc">Total spent</option>
            <option value="next:asc">Next appointment</option>
            <option value="updated:desc">Recently updated</option>
          </select>
          <ChevronRight />
        </div>

        {error && <div className="awc-error">{error}<button onClick={load}>Retry</button></div>}

        <div className="awc-ref-list-head">
          <h2>Clients</h2>
          <span>Showing {shownFrom}–{shownTo} of {data.total}</span>
        </div>

        <div className="awc-ref-client-list">
          {loading ? <div className="awc-state">Loading clients…</div> :
          !data.items.length ? <div className="awc-state"><UsersRound /><h3>No clients found</h3>
            <p>Adjust your filters or add a clinic client.</p></div> :
          data.items.map((c) => (
            <button className="awc-ref-client" key={c.id} onClick={() => open(c.id)}>
              <span className="awc-ref-avatar">{initials(c.name)}</span>
              <span className="awc-ref-client-name"><b>{c.name}</b><small>{c.phone || c.email || "—"}</small></span>
              <span className={`awc-status ${c.clientStatus || "active"}`}>{clientStatusLabel(c)}</span>
              <ChevronRight />
            </button>
          ))}
        </div>

        <button className="awc-ref-btn awc-ref-load"
          disabled={page >= data.pages}
          onClick={() => setPage((p) => Math.min(data.pages, p + 1))}>
          <RefreshCw /><strong>{page >= data.pages ? "All Clients Loaded" : "Load More Clients"}</strong><ChevronRight />
        </button>
        <div className="awc-ref-shown">{shownTo} of {data.total} clients shown</div>
      </section>
    </div>
  );

  return <div className="awc-page">
    <div className="awc-desktop">
    <div className="awc-head">
      <div><h1><Sparkles /> Clients</h1><p>Manage client relationships, treatments, appointments, and rebooking.</p></div>
      <div className="awc-head-actions">
        <button className="awc-btn" onClick={exportCsv}><Download /> Export Clients</button>
        <button className="awc-btn primary" onClick={() => setModal({})}><Plus /> Add Client</button>
      </div>
    </div>

    <div className="awc-stats">{cards.map(([title, value, Icon]) =>
      <div className="awc-stat" key={title}><span className="awc-stat-icon"><Icon /></span>
        <div><small>{title}</small><strong>{value}</strong></div></div>)}
    </div>

    <div className="awc-tools">
      <label className="awc-search"><Search /><input value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search clients by name, phone, or email..." /></label>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
        <option value="all">All Clients</option><option value="active">Active</option>
        <option value="ready_to_rebook">Ready to Rebook</option><option value="follow_up">Follow-Up</option>
        <option value="inactive">Inactive</option>
      </select>
      <button className="awc-btn"><Filter /> Filters</button>
      <select value={sort} onChange={e => setSort(e.target.value)}>
        <option value="name:asc">Name A–Z</option><option value="name:desc">Name Z–A</option>
        <option value="spent:desc">Total spent</option><option value="next:asc">Next appointment</option>
        <option value="updated:desc">Recently updated</option>
      </select>
    </div>

    {error && <div className="awc-error">{error}<button onClick={load}>Retry</button></div>}

    <div className="awc-table-wrap">
      {loading ? <div className="awc-state">Loading clients…</div> :
      !data.items.length ? <div className="awc-state"><UsersRound /><h3>No clients found</h3>
        <p>Adjust your filters or add a clinic client.</p></div> :
      <table className="awc-table"><thead><tr>
        <th>Client</th><th>Treatment Interest</th><th>Assigned Provider</th><th>Last Appointment</th>
        <th>Next Appointment</th><th>Rebooking</th><th>Total Spent</th><th>Status</th><th />
      </tr></thead><tbody>{data.items.map(c =>
        <tr key={c.id} onClick={() => open(c.id)}>
          <td><div className="awc-client"><span>{initials(c.name)}</span><div><b>{c.name}</b>
            <small>{c.phone || "—"}</small><small>{c.email || "—"}</small></div></div></td>
          <td>{c.treatmentInterest || "—"}</td><td>{c.providerName || "Unassigned"}</td>
          <td>{date(c.lastAppointment)}</td><td>{date(c.nextAppointment)}</td>
          <td className={c.rebookingDue ? "yes" : "no"}>{c.rebookingDue ? "Yes" : "No"}</td>
          <td>{money(c.totalSpent)}</td>
          <td><span className={`awc-status ${c.clientStatus || "active"}`}>
            {c.clientStatusLabel || c.clientStatus || "Active"}</span></td>
          <td className="awc-menu-cell" onClick={e => e.stopPropagation()}>
            <button className="icon" onClick={() => setMenu(menu === c.id ? null : c.id)}><MoreVertical /></button>
            {menu === c.id && <div className="awc-menu">
              <button onClick={() => open(c.id)}>View Profile</button>
              <button onClick={() => setModal(c)}>Edit</button>
              <button onClick={() => message(c)}>Message</button>
              <button onClick={() => book(c)}>Book Appointment</button>
              <button className="danger" onClick={() => archive(c)}><Archive /> Archive</button>
            </div>}
          </td>
        </tr>)}</tbody></table>}
    </div>

    <div className="awc-pager"><span>Showing {data.total ? (data.page - 1) * data.limit + 1 : 0}–
      {Math.min(data.page * data.limit, data.total)} of {data.total} clients</span>
      <div><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft /></button>
        <button className="active">{page}</button>
        <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight /></button></div>
    </div>

    </div>

    {mobileContent}

    {modal && <div className="awc-overlay"><form className="awc-modal" onSubmit={save}>
      <h2>{modal.id ? "Edit Client" : "Add Client"}</h2>
      <div className="awc-form-grid">
        <label>Full name *<input name="name" defaultValue={modal.name || ""} /></label>
        <label>Email *<input name="email" type="email" defaultValue={modal.email || ""} /></label>
        <label>Phone<input name="phone" defaultValue={modal.phone || ""} /></label>
        <label>Treatment interest<input name="treatmentInterest" defaultValue={modal.treatmentInterest || ""} /></label>
        <label>Assigned provider<select name="providerId" defaultValue={modal.providerId || ""}>
          <option value="">Unassigned</option>{(stats.providers || []).map(p =>
          <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Status<select name="status" defaultValue={modal.clientStatus || "active"}>
          <option value="active">Active</option><option value="follow_up">Follow-Up</option>
          <option value="inactive">Inactive</option></select></label>
      </div>
      <div className="awc-modal-actions"><button type="button" className="awc-btn" onClick={() => setModal(null)}>Cancel</button>
        <button className="awc-btn primary" disabled={saving}>{saving ? "Saving…" : "Save Client"}</button></div>
    </form></div>}
  </div>;
}
