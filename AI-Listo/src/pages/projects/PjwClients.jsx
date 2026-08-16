import { useEffect, useState } from "react";
import { Search, UsersRound, Eye } from "lucide-react";
import projectsApi from "../../api/projectsApi";
import PjwModal from "./PjwModal";
import { money, fmtDate, statusClass } from "./projectFormat";

function ClientModal({ open, clientId, onClose, onOpenProject }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !clientId) return undefined;
    let alive = true;
    setLoading(true);
    projectsApi
      .getClient(clientId)
      .then((d) => {
        if (alive) {
          setDetail(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, clientId]);

  return (
    <PjwModal open={open} title={detail?.name || "Client"} subtitle={detail?.email || ""} onClose={onClose} wide>
      {loading || !detail ? (
        <div className="pjw-loading">Loading…</div>
      ) : (
        <>
          <div className="pjw-detail-grid">
            <div className="pjw-kv"><span>Email</span><strong>{detail.email || "—"}</strong></div>
            <div className="pjw-kv"><span>Phone</span><strong>{detail.phone || "—"}</strong></div>
            <div className="pjw-kv"><span>Status</span><strong>{detail.status || "—"}</strong></div>
            <div className="pjw-kv"><span>Type</span><strong>{detail.type || "—"}</strong></div>
          </div>
          <div className="pjw-panel-head" style={{ marginTop: 4 }}>
            <b>Projects ({detail.projects?.length || 0})</b>
          </div>
          {detail.projects?.length === 0 ? (
            <div className="pjw-empty">
              <b>No projects for this client yet</b>
            </div>
          ) : (
            <div className="pjw-table-wrap" style={{ boxShadow: "none", border: "none" }}>
              <div className="pjw-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Budget</th>
                      <th>Spent</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.projects.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>
                          <span className={`pjw-pill ${statusClass(p.status)}`}>{p.statusLabel}</span>
                        </td>
                        <td>{p.budget != null ? money(p.budget, p.currency) : "—"}</td>
                        <td>{money(p.spent, p.currency)}</td>
                        <td>
                          <button
                            className="pjw-project-link"
                            onClick={() => {
                              onClose?.();
                              onOpenProject?.(p.id);
                            }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </PjwModal>
  );
}

export default function PjwClients({ onOpenProject }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    projectsApi
      .listClients({ search: debounced || undefined })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load clients.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [debounced]);

  const open = (id) => {
    setClientId(id);
    setNonce((n) => n + 1);
    setModalOpen(true);
  };

  return (
    <div className="pjw-tab-panel">
      <section className="pjw-section-head">
        <div>
          <h2>Clients</h2>
          <p>Your Cortexa contacts, with delivery rollups. Same records as your CRM.</p>
        </div>
      </section>

      <div className="pjw-filters">
        <label className="pjw-search-filter">
          <Search size={14} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." />
        </label>
      </div>

      <div className="pjw-table-wrap">
        <div className="pjw-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Projects</th>
                <th>Active</th>
                <th>Total Budget</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 30, color: "#b91c1c" }}>
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pjw-cell-muted" style={{ textAlign: "center", padding: 30 }}>
                    No clients yet. Add contacts in your CRM to see them here.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button className="pjw-project-link" onClick={() => open(c.id)}>
                        {c.name}
                      </button>
                    </td>
                    <td>{c.email || <span className="pjw-cell-muted">—</span>}</td>
                    <td>{c.projectCount}</td>
                    <td>{c.activeCount}</td>
                    <td>{money(c.totalBudget)}</td>
                    <td>{money(c.totalSpent)}</td>
                    <td>
                      <div className="pjw-row-actions">
                        <button aria-label="View" onClick={() => open(c.id)}>
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientModal
        key={nonce}
        open={modalOpen}
        clientId={clientId}
        onClose={() => setModalOpen(false)}
        onOpenProject={onOpenProject}
      />
    </div>
  );
}
