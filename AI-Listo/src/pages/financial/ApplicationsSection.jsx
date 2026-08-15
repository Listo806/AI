import React from "react";
import FinancialRecordSection from "./FinancialRecordSection";
import ApplicationModal from "./ApplicationModal";
import financialApi from "../../api/financialApi";
import { formatDate, initials } from "../sales/salesFormat";

const STATUS_OPTIONS = [
  "Draft",
  "In Progress",
  "Under Review",
  "Pending Documents",
  "Approved",
  "Declined",
  "Cancelled",
];

const columns = [
  { header: "Application ID", render: (r) => r.applicationNumber || "-" },
  { header: "Client", render: (r) => <b>{r.clientName || "-"}</b> },
  { header: "Type", render: (r) => r.applicationType || "-" },
  {
    header: "Advisor",
    render: (r) =>
      r.advisorName ? (
        <div className="fsw-advisor">
          <span className="avatar a0">{initials(r.advisorName)}</span>
          <span><b>{r.advisorName}</b></span>
        </div>
      ) : (
        "-"
      ),
  },
  {
    header: "Status",
    render: (r) => (
      <span className={`status ${String(r.status || "").toLowerCase().replaceAll(" ", "-")}`}>{r.status || "-"}</span>
    ),
  },
  { header: "Submitted", render: (r) => formatDate(r.submittedDate) },
  { header: "Created", render: (r) => formatDate(r.createdAt) },
];

export default function ApplicationsSection() {
  return (
    <FinancialRecordSection
      title="Applications"
      subtitle="Track applications from draft to approval"
      newLabel="New Application"
      columns={columns}
      statusOptions={STATUS_OPTIONS}
      fetchList={(params) => financialApi.listApplications(params)}
      ModalComponent={ApplicationModal}
    />
  );
}
