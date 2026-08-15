import React from "react";
import FinancialRecordSection from "./FinancialRecordSection";
import AccountModal from "./AccountModal";
import financialApi from "../../api/financialApi";
import { money, formatDate, initials } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Active", "Inactive", "Closed"];

const columns = [
  { header: "Account ID", render: (r) => r.accountNumber || "-" },
  { header: "Client", render: (r) => <b>{r.clientName || "-"}</b> },
  { header: "Account Type", render: (r) => r.accountType || "-" },
  {
    header: "Advisor",
    render: (r) =>
      r.advisorName ? (
        <div className="fsw-advisor">
          <span className="avatar a1">{initials(r.advisorName)}</span>
          <span><b>{r.advisorName}</b></span>
        </div>
      ) : (
        "-"
      ),
  },
  { header: "Balance", className: "money", render: (r) => (r.balance != null ? money(r.balance) : "-") },
  {
    header: "Status",
    render: (r) => (
      <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  { header: "Opened", render: (r) => formatDate(r.openedDate) },
];

export default function AccountsSection() {
  return (
    <FinancialRecordSection
      title="Accounts"
      subtitle="CRM records of client accounts and recorded balances"
      newLabel="New Account"
      columns={columns}
      statusOptions={STATUS_OPTIONS}
      fetchList={(params) => financialApi.listAccounts(params)}
      ModalComponent={AccountModal}
    />
  );
}
