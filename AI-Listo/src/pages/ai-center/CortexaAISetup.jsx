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
        icon: Home,
        status:
          data?.properties?.status ||
          t("aiCenter.statusImported", {
            count: Number(data?.properties?.imported || 0),
          }),
        statusType:
          Number(data?.properties?.imported || 0) > 0
            ? "success"
            : "muted",
        action: t("aiCenter.actionImport"),
        accent: "orange",
        complete: Number(data?.properties?.imported || 0) > 0,
      },
      {
        id: 4,
        key: "appointmentRules",
        title: t("aiCenter.stepAppointmentTitle"),
        desc: t("aiCenter.stepAppointmentDesc"),
        icon: CalendarDays,
        status:
          data?.appointmentRules?.status || t("aiCenter.statusNotConfigured"),
        statusType: data?.appointmentRules?.configured
          ? "success"
          : "muted",
        action: t("aiCenter.actionConfigure"),
        accent: "indigo",
        complete: Boolean(data?.appointmentRules?.configured),
      },
      {
        id: 5,
        key: "behavior",
        title: t("aiCenter.stepBehaviorTitle"),
        desc: t("aiCenter.stepBehaviorDesc"),
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
        icon: Zap,
        status: data?.automations?.status || t("aiCenter.statusNotConfigured"),
        statusType: data?.automations?.configured
          ? "success"
          : "muted",
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
        <div>
          <h1>
            <Bot size={24} />
            {t("aiCenter.welcomeTitle")}
          </h1>

          <p className="sub_head">{t("aiCenter.welcomeSubtitle")}</p>
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
                  className={`cx-setup-step ${
                    isOpen ? "is-open" : ""
                  }`}
                >
                  <div className="cx-setup-step-head">
                    <div className="cx-setup-step-left">
                      <div
                        className={`cx-step-number ${
                          isOpen ? "active" : ""
                        }`}
                      >
                        {step.id}
                      </div>

                      <div className={`cx-step-icon ${step.accent}`}>
                        <Icon size={24} />
                      </div>

                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                      </div>
                    </div>

                    <div className="cx-setup-step-right">
                      <span
                        className={`cx-status-pill ${step.statusType}`}
                      >
                        {step.status}
                      </span>

                      {step.id !== 1 && (
                        <button
                          type="button"
                          className={`cx-step-action ${
                            step.locked ? "disabled" : ""
                          }`}
                          disabled={
                            step.locked ||
                            (step.key === "launch" && launchingAgent)
                          }
                          onClick={() => handleStepAction(step)}
                        >
                          {step.key === "launch" && launchingAgent
                            ? t("aiCenter.launching")
                            : step.action}
                        </button>
                      )}

                      <button
                        type="button"
                        className="cx-step-toggle"
                        onClick={() =>
                          setOpenStep(isOpen ? null : step.id)
                        }
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
                    <WhatsAppConnectCard
                      qr={whatsappSetup?.qr}
                      connected={whatsappSetup?.connected}
                      phone={whatsappSetup?.phone}
                      loading={whatsappSetup?.loading}
                      connecting={whatsappSetup?.connecting}
                      disconnecting={whatsappSetup?.disconnecting}
                      socketConnected={whatsappSetup?.socketConnected}
                      error={whatsappSetup?.error}
                      onConnect={whatsappSetup?.connect}
                      onDisconnect={whatsappSetup?.disconnect}
                      onRefreshQr={whatsappSetup?.refreshQr}
                    />
                  )}
                </article>
              );
            })}

            {launchError && (
              <div className="cx-ai-error-banner">
                {launchError}
              </div>
            )}
          </div>
        </section>

        <aside className="cx-ai-setup-sidebar">
          <div className="cx-side-card cx-progress-card">
            <h3>{t("aiCenter.overallProgress")}</h3>

            <div className="cx-progress-row">
              <div
                className="cx-progress-circle"
                style={{
                  "--progress": `${progress * 3.6}deg`,
                }}
              >
                <span>{progress}%</span>
              </div>

              <div>
                <strong>
                  {t("aiCenter.stepsCompleted", {
                    completed: completedSteps,
                    total: totalSteps,
                  })}
                </strong>

                <p>
                  {progress === 100
                    ? t("aiCenter.greatWork")
                    : t("aiCenter.doingGreat")}
                </p>

                <p>
                  {progress === 100
                    ? t("aiCenter.agentReady")
                    : t("aiCenter.finishSetup")}
                </p>
              </div>
            </div>
          </div>

          <div className="cx-side-card">
            <h3>{t("aiCenter.aiSetupStatus")}</h3>

            {setupSteps.map((row) => {
              const Icon = row.icon;

              return (
                <div className="cx-status-row" key={row.id}>
                  <div className="cx-status-name">
                    <Icon className={row.accent} size={22} />
                    <span>{row.title}</span>
                  </div>

                  <div
                    className={`cx-status-value ${
                      row.complete
                        ? "success"
                        : row.locked
                          ? "locked"
                          : "pending"
                    }`}
                  >
                    {row.complete ? (
                      <CircleCheck size={15} />
                    ) : row.locked ? (
                      <Lock size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}

                    {row.status}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cx-side-card">
            <h3 className="cx-tips-title">
              <Settings2 size={22} />
              {t("aiCenter.setupTips")}
            </h3>

            <div className="cx-tips-list">
              <p>
                <CheckCircle2 size={18} />
                {t("aiCenter.tipEditAnytime")}
              </p>

              <p>
                <CheckCircle2 size={18} />
                {t("aiCenter.tipProgressSaved")}
              </p>

              <p>
                <CheckCircle2 size={18} />
                {t("aiCenter.tipFinishFast")}
              </p>

              <p>
                <CheckCircle2 size={18} />
                {t("aiCenter.tipNeedHelp")}
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}