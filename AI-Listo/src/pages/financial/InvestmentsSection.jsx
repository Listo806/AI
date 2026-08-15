import React from "react";
import FinancialRecordSection from "./FinancialRecordSection";
import InvestmentModal from "./InvestmentModal";
import financialApi from "../../api/financialApi";
import { money, formatDate } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Active", "Sold", "Closed"];

const columns = [
  { header: "Investment ID", render: (r) => r.investmentNumber || "-" },
  { header: "Holding", render: (r) => <b>{r.name || "-"}</b> },
  { header: "Client", render: (r) => r.clientName || "-" },
  { header: "Category", render: (r) => r.category || "-" },
  { header: "Value", className: "money", render: (r) => (r.amount != null ? money(r.amount) : "-") },
  {
    header: "Status",
    render: (r) => (
      <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  { header: "As Of", render: (r) => formatDate(r.asOfDate) },
];

export default function InvestmentsSection() {
  return (
    <FinancialRecordSection
      title="Investments"
      subtitle="Client holdings with recorded values (no live market prices)"
      newLabel="New Investment"
      columns={columns}
      statusOptions={STATUS_OPTIONS}
      fetchList={(params) => financialApi.listInvestments(params)}
      ModalComponent={InvestmentModal}
    />
  );
}
