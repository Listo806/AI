import React from "react";
import SalesRecordSection from "./SalesRecordSection";
import ContractModal from "./ContractModal";
import salesApi from "../../api/salesApi";
import { money, formatDate, initials } from "./salesFormat";

const columns = [
  { header: "Contract #", className: "quote-id", render: (r) => r.contractNumber || "-" },
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
  { header: "Value", className: "sales-ws-money", render: (r) => (r.value != null ? money(r.value) : "-") },
  {
    header: "Status",
    render: (r) => (
      <span className={`sales-ws-status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  {
    header: "Term",
    render: (r) => (
      <div className="sales-ws-two-line">
        <strong>{formatDate(r.startDate)}</strong>
        <span>to {formatDate(r.endDate)}</span>
      </div>
    ),
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

export default function ContractsSection() {
  return (
    <SalesRecordSection
      title="Contracts"
      subtitle="Create, manage and track all your contracts"
      newLabel="New Contract"
      columns={columns}
      fetchList={(params) => salesApi.listContracts(params)}
      ModalComponent={ContractModal}
    />
  );
}
