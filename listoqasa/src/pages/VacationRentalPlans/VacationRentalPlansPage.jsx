import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CalendarDays,
  Home,
  Star,
  Gem,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";

import "../PricingShared/PricingShared.css";

export default function VacationRentalPlansPage() {
  const { t } = useTranslation();

  const [billingCycle, setBillingCycle] =
    useState("monthly");

  const plans = useMemo(
    () => [
      {
        key: "starter",
        icon: Home,
        monthlyPrice: 77,
        yearlyPrice: 924,
        saving: 228,
        listings: 3,
        cta: "/owners/create?plan=vacation-starter",
        features: [
          "marketplace",
          "generalVisibility",
          "aiMatchmaker",
          "buyerNotifications",
          "editAnytime",
        ],
      },
      {
        key: "growth",
        icon: Star,
        monthlyPrice: 107,
        yearlyPrice: 1284,
        saving: 256,
        listings: 6,
        dark: true,
        popular: true,
        cta: "/owners/create?plan=vacation-growth",
        features: [
          "everythingStarter",
          "priorityPlacement",
          "enhancedVisibility",
          "featuredRotation",
          "priorityAi",
          "moreExposure",
          "enhancedReach",
        ],
      },
      {
        key: "premium",
        icon: Gem,
        monthlyPrice: 177,
        yearlyPrice: 2124,
        saving: 504,
        unlimited: true,
        cta: "/owners/create?plan=vacation-premium",
        features: [
          "everythingGrowth",
          "topPlacement",
          "premiumPriority",
          "highestGuestLeads",
          "featuredExposure",
          "maximumReach",
        ],
      },
    ],
    []
  );

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
              {t("plans.vacation.eyebrow")}
            </span>

            <h1>
              {t("plans.vacation.title")}
            </h1>

            <p>
              {t("plans.vacation.subtitle")}
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
                  "plans.common.yearly",
                  {
                    defaultValue:
                      "Yearly",
                  }
                )}
              </button>
            </div>

            <div className="lq-pricing-note">
              <Check size={18} />

              {isMonthly
                ? t(
                    "plans.vacation.monthlyNote",
                    {
                      defaultValue:
                        "Pay month to month. Cancel anytime.",
                    }
                  )
                : t(
                    "plans.vacation.yearlyNote",
                    {
                      defaultValue:
                        "Billed yearly. Cancel anytime.",
                    }
                  )}
            </div>
          </header>

          <section className="lq-pricing-grid">
            {plans.map((plan) => {
              const Icon = plan.icon;

              return (
                <article
                  key={plan.key}
                  className={`lq-plan-card ${
                    plan.dark
                      ? "dark"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="lq-plan-popular light">
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
                      `plans.vacation.${plan.key}.name`
                    )}
                  </h2>

                  <p className="lq-plan-desc">
                    {t(
                      `plans.vacation.${plan.key}.description`
                    )}
                  </p>

                  <div className="lq-plan-divider" />

                  {isMonthly ? (
                    <div className="lq-plan-price-block">
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
                          {
                            plan.monthlyPrice
                          }
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

                      <div className="lq-plan-listings">
                        {plan.unlimited
                          ? t(
                              "plans.vacation.unlimitedActive"
                            )
                          : `${
                              plan.listings
                            } ${t(
                              "plans.owner.activeListings"
                            )}`}
                      </div>
                    </div>
                  ) : (
                    <div className="lq-plan-price-block">
                      <div className="lq-plan-period-label">
                        {t(
                          "plans.common.yearly",
                          {
                            defaultValue:
                              "Yearly",
                          }
                        )}
                      </div>

                      <div className="lq-plan-year-price lq-plan-year-price-primary">
                        $
                        {plan.yearlyPrice.toLocaleString()}

                        <span>
                          {t(
                            "plans.common.perYear"
                          )}
                        </span>
                      </div>

                      <div className="lq-plan-billing-caption">
                        {t(
                          "plans.common.billedYearly"
                        )}
                      </div>

                      <div className="lq-plan-saving">
                        {t(
                          "plans.common.saveYearly",
                          {
                            amount:
                              plan.saving,
                          }
                        )}
                      </div>

                      <div className="lq-plan-listings">
                        {plan.unlimited
                          ? t(
                              "plans.vacation.unlimitedActive"
                            )
                          : `${
                              plan.listings
                            } ${t(
                              "plans.owner.activeListings"
                            )}`}
                      </div>
                    </div>
                  )}

                  <Link
                    to={buildCheckoutUrl(
                      plan
                    )}
                    className="lq-plan-cta"
                  >
                    {t(
                      `plans.vacation.${plan.key}.cta`
                    )}
                  </Link>

                  <h3 className="lq-plan-feature-title">
                    {t(
                      "plans.common.features"
                    )}
                  </h3>

                  <ul className="lq-plan-features">
                    {plan.features.map(
                      (feature) => (
                        <li key={feature}>
                          <Check
                            size={18}
                          />

                          <span>
                            {t(
                              `plans.vacation.features.${feature}`
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
