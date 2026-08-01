import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, TrendingDown, ArrowRight, Info } from "lucide-react";
import { trackEvent } from "../../utils/track";
import {
  CATEGORIES,
  CURRENT_CRM_OPTIONS,
  HORIZON_YEARS,
  computeCurrent,
  computeCortexa,
  presetValues,
  formatUSD,
} from "./hiddenCostModel";

// Interactive "Hidden Cost Calculator". Pure client-side: it reads the model,
// pre-fills typical (editable) costs for the chosen CRM, and shows the visitor's
// Year 1 / monthly / total investment beside the Cortexa equivalent.
export default function HiddenCostCalculator() {
  const [currentCrm, setCurrentCrm] = useState("salesforce");
  const [users, setUsers] = useState(3);
  const [leadVolume, setLeadVolume] = useState(200);
  const [values, setValues] = useState(() => presetValues("salesforce", 3));
  const [touched, setTouched] = useState(() => new Set());

  const onSelectCrm = (crm) => {
    setCurrentCrm(crm);
    setValues(presetValues(crm, users));
    setTouched(new Set());
  };

  const onUsersChange = (raw) => {
    const next = Math.max(1, Math.min(500, Math.floor(Number(raw) || 1)));
    setUsers(next);
    // Re-apply presets for fields the visitor hasn't hand-edited.
    const preset = presetValues(currentCrm, next);
    setValues((cur) => {
      const merged = { ...cur };
      for (const cat of CATEGORIES) {
        if (!touched.has(cat.id)) merged[cat.id] = preset[cat.id];
      }
      return merged;
    });
  };

  const onFieldChange = (id, raw) => {
    const v = Math.max(0, Number(raw) || 0);
    setValues((cur) => ({ ...cur, [id]: v }));
    setTouched((cur) => new Set(cur).add(id));
  };

  const current = useMemo(() => computeCurrent(values), [values]);
  const cortexa = useMemo(() => computeCortexa(users), [users]);

  const savings = Math.max(0, current.totalInvestment - cortexa.totalInvestment);

  const oneTimeCats = CATEGORIES.filter((c) => c.kind === "oneTime");
  const monthlyCats = CATEGORIES.filter((c) => c.kind === "monthly");

  return (
    <div className="hcc" id="calculator">
      <div className="hcc-head">
        <span className="hcc-icon">
          <Calculator size={22} />
        </span>
        <div>
          <h3>Hidden Cost Calculator</h3>
          <p>Estimate what your current CRM really costs, then compare.</p>
        </div>
      </div>

      <div className="hcc-grid">
        {/* Inputs */}
        <div className="hcc-inputs">
          <div className="hcc-row2">
            <label>
              Current CRM
              <select
                value={currentCrm}
                onChange={(e) => onSelectCrm(e.target.value)}
              >
                {CURRENT_CRM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Number of users
              <input
                type="number"
                min="1"
                max="500"
                value={users}
                onChange={(e) => onUsersChange(e.target.value)}
              />
            </label>
          </div>

          <label className="hcc-full">
            Estimated monthly lead volume
            <input
              type="number"
              min="0"
              value={leadVolume}
              onChange={(e) =>
                setLeadVolume(Math.max(0, Number(e.target.value) || 0))
              }
            />
            <span className="hcc-hint">
              Used for context in the editorial; it does not change the cost
              estimate.
            </span>
          </label>

          <div className="hcc-fieldset">
            <span className="hcc-fieldset-title">One-time costs</span>
            {oneTimeCats.map((cat) => (
              <CostField
                key={cat.id}
                cat={cat}
                value={values[cat.id]}
                onChange={onFieldChange}
              />
            ))}
          </div>

          <div className="hcc-fieldset">
            <span className="hcc-fieldset-title">Monthly costs</span>
            {monthlyCats.map((cat) => (
              <CostField
                key={cat.id}
                cat={cat}
                value={values[cat.id]}
                onChange={onFieldChange}
              />
            ))}
          </div>

          <p className="hcc-note">
            <Info size={14} /> Starting estimates based on typical published
            pricing. Edit any field to match your actual costs.
          </p>
        </div>

        {/* Results */}
        <div className="hcc-results">
          <div className="hcc-card hcc-card-current">
            <span className="hcc-card-label">Your current CRM</span>
            <ResultRow label="Estimated monthly operating cost" value={current.monthly} />
            <ResultRow label="Estimated Year 1 total cost" value={current.year1} big />
            <ResultRow
              label={`Total estimated investment (${HORIZON_YEARS} yrs)`}
              value={current.totalInvestment}
            />
          </div>

          <div className="hcc-card hcc-card-cortexa">
            <span className="hcc-card-label">With Cortexa</span>
            <ResultRow label="One-time setup fee" value={cortexa.oneTime} />
            <ResultRow
              label={`Monthly (${cortexa.plan.label} plan${
                cortexa.extraSeats ? ` + ${cortexa.extraSeats} users` : ""
              })`}
              value={cortexa.monthly}
            />
            <ResultRow label="Estimated Year 1 total cost" value={cortexa.year1} big />
            <ResultRow
              label={`Total estimated investment (${HORIZON_YEARS} yrs)`}
              value={cortexa.totalInvestment}
            />
          </div>

          {savings > 0 && (
            <div className="hcc-savings">
              <TrendingDown size={20} />
              <div>
                <span className="hcc-savings-value">{formatUSD(savings)}</span>
                <span className="hcc-savings-label">
                  estimated lower total investment over {HORIZON_YEARS} years
                </span>
              </div>
            </div>
          )}

          <Link
            to="/trial"
            className="hcc-cta"
            onClick={() =>
              trackEvent("editorial_calculator_cta", {
                current_crm: currentCrm,
                users,
                estimated_savings: Math.round(savings),
              })
            }
          >
            Start with Cortexa for $97 <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function CostField({ cat, value, onChange }) {
  return (
    <label className="hcc-cost-field">
      <span>
        {cat.label}
        {cat.optional ? <em> (optional)</em> : null}
      </span>
      <div className="hcc-money">
        <span>$</span>
        <input
          type="number"
          min="0"
          value={value ?? 0}
          onChange={(e) => onChange(cat.id, e.target.value)}
        />
        {cat.kind === "monthly" ? <small>/mo</small> : null}
      </div>
    </label>
  );
}

function ResultRow({ label, value, big }) {
  return (
    <div className={`hcc-result-row${big ? " big" : ""}`}>
      <span className="hcc-result-label">{label}</span>
      <span className="hcc-result-value">{formatUSD(value)}</span>
    </div>
  );
}
