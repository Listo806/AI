import React from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  X,
} from "lucide-react";

import "./KnowledgeInsightsModal.css";

export default function KnowledgeInsightsModal({ open, data, onClose }) {
  const { t } = useTranslation();

  if (!open) return null;

  const stats = data?.stats || {};
  const health = data?.health || {};
  const categories = Array.isArray(data?.categories) ? data.categories : [];

  return (
    <div className="cx-knowledge-insights-backdrop" onMouseDown={onClose}>
      <div
        className="cx-knowledge-insights-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>
              <Activity size={22} />
            </span>

            <div>
              <h2>
                {t("aiCenter.knowledgeInsightsModal.title", "Knowledge Insights")}
              </h2>
              <p>
                {t(
                  "aiCenter.knowledgeInsightsModal.subtitle",
                  "Review the quality, coverage and freshness of your AI knowledge.",
                )}
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="cx-knowledge-insights-grid">
          <article>
            <BookOpen size={20} />
            <strong>{Number(stats.knowledgeItems || 0)}</strong>
            <span>
              {t("aiCenter.knowledgeInsightsModal.totalItems", "Total Items")}
            </span>
          </article>

          <article>
            <CheckCircle2 size={20} />
            <strong>{Number(stats.activeItems || 0)}</strong>
            <span>
              {t("aiCenter.knowledgeInsightsModal.activeItems", "Active Items")}
            </span>
          </article>

          <article>
            <Database size={20} />
            <strong>{Number(stats.dataSources || 0)}</strong>
            <span>
              {t("aiCenter.knowledgeInsightsModal.dataSources", "Data Sources")}
            </span>
          </article>

          <article>
            <Clock3 size={20} />
            <strong>
              {stats.lastUpdatedLabel ||
                t("aiCenter.knowledgeInsightsModal.never", "Never")}
            </strong>
            <span>
              {t("aiCenter.knowledgeInsightsModal.lastUpdated", "Last Updated")}
            </span>
          </article>
        </div>

        <section className="cx-knowledge-insights-health">
          <div>
            <strong>{Number(health.score || 0)}%</strong>
            <span>
              {t(
                "aiCenter.knowledgeInsightsModal.knowledgeScore",
                "Knowledge Score",
              )}
            </span>
          </div>

          <ul>
            <li>
              <CheckCircle2 size={16} />
              {t("aiCenter.knowledgeInsightsModal.complete", "Complete")}
              <strong>
                {Number(health.complete || 0)} / {Number(health.total || 0)}
              </strong>
            </li>

            <li>
              <CheckCircle2 size={16} />
              {t("aiCenter.knowledgeInsightsModal.upToDate", "Up to date")}
              <strong>
                {Number(health.upToDate || 0)} / {Number(health.total || 0)}
              </strong>
            </li>

            <li>
              <AlertTriangle size={16} />
              {t("aiCenter.knowledgeInsightsModal.needsReview", "Needs review")}
              <strong>
                {Number(health.needsReview || 0)} / {Number(health.total || 0)}
              </strong>
            </li>
          </ul>
        </section>

        <section className="cx-knowledge-insights-categories">
          <h3>
            {t(
              "aiCenter.knowledgeInsightsModal.categoryCoverage",
              "Category Coverage",
            )}
          </h3>

          {categories.map((item) => {
            const total = Number(item.items || 0);

            const active = Number(item.active || 0);

            const percent = total > 0 ? Math.round((active / total) * 100) : 0;

            return (
              <div key={item.key}>
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {active} / {total}
                  </span>
                </div>

                <div className="cx-knowledge-insights-bar">
                  <i
                    style={{
                      width: `${percent}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
