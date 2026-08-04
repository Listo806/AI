import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./ai-center.css";

export default function AIMessaging() {
  const { t } = useTranslation();

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, []);

  return (
    <div className="ai-center-page">
      <h1 className="ai-center-page-title">
        <i data-lucide="send" />
        {t("aiCenter.pageTitle")}
      </h1>
      <p className="ai-center-page-subtitle">
        {t("aiCenter.pageSubtitle")}
      </p>

      <section className="ai-center-section">
        <h2>{t("aiCenter.scopeTitle")}</h2>
        <p>
          {t("aiCenter.scopeDescription")}
        </p>
        <p className="ai-center-metrics-empty" style={{ marginTop: "16px" }}>
          {t("aiCenter.configureHint")}
        </p>
      </section>
    </div>
  );
}
