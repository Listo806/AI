import React from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  CircleDollarSign,
  ContactRound,
  Layers3,
  MessageCircle,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const COST_ROWS = [
  { icon: Users, label: "Team Size", sf: "5 Users", hs: "5 Users", cx: "5 Users" },
  {
    icon: CircleDollarSign,
    label: "Estimated Monthly Software",
    sf: "$1,500/month",
    hs: "$750/month",
    cx: "$497/month",
  },
  { icon: Settings, label: "Estimated Setup", sf: "$4,000+", hs: "$1,500+", cx: "$97" },
  {
    icon: CalendarDays,
    label: "Estimated Annual Software",
    sf: "$18,000",
    hs: "$9,000",
    cx: "$5,964",
  },
];

const FEATURE_ROWS = [
  { icon: ContactRound, label: "CRM", sf: true, hs: true, cx: true },
  { icon: Sparkles, label: "Agentic AI", sf: "Add-on", hs: "Limited", cx: "Included" },
  { icon: Bot, label: "AI Usage", sf: "Add-on", hs: "Add-on", cx: "Unlimited" },
  {
    icon: Users,
    label: "Team Workspace",
    sf: "Separate Tool",
    hs: "Limited",
    cx: "Included",
  },
  {
    icon: BarChart3,
    label: "Revenue Intelligence",
    sf: "Add-on",
    hs: "Limited",
    cx: "Included",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp AI",
    sf: "Third-Party",
    hs: "Third-Party",
    cx: "Native",
  },
  {
    icon: SlidersHorizontal,
    label: "Industry Customization",
    sf: "Consulting Project",
    hs: "Consulting Project",
    cx: "48-Hour Configuration",
  },
  { icon: Layers3, label: "One Unified Platform", sf: false, hs: false, cx: true },
];

function BrandHeader({ type }) {
  if (type === "salesforce") {
    return (
      <span className="cmp-brand cmp-brand-salesforce">
        <span className="cmp-brand-mark">salesforce</span>
        <strong>Salesforce</strong>
      </span>
    );
  }

  if (type === "hubspot") {
    return (
      <span className="cmp-brand cmp-brand-hubspot">
        <span className="cmp-hubspot-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <strong>HubSpot</strong>
      </span>
    );
  }

  return (
    <span className="cmp-brand cmp-brand-cortexa">
      <span className="cmp-cortexa-mark">✣</span>
      <span>
        <strong>Cortexa</strong>
        <small>Agentic AI Revenue OS</small>
      </span>
    </span>
  );
}

function ValueCell({ value, cortexa = false }) {
  if (value === true) {
    return (
      <span className={`cmp-status cmp-status-yes${cortexa ? " is-cortexa" : ""}`}>
        <Check size={21} strokeWidth={2.1} />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="cmp-status cmp-status-no">
        <X size={21} strokeWidth={1.9} />
      </span>
    );
  }

  return <span className={cortexa ? "cmp-value-cortexa" : "cmp-value"}>{value}</span>;
}

function FeatureLabel({ icon: Icon, children }) {
  return (
    <span className="cmp-feature-label">
      <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

export default function CostComparison() {
  return (
    <section className="cmp" aria-labelledby="comparison-title">
      <div className="cmp-shell">
        <header className="cmp-heading">
          <h3 id="comparison-title">Cortexa vs. Legacy Platforms</h3>
          <p>Powerful infrastructure. Built-in AI. Lower cost. All in one platform.</p>
        </header>

        <div className="cmp-table-card">
          <div className="cmp-scroll">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th className="cmp-feature-col">Feature</th>
                  <th><BrandHeader type="salesforce" /></th>
                  <th><BrandHeader type="hubspot" /></th>
                  <th className="cmp-cortexa-col"><BrandHeader type="cortexa" /></th>
                </tr>
              </thead>

              <tbody>
                {COST_ROWS.map(({ icon, label, sf, hs, cx }) => (
                  <tr key={label}>
                    <td className="cmp-feature-col"><FeatureLabel icon={icon}>{label}</FeatureLabel></td>
                    <td><ValueCell value={sf} /></td>
                    <td><ValueCell value={hs} /></td>
                    <td className="cmp-cortexa-col"><ValueCell value={cx} cortexa /></td>
                  </tr>
                ))}

                {FEATURE_ROWS.map(({ icon, label, sf, hs, cx }) => (
                  <tr key={label}>
                    <td className="cmp-feature-col"><FeatureLabel icon={icon}>{label}</FeatureLabel></td>
                    <td><ValueCell value={sf} /></td>
                    <td><ValueCell value={hs} /></td>
                    <td className="cmp-cortexa-col"><ValueCell value={cx} cortexa /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cmp-total-card">
          <span className="cmp-total-label">Estimated Year 1 Total</span>

          <div className="cmp-total-item">
            <strong>$22,000+</strong>
            <span>Salesforce</span>
          </div>

          <div className="cmp-total-item">
            <strong>$10,500+</strong>
            <span>HubSpot</span>
          </div>

          <div className="cmp-total-item is-cortexa">
            <strong>$6,061</strong>
            <span>Cortexa Agentic<br />AI Revenue OS</span>
          </div>
        </div>

        <div className="cmp-difference-card">
          <h4>Estimated Year 1 Difference</h4>

          <div className="cmp-difference-row">
            <span className="cmp-difference-brand cmp-difference-salesforce">salesforce</span>
            <span className="cmp-difference-word">Approximately</span>
            <strong>$15,939+</strong>
            <span className="cmp-difference-copy">more in Year 1<br />with Cortexa</span>
          </div>

          <div className="cmp-difference-row">
            <span className="cmp-difference-brand cmp-difference-hubspot">◉</span>
            <span className="cmp-difference-word">Approximately</span>
            <strong>$4,439+</strong>
            <span className="cmp-difference-copy">more in Year 1<br />with Cortexa</span>
          </div>
        </div>

        <p className="cmp-note">*All numbers are estimates based on typical 5-user teams.</p>
      </div>
    </section>
  );
}