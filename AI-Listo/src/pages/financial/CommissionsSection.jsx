import React from "react";
import FinancialRecordSection from "./FinancialRecordSection";
import CommissionModal from "./CommissionModal";
import financialApi from "../../api/financialApi";
import { money, formatDate, initials } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Pending", "Approved", "Paid", "Cancelled"];

const columns = [
  { header: "Commission ID", render: (r) => r.commissionNumber || "-" },
  { header: "Client", render: (r) => <b>{r.clientName || "-"}</b> },
  {
    header: "Advisor",
    render: (r) =>
      r.advisorName ? (
        <div className="fsw-advisor">
          <span className="avatar a2">{initials(r.advisorName)}</span>
          <span><b>{r.advisorName}</b></span>
        </div>
      ) : (
        "-"
      ),
  },
  { header: "Amount", className: "money", render: (r) => (r.amount != null ? money(r.amount) : "-") },
  { header: "Rate", render: (r) => (r.rate != null ? `${r.rate}%` : "-") },
  {
    header: "Status",
    render: (r) => (
      <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  { header: "Date", render: (r) => formatDate(r.commissionDate) },
];

export default function CommissionsSection() {
  return (
    <FinancialRecordSection
      title="Commissions"
      subtitle="Recorded fee revenue, tracked separately from balances and AUM"
      newLabel="New Commission"
      columns={columns}
      statusOptions={STATUS_OPTIONS}
      fetchList={(params) => financialApi.listCommissions(params)}
      ModalComponent={CommissionModal}
    />
  );
}
