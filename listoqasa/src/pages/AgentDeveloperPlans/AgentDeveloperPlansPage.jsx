import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CalendarDays,
  Home,
  Rocket,
  Users,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";

import "../PricingShared/PricingShared.css";

const YEARLY_DISCOUNT = 0.2;

const formatMoney = (value) =>
  Number(value).toLocaleString(
    "en-US",
    {
      minimumFractionDigits:
        Number(value) % 1 === 0
          ? 0
          : 2,

      maximumFractionDigits: 2,
    }
  );

export default function AgentDeveloperPlansPage() {
  const { t } = useTranslation();

  const [billingCycle, setBillingCycle] =
    useState("monthly");

  const plans = useMemo(() => {
    const basePlans = [
      {
        key: "essential",
        icon: Home,
        monthlyPrice: 97,
        cta: "/trial?plan=essential",
        features: [
          "listings20",
          "aiEnhancements",
          "leadManagement",
          "advancedVisibility",
          "buyerRouting",
          "basicLeadCapture",
          "performanceInsights",
          "standardPlacement",
          "activeBuyerTraffic",
        ],
      },
      {
        key: "growth",
        icon: Rocket,
        monthlyPrice: 147,
        popular: true,
        cta: "/trial?plan=growth",
        features: [
          "everythingEssential",
          "unlimitedListings",
          "priorityMarketplace",
          "advancedLeadCapture",
          "aiEnhancementsAdvanced",
          "listingAnalytics",
          "higherBuyerReach",
          "priorityDistribution",
          "multiProperty",
          "advancedSearch",
          "dedicatedSupport",
        ],
      },
      {
        key: "addon",
        icon: Users,

        // Client-requested update:
        monthlyPrice: 127,

        // Exact client-requested yearly values:
        yearlyMonthlyEquivalent:
          101.6,

        yearlyPrice:
          1219.2,

        yearlySaving:
          304.8,

        cta: "/trial?addon=ai-crm",

        features: [
          "agent247",
          "instantLeads",
          "booksAppointments",
          "qualifiesBuyers",
          "followups",
          "conversations",
          "tracksEveryLead",
          "leadScoring",
          "pipelineManagement",
        ],
      },
    ];

    return basePlans.map((plan) => {
      if (plan.key === "addon") {
        return plan;
      }

      const yearlyMonthlyEquivalent =
        Number(
          (
            plan.monthlyPrice *
            (1 - YEARLY_DISCOUNT)
          ).toFixed(2)
        );

      const yearlyPrice =
        Number(
          (
            yearlyMonthlyEquivalent *
            12
          ).toFixed(2)
        );

      const fullAnnual =
        plan.monthlyPrice * 12;

      const yearlySaving =
        Number(
          (
            fullAnnual -
            yearlyPrice
          ).toFixed(2)
        );

      return {
        ...plan,
        yearlyMonthlyEquivalent,
        yearlyPrice,
        yearlySaving,
      };
    });
  }, []);

  const isMonthly =
    billingCycle === "monthly";

  const buildCheckoutUrl = (plan) => {
    const separator =
      plan.cta.includes("?") ? "&" : "?";

    return `${plan.cta}${separator}billing=${billingCycle}`;
  };

  return (
    <SiteLayout headerVariant="dark">
      <main className="lq-pricing-page">
        <div className="lq-pricing-container">
          <header className="lq-pricing-header">
            <span className="lq-pricing-eyebrow">
              {t(
                "plans.agentDeveloper.eyebrow"
              )}
            </span>

            <h1>
              {t(
                "plans.agentDeveloper.title"
              )}
            </h1>

            <p>
              {t(
                "plans.agentDeveloper.subtitle"
              )}
            </p>

            <div
              className="lq-pricing-billing-toggle"
              role="group"
              aria-label={t(
                "plans.common.billingCycle",
                {
                  defaultValue:
                    "Choose billing cycle",
                }
              )}
            >
              <button
                type="button"
                className={
                  isMonthly
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setBillingCycle(
                    "monthly"
                  )
                }
              >
                <CalendarDays
                  size={17}
                />

                {t(
                  "plans.common.monthly",
                  {
                    defaultValue:
                      "Monthly",
                  }
                )}
              </button>

              <button
                type="button"
                className={
                  !isMonthly
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setBillingCycle(
                    "yearly"
                  )
                }
              >
                <Check size={17} />

                {t(
                  "plans.common.yearlySave20",
                  {
                    defaultValue:
                      "Yearly — Save 20%",
                  }
                )}
              </button>
            </div>
          </header>

          <section className="lq-pricing-grid">
            {plans.map((plan) => {
              const Icon = plan.icon;

              return (
                <article
                  key={plan.key}
                  className="lq-plan-card"
                >
                  {plan.popular && (
                    <div className="lq-plan-popular">
                      {t(
                        "plans.common.mostPopular"
                      )}
                    </div>
                  )}

                  <div className="lq-plan-icon">
                    <Icon />
                  </div>

                  <h2 className="lq-plan-title">
                    {t(
                      `plans.agentDeveloper.${plan.key}.name`
                    )}
                  </h2>

                  <p className="lq-plan-desc">
                    {t(
                      `plans.agentDeveloper.${plan.key}.description`
                    )}
                  </p>

                  <div className="lq-plan-divider" />

                  <div className="lq-plan-price-block">
                    {isMonthly ? (
                      <>
                        <div className="lq-plan-period-label">
                          {t(
                            "plans.common.monthly",
                            {
                              defaultValue:
                                "Monthly",
                            }
                          )}
                        </div>

                        <div className="lq-plan-price-line">
                          <span className="lq-plan-price">
                            $
                            {formatMoney(
                              plan.monthlyPrice
                            )}
                          </span>

                          <span className="lq-plan-month">
                            {t(
                              "plans.common.perMonth"
                            )}
                          </span>
                        </div>

                        <div className="lq-plan-billing-caption">
                          {t(
                            "plans.common.billedMonthly",
                            {
                              defaultValue:
                                "Billed monthly",
                            }
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="lq-plan-period-label">
                          {t(
                            "plans.common.yearly",
                            {
                              defaultValue:
                                "Yearly",
                            }
                          )}
                        </div>

                        <div className="lq-plan-price-line">
                          <span className="lq-plan-price">
                            $
                            {formatMoney(
                              plan.yearlyMonthlyEquivalent
                            )}
                          </span>

                          <span className="lq-plan-month">
                            {t(
                              "plans.common.perMonth"
                            )}
                          </span>
                        </div>

                        <div className="lq-plan-billing-caption">
                          {t(
                            "plans.common.billedYearly"
                          )}
                        </div>

                        <div className="lq-plan-year-price">
                          $
                          {formatMoney(
                            plan.yearlyPrice
                          )}

                          <span>
                            {t(
                              "plans.common.perYear"
                            )}
                          </span>
                        </div>

                        <div className="lq-plan-saving">
                          {t(
                            "plans.common.savePerYear",
                            {
                              amount:
                                formatMoney(
                                  plan.yearlySaving
                                ),

                              defaultValue:
                                `Save $${formatMoney(
                                  plan.yearlySaving
                                )} per year`,
                            }
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <Link
                    to={buildCheckoutUrl(
                      plan
                    )}
                    className="lq-plan-cta"
                  >
                    {t(
                      `plans.agentDeveloper.${plan.key}.cta`
                    )}

                    <ArrowRight
                      size={18}
                    />
                  </Link>

                  <ul className="lq-plan-features">
                    {plan.features.map(
                      (feature) => (
                        <li key={feature}>
                          <Check
                            size={18}
                          />

                          <span>
                            {t(
                              `plans.agentDeveloper.features.${feature}`
                            )}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </article>
              );
            })}
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}
