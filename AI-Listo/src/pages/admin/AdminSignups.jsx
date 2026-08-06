import { useState, useEffect, useCallback } from "react";
import {
  getAdminSignups,
  getAdminCustomers,
  getAdminSignupDetail,
  exportSignupsCsv,
} from "../../api/platformApi";
import "../platform/platform.css";
import "./admin.css";

const PAGE_SIZE = 50;

function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch (_e) {
    return String(v);
  }
}

function StatusPill({ value }) {
  const v = String(value || "").toLowerCase();
  const color =
    v === "paid" || v === "active"
      ? "#16a34a"
      : v === "abandoned"
        ? "#dc2626"
        : v === "trial"
          ? "#2563eb"
          : "#64748b";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        background: color,
      }}
    >
      {value || "—"}
    </span>
  );
}

function DetailPanel({ id, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminSignupDetail(id)
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const u = data?.user;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          height: "100%",
          background: "#fff",
          overflowY: "auto",
          padding: 24,
          boxShadow: "-8px 0 24px rgba(15,23,42,0.15)",
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Sign-up detail</h2>
          <button type="button" onClick={onClose} style={{ cursor: "pointer" }}>
            Close
          </button>
        </div>

        {loading && <p>Loading…</p>}
        {!loading && !u && <p>Not found.</p>}
        {!loading && u && (
          <>
            <table style={{ width: "100%", marginTop: 16, fontSize: 14 }}>
              <tbody>
                {[
                  ["Name", u.name],
                  ["Email", u.email],
                  ["Phone", u.phone],
                  ["Language", u.language],
                  ["Offer", u.offer_used],
                  ["Checkout status", u.checkout_status],
                  ["Payment status", u.payment_status],
                  ["Plan", u.selected_plan || u.plan],
                  ["Landing page", u.landing_page],
                  ["UTM source", u.utm_source],
                  ["UTM medium", u.utm_medium],
                  ["UTM campaign", u.utm_campaign],
                  ["UTM term", u.utm_term],
                  ["UTM content", u.utm_content],
                  ["Google Click ID", u.gclid],
                  ["Abandoned stage", u.abandoned_stage],
                  ["Registered", fmtDate(u.registered_at || u.created_at)],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td
                      style={{
                        padding: "6px 8px",
                        color: "#64748b",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {k}
                    </td>
                    <td style={{ padding: "6px 8px", wordBreak: "break-all" }}>
                      {v == null || v === "" ? "—" : String(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop: 24, fontSize: 15 }}>Email history</h3>
            {(!data.emails || !data.emails.length) && (
              <p style={{ color: "#64748b" }}>No emails yet.</p>
            )}
            {data.emails && data.emails.length > 0 && (
              <table style={{ width: "100%", fontSize: 13, marginTop: 8 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "6px 8px" }}>Template</th>
                    <th style={{ padding: "6px 8px" }}>Lang</th>
                    <th style={{ padding: "6px 8px" }}>Status</th>
                    <th style={{ padding: "6px 8px" }}>Scheduled</th>
                    <th style={{ padding: "6px 8px" }}>Sent</th>
                    <th style={{ padding: "6px 8px" }}>Delivered</th>
                    <th style={{ padding: "6px 8px" }}>Opened</th>
                    <th style={{ padding: "6px 8px" }}>Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {data.emails.map((e, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "6px 8px" }}>{e.template}</td>
                      <td style={{ padding: "6px 8px" }}>{e.language}</td>
                      <td style={{ padding: "6px 8px" }}>{e.status}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {fmtDate(e.scheduled_at)}
                      </td>
                      <td style={{ padding: "6px 8px" }}>{fmtDate(e.sent_at)}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {fmtDate(e.delivered_at)}
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        {fmtDate(e.opened_at)}
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        {fmtDate(e.clicked_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminSignups({ customersOnly = false }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [offer, setOffer] = useState("all");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const fetcher = customersOnly ? getAdminCustomers : getAdminSignups;
    fetcher({ limit: PAGE_SIZE, offset, q, paymentStatus, offer })
      .then((res) => {
        setRows(res?.data || []);
        setTotal(res?.total || 0);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [customersOnly, offset, q, paymentStatus, offer]);

  const onExport = async () => {
    setExporting(true);
    try {
      await exportSignupsCsv(customersOnly ? "customers" : "signups", {
        q,
        paymentStatus,
        offer,
      });
    } catch (_e) {
      /* ignore */
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const onSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    load();
  };

  const title = customersOnly ? "Customers" : "Sign-ups";
  const subtitle = customersOnly
    ? "Users who completed payment."
    : "Everyone who submitted the registration form.";

  return (
    <div className="platform-page" style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b" }}>
          {subtitle} {total ? `(${total})` : ""}
        </p>
      </div>

      <form
        onSubmit={onSearch}
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or name"
          style={{
            padding: "8px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            width: 260,
            maxWidth: "100%",
          }}
        />
        {!customersOnly && (
          <select
            value={paymentStatus}
            onChange={(e) => {
              setOffset(0);
              setPaymentStatus(e.target.value);
            }}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}
          >
            <option value="all">All payment status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="trial">Trial</option>
          </select>
        )}
        <select
          value={offer}
          onChange={(e) => {
            setOffset(0);
            setOffer(e.target.value);
          }}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}
        >
          <option value="all">All offers</option>
          <option value="exit7">$7 exit offer</option>
          <option value="standard">Standard</option>
        </select>
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Search
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#fff",
            color: "#0f172a",
            cursor: exporting ? "default" : "pointer",
          }}
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </form>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#64748b" }}>
              <th style={{ padding: "8px 10px" }}>Email</th>
              <th style={{ padding: "8px 10px" }}>Name</th>
              <th style={{ padding: "8px 10px" }}>Lang</th>
              <th style={{ padding: "8px 10px" }}>Offer</th>
              <th style={{ padding: "8px 10px" }}>Checkout</th>
              <th style={{ padding: "8px 10px" }}>Payment</th>
              <th style={{ padding: "8px 10px" }}>Source</th>
              <th style={{ padding: "8px 10px" }}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ padding: 16, color: "#64748b" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 16, color: "#64748b" }}>
                  No records.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  style={{ borderTop: "1px solid #e2e8f0", cursor: "pointer" }}
                >
                  <td style={{ padding: "8px 10px" }}>{r.email}</td>
                  <td style={{ padding: "8px 10px" }}>{r.name || "—"}</td>
                  <td style={{ padding: "8px 10px" }}>{r.language}</td>
                  <td style={{ padding: "8px 10px" }}>{r.offer_used || "—"}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <StatusPill value={r.checkout_status} />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <StatusPill value={r.payment_status} />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    {r.utm_source || r.gclid ? r.utm_source || "gclid" : "—"}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {fmtDate(r.registered_at || r.created_at)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <button
          type="button"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          style={{ padding: "6px 12px", cursor: offset === 0 ? "default" : "pointer" }}
        >
          Previous
        </button>
        <span style={{ color: "#64748b", fontSize: 13 }}>
          {total ? `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}` : ""}
        </span>
        <button
          type="button"
          disabled={offset + PAGE_SIZE >= total}
          onClick={() => setOffset(offset + PAGE_SIZE)}
          style={{
            padding: "6px 12px",
            cursor: offset + PAGE_SIZE >= total ? "default" : "pointer",
          }}
        >
          Next
        </button>
      </div>

      {selected && (
        <DetailPanel id={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
