import React, { useMemo } from "react";
import {
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock3,
  Home,
  Lock,
  MessageSquare,
  Rocket,
  Settings2,
  TestTube2,
  Zap,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import WhatsAppConnectCard from "./components/WhatsAppConnectCard";

export default function CortexaAISetup({
  setupData,
  openStep,
  setOpenStep,
  whatsappSetup,
  onBusinessProfile,
  onPropertyImport,
  onAppointmentRules,
  onBehavior,
  onAutomations,
  onTestAgent,
  onLaunch,
  launchingAgent,
  launchError,
  onExploreWorkspace,
  onDismissWorkspaceRecommendation,
}) {
  const { t } = useTranslation();

  const setupSteps = useMemo(() => {
    const data = setupData || {};

    return [
      {
        id: 1,
        key: "whatsapp",
        title: t("aiCenter.stepWhatsappTitle"),
        desc: t("aiCenter.stepWhatsappDesc"),
        desktopTitle: t("aiCenter.desktopStepWhatsappTitle"),
        desktopDesc: t("aiCenter.desktopStepWhatsappDesc"),
        icon: MessageSquare,
        status: whatsappSetup?.connected
          ? t("aiCenter.statusConnected")
          : data?.whatsapp?.status || t("aiCenter.statusNotConnected"),
        statusType:
          whatsappSetup?.connected || data?.whatsapp?.connected
            ? "success"
            : "danger",
        action:
          whatsappSetup?.connected || data?.whatsapp?.connected
            ? t("aiCenter.statusConnected")
            : t("aiCenter.stepWhatsappTitle"),
        accent: "green",
        complete: Boolean(
          whatsappSetup?.connected || data?.whatsapp?.connected,
        ),
      },
      {
        id: 2,
        key: "businessProfile",
        title: t("aiCenter.stepBusinessTitle"),
        desc: t("aiCenter.stepBusinessDesc"),
        desktopTitle: t("aiCenter.desktopStepBusinessTitle"),
        desktopDesc: t("aiCenter.desktopStepBusinessDesc"),
        desktopAction: t("aiCenter.desktopActionStart"),
        desktopHideStatus: true,
        icon: Building2,
        status: data?.businessProfile?.status || t("aiCenter.statusIncomplete"),
        statusType: data?.businessProfile?.completed ? "success" : "warning",
        action: data?.businessProfile?.completed
          ? t("aiCenter.actionEdit")
          : t("aiCenter.actionSetUp"),
        accent: "blue",
        complete: Boolean(data?.businessProfile?.completed),
      },
      {
        id: 3,
        key: "properties",
        title: t("aiCenter.stepPropertiesTitle"),
        desc: t("aiCenter.stepPropertiesDesc"),
        desktopTitle: t("aiCenter.desktopStepProductsTitle"),
        desktopDesc: t("aiCenter.desktopStepProductsDesc"),
        desktopStatus:
          Number(data?.properties?.imported || 0) > 0
            ? t("aiCenter.statusImported", {
                count: Number(data?.properties?.imported || 0),
              })
            : t("aiCenter.desktopStatusNotAdded"),
        desktopAction: t("aiCenter.desktopActionAdd"),
        icon: Home,
        status:
          data?.properties?.status ||
          t("aiCenter.statusImported", {
            count: Number(data?.properties?.imported || 0),
          }),
        statusType:
          Number(data?.properties?.imported || 0) > 0 ? "success" : "muted",
        action: t("aiCenter.actionImport"),
        accent: "orange",
        complete: Number(data?.properties?.imported || 0) > 0,
      },
      {
        id: 4,
        key: "appointmentRules",
        title: t("aiCenter.stepAppointmentTitle"),
        desc: t("aiCenter.stepAppointmentDesc"),
        desktopTitle: t("aiCenter.desktopStepAppointmentTitle"),
        desktopDesc: t("aiCenter.desktopStepAppointmentDesc"),
        icon: CalendarDays,
        status:
          data?.appointmentRules?.status || t("aiCenter.statusNotConfigured"),
        statusType: data?.appointmentRules?.configured ? "success" : "muted",
        action: t("aiCenter.actionConfigure"),
        accent: "indigo",
        complete: Boolean(data?.appointmentRules?.configured),
      },
      {
        id: 5,
        key: "behavior",
        title: t("aiCenter.stepBehaviorTitle"),
        desc: t("aiCenter.stepBehaviorDesc"),
        desktopTitle: t("aiCenter.desktopStepBehaviorTitle"),
        desktopDesc: t("aiCenter.desktopStepBehaviorDesc"),
        icon: MessageSquare,
        status: data?.behavior?.status || t("aiCenter.statusNotConfigured"),
        statusType: data?.behavior?.configured ? "success" : "muted",
        action: t("aiCenter.actionConfigure"),
        accent: "green",
        complete: Boolean(data?.behavior?.configured),
      },
      {
        id: 6,
        key: "automations",
        title: t("aiCenter.stepAutomationsTitle"),
        desc: t("aiCenter.stepAutomationsDesc"),
        desktopTitle: t("aiCenter.desktopStepAutomationsTitle"),
        desktopDesc: t("aiCenter.desktopStepAutomationsDesc"),
        desktopStatus: data?.automations?.configured
          ? data?.automations?.status || t("aiCenter.statusConnected")
          : t("aiCenter.desktopStatusNotSet"),
        icon: Zap,
        status: data?.automations?.status || t("aiCenter.statusNotConfigured"),
        statusType: data?.automations?.configured ? "success" : "muted",
        action: data?.automations?.configured
          ? t("aiCenter.actionEdit")
          : t("aiCenter.actionSetUp"),
        accent: "purple",
        complete: Boolean(data?.automations?.configured),
      },
      {
        id: 7,
        key: "testAi",
        title: t("aiCenter.stepTestTitle"),
        desc: t("aiCenter.stepTestDesc"),
        desktopTitle: t("aiCenter.desktopStepTestTitle"),
        desktopDesc: t("aiCenter.desktopStepTestDesc"),
        icon: TestTube2,
        status: data?.testAi?.status || t("aiCenter.statusNotTested"),
        statusType: data?.testAi?.tested ? "success" : "muted",
        action: t("aiCenter.actionTest"),
        accent: "pink",
        complete: Boolean(data?.testAi?.tested),
      },
      {
        id: 8,
        key: "launch",
        title: t("aiCenter.stepLaunchTitle"),
        desc: t("aiCenter.stepLaunchDesc"),
        desktopTitle: t("aiCenter.desktopStepLaunchTitle"),
        desktopDesc: t("aiCenter.desktopStepLaunchDesc"),
        icon: Rocket,
        status: data?.launch?.status || t("aiCenter.statusLocked"),
        statusType: data?.launch?.unlocked ? "success" : "locked",
        action: data?.launch?.unlocked
          ? t("aiCenter.actionLaunch")
          : t("aiCenter.statusLocked"),
        accent: "rose",
        complete: Boolean(data?.launch?.launched),
        locked: !data?.launch?.unlocked,
      },
    ];
  }, [setupData, whatsappSetup, t]);

  const completedSteps = Number(setupData?.completedSteps || 0);
  const totalSteps = Number(setupData?.totalSteps || 8);
  const progress = Number(setupData?.progress || 0);

  const handleStepAction = (step) => {
    switch (step.key) {
      case "businessProfile":
        onBusinessProfile?.();
        break;

      case "properties":
        onPropertyImport?.();
        break;

      case "appointmentRules":
        onAppointmentRules?.();
        break;

      case "behavior":
        onBehavior?.();
        break;

      case "automations":
        onAutomations?.();
        break;

      case "testAi":
        onTestAgent?.();
        break;

      case "launch":
        onLaunch?.();
        break;

      default:
        setOpenStep(step.id);
        break;
    }
  };

  return (
    <div className="cx-ai-setup-page">
      <header className="cx-ai-setup-topbar heading_page">
        <div className="cx-ai-setup-title-mobile">
          <h1>
            <Bot size={24} />
            {t("aiCenter.welcomeTitle")}
          </h1>
          <p className="sub_head">{t("aiCenter.welcomeSubtitle")}</p>
        </div>
        <div className="cx-ai-setup-title-desktop">
          <div className="cx-ai-setup-title-desktop-icon">
            <Sparkles size={30} />
          </div>
          <div>
            <h1>{t("aiCenter.desktopWelcomeTitle")}</h1>
            <p className="sub_head">{t("aiCenter.desktopWelcomeSubtitle")}</p>
          </div>
        </div>
      </header>

      <main className="cx-ai-setup-layout">
        <section className="cx-ai-setup-main">
          <h2>{t("aiCenter.setupProgressTitle")}</h2>

          <div className="cx-setup-list">
            {setupSteps.map((step) => {
              const Icon = step.icon;
              const isOpen = openStep === step.id;

              return (
                <article
                  key={step.id}
                  className={`cx-setup-step ${isOpen ? "is-open" : ""}`}
                >
                  <div className="cx-setup-step-head">
                    <div className="cx-setup-step-left">
                      <div
                        className={`cx-step-number cx-step-number-${step.accent} ${
                          isOpen ? "active" : ""
                        }`}
                      >
                        {step.id}
                      </div>

                      <div className={`cx-step-icon ${step.accent}`}>
                        <Icon size={24} />
                      </div>

                      <div>
                        <h3>
                          <span className="cx-step-copy-mobile">
                            {step.title}
                          </span>
                          <span className="cx-step-copy-desktop">
                            {step.desktopTitle || step.title}
                          </span>
                        </h3>
                        <p>
                          <span className="cx-step-copy-mobile">
                            {step.desc}
                          </span>
                          <span className="cx-step-copy-desktop">
                            {step.desktopDesc || step.desc}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="cx-setup-step-right">
                      <span
                        className={`cx-status-pill ${step.statusType} ${step.desktopHideStatus ? "cx-status-desktop-hidden" : ""}`}
                      >
                        {step.statusType === "success" && (
                          <CircleCheck size={15} />
                        )}
                        <span className="cx-step-copy-mobile">
                          {step.status}
                        </span>
                        <span className="cx-step-copy-desktop">
                          {step.desktopStatus || step.status}
                        </span>
                        {step.statusType === "locked" && <Lock size={13} />}
                      </span>

                      {step.id !== 1 && (
                        <button
                          type="button"
                          className={`cx-step-action cx-step-action-${step.accent} ${
                            step.locked ? "disabled" : ""
                          }`}
                          disabled={
                            step.locked ||
                            (step.key === "launch" && launchingAgent)
                          }
                          onClick={() => handleStepAction(step)}
                        >
                          {step.key === "launch" && launchingAgent ? (
                            t("aiCenter.launching")
                          ) : (
                            <>
                              <span className="cx-step-copy-mobile">
                                {step.action}
                              </span>
                              <span className="cx-step-copy-desktop">
                                {step.desktopAction || step.action}
                              </span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        className="cx-step-toggle"
                        onClick={() => setOpenStep(isOpen ? null : step.id)}
                      >
                        {isOpen ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isOpen && step.id === 1 && (
                    <div className="cx-desktop-whatsapp-connect-wrap">
                      <WhatsAppConnectCard
                        setupDesktopLayout
                        qr={whatsappSetup?.qr}
                        pairingCode={whatsappSetup?.pairingCode}
                        connected={whatsappSetup?.connected}
                        phone={whatsappSetup?.phone}
                        loading={whatsappSetup?.loading}
                        connecting={whatsappSetup?.connecting}
                        disconnecting={whatsappSetup?.disconnecting}
                        socketConnected={whatsappSetup?.socketConnected}
                        error={whatsappSetup?.error}
                        onConnect={whatsappSetup?.connect}
                        onConnectWithCode={whatsappSetup?.connectWithCode}
                        onDisconnect={whatsappSetup?.disconnect}
                        onRefreshQr={whatsappSetup?.refreshQr}
                      />
                    </div>
                  )}
                  {step.id === 2 && (
                    <div className="cx-workspace-recommendation-desktop">
                      <span className="cx-workspace-recommendation-label">
                        {t("aiCenter.desktopRecommendedForYou")}
                      </span>
                      <div className="cx-workspace-recommendation-copy">
                        <strong>
                          {t("aiCenter.desktopRecommendedWorkspaceTitle")}
                        </strong>
                        <span>
                          {t("aiCenter.desktopRecommendedWorkspaceDesc")}
                        </span>
                      </div>
                      <div className="cx-workspace-recommendation-price">
                        <strong>
                          {t("aiCenter.desktopRecommendedWorkspacePrice")}
                        </strong>
                      </div>
                      <div className="cx-workspace-recommendation-actions">
                        <button
                          type="button"
                          className="cx-workspace-explore-btn"
                          onClick={() => onExploreWorkspace?.("real-estate")}
                        >
                          {t("aiCenter.desktopExploreWorkspace")}
                        </button>
                        <button
                          type="button"
                          className="cx-workspace-not-now-btn"
                          onClick={() =>
                            onDismissWorkspaceRecommendation?.("real-estate")
                          }
                        >
                          {t("aiCenter.desktopNotNow")}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {launchError && (
              <div className="cx-ai-error-banner">{launchError}</div>
            )}
            <div className="cx-setup-progress-save">
              <div className="cx-setup-progress-save-left">
                <div className="cx-setup-progress-save-icon">
                  <ShieldCheck size={30} />
                </div>

                <div className="cx-setup-progress-save-copy">
                  <strong>{t("aiCenter.desktopProgressSaved")}</strong>
                  <span>{t("aiCenter.desktopContinueAnytime")}</span>
                </div>
              </div>

              <div className="cx-setup-progress-save-help">
                <span>{t("aiCenter.desktopNeedHelp")}</span>
                <a href="/support">
                  {t("aiCenter.desktopContactSupport")}{" "}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
