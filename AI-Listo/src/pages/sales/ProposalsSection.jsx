import React, { useState } from "react";
import { PackageCheck } from "lucide-react";
import SalesRecordSection from "./SalesRecordSection";
import ProposalModal from "./ProposalModal";
import salesApi from "../../api/salesApi";
import { money, formatDate, daysLeftNote, initials } from "./salesFormat";

const columns = [
  { header: "Proposal #", className: "quote-id", render: (r) => r.proposalNumber || "-" },
  {
    header: "Customer",
    render: (r) => (
      <div className="sales-ws-customer">
        <strong>{r.customerName || "-"}</strong>
        {r.segment && <span>{r.segment}</span>}
      </div>
    ),
  },
  {
    header: "Contact",
    render: (r) => (
      <div className="sales-ws-two-line">
        <strong>{r.contactName || "-"}</strong>
        {r.contactRole && <span>{r.contactRole}</span>}
      </div>
    ),
  },
  {
    header: "Deal",
    render: (r) => (
      <div className="sales-ws-two-line deal">
        <strong>{r.dealName || "-"}</strong>
        {r.quoteNumber && <span>from {r.quoteNumber}</span>}
      </div>
    ),
  },
  { header: "Value", className: "sales-ws-money", render: (r) => (r.value != null ? money(r.value) : "-") },
  {
    header: "Status",
    render: (r) => (
      <span className={`sales-ws-status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  {
    header: "Valid Until",
    render: (r) => {
      const v = daysLeftNote(r.validUntil);
      return (
        <div className="sales-ws-valid">
          <strong>{formatDate(r.validUntil)}</strong>
          {v.text && <span className={v.danger ? "danger" : ""}>{v.text}</span>}
        </div>
      );
    },
  },
  {
    header: "Owner",
    render: (r) =>
      r.ownerName ? (
        <div className="sales-ws-owner">
          <span>{initials(r.ownerName)}</span>
          {r.ownerName}
        </div>
      ) : (
        "-"
      ),
  },
  { header: "Created", render: (r) => formatDate(r.createdAt) },
];

function ConvertAction({ row, refresh }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      title="Create order from proposal"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await salesApi.convertProposalToOrder(row.id);
          refresh();
        } catch (e) {
          // eslint-disable-next-line no-alert
          window.alert(e?.message || "Could not create order");
        } finally {
          setBusy(false);
        }
      }}
    >
      <PackageCheck size={14} />
    </button>
  );
}

export default function ProposalsSection() {
  return (
    <SalesRecordSection
      title="Proposals"
      subtitle="Create, manage and track all your proposals"
      newLabel="New Proposal"
      columns={columns}
      fetchList={(params) => salesApi.listProposals(params)}
      ModalComponent={ProposalModal}
      extraActions={(row, refresh) => <ConvertAction row={row} refresh={refresh} />}
    />
  );
}
