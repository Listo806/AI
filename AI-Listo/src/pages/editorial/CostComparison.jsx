import React from "react";
import { Check, X } from "lucide-react";

// Static "Cost Calculator comparison" — the client's designed table, exact
// numbers. 5-user reference. Cortexa's advantages carry a green (win) accent,
// distinct from the brand blue. Wide table scrolls horizontally on small screens
// with the Feature column pinned so the row label stays visible.

const COST_ROWS = [
  { label: "Team Size", sf: "5 Users", hs: "5 Users", cx: "5 Users" },
  { label: "Estimated Monthly Software", sf: "$1,500/month", hs: "$750/month", cx: "$497/month" },
  { label: "Estimated Setup", sf: "$4,000+", hs: "$1,500+", cx: "$97" },
  { label: "Estimated Annual Software", sf: "$18,000", hs: "$9,000", cx: "$5,964" },
];

// value shapes: true => plain check; {win: text} => green check + text; false => X
const FEATURE_ROWS = [
  { label: "CRM", sf: true, hs: true, cx: true },
  { label: "Agentic AI", sf: "Add-on", hs: "Limited", cx: { win: "Included" } },
  { label: "AI Usage", sf: "Add-on", hs: "Add-on", cx: { win: "Unlimited" } },
  { label: "Team Workspace", sf: "Separate Tool", hs: "Limited", cx: { win: "Included" } },
  { label: "Revenue Intelligence", sf: "Add-on", hs: "Limited", cx: { win: "Included" } },
  { label: "WhatsApp AI", sf: "Third-Party", hs: "Third-Party", cx: { win: "Native" } },
  { label: "Industry Customization", sf: "Consulting Project", hs: "Consulting Project", cx: { win: "48-Hour Configuration" } },
  { label: "One Unified Platform", sf: false, hs: false, cx: true },
];

function Cell({ value, cortexa }) {
  if (value === true) {
    return (
      <span className={cortexa ? "cmp-yes cmp-yes-cx" : "cmp-yes"}>
        <Check size={17} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="cmp-no">
        <X size={17} />
      </span>
    );
  }
  if (value && typeof value === "object" && value.win) {
    return (
      <span className="cmp-win">
        <Check size={15} /> {value.win}
      </span>
    );
  }
  return <span className="cmp-plain">{value}</span>;
}

export default function CostComparison() {
  return (
    <div className="cmp">
      <div className="cmp-scroll">
        <table className="cmp-table">
          <thead>
            <tr>
              <th className="cmp-feature-col">Feature</th>
              <th>Salesforce</th>
              <th>HubSpot</th>
              <th className="cmp-cx-col">Cortexa Agentic AI Revenue OS</th>
            </tr>
          </thead>
          <tbody>
            {COST_ROWS.map((r) => (
              <tr key={r.label}>
                <td className="cmp-feature-col">{r.label}</td>
                <td>{r.sf}</td>
                <td>{r.hs}</td>
                <td className="cmp-cx-col cmp-cx-strong">{r.cx}</td>
              </tr>
            ))}
            {FEATURE_ROWS.map((r) => (
              <tr key={r.label}>
                <td className="cmp-feature-col">{r.label}</td>
                <td><Cell value={r.sf} /></td>
                <td><Cell value={r.hs} /></td>
                <td className="cmp-cx-col"><Cell value={r.cx} cortexa /></td>
              </tr>
            ))}
            <tr className="cmp-total-row">
              <td className="cmp-feature-col">Estimated Year 1 Total</td>
              <td className="cmp-total">$22,000+</td>
              <td className="cmp-total">$10,500+</td>
              <td className="cmp-cx-col cmp-total cmp-total-cx">$6,061</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="cmp-diff">
        <span className="cmp-diff-title">Estimated Year 1 Difference</span>
        <div className="cmp-diff-rows">
          <div className="cmp-diff-head">Compared with Cortexa</div>
          <div className="cmp-diff-row">
            <span className="cmp-diff-vendor">Salesforce</span>
            <span>
              Approximately <strong className="cmp-diff-amount">$15,939+</strong> more in Year 1
            </span>
          </div>
          <div className="cmp-diff-row">
            <span className="cmp-diff-vendor">HubSpot</span>
            <span>
              Approximately <strong className="cmp-diff-amount">$4,439+</strong> more in Year 1
            </span>
          </div>
        </div>
      </div>

      <p className="cmp-note">
        Illustrative estimates for a 5-user team based on typical published
        pricing and add-on structures. Your actual costs will vary.
      </p>
    </div>
  );
}
