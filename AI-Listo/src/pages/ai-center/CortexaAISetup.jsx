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
  const setupSteps = useMemo(() => {
    const data = setupData || {};

    return [
      {
        id: 1,
        key: "whatsapp",
        title: "Connect WhatsApp",
        desc: "Connect the WhatsApp number your AI Agent will use.",
        icon: MessageSquare,
        status: whatsappSetup?.connected
          ? "Connected"
          : data?.whatsapp?.status || "Not connected",
        statusType:
          whatsappSetup?.connected || data?.whatsapp?.connected
            ? "success"
            : "danger",
        action:
          whatsappSetup?.connected || data?.whatsapp?.connected
            ? "Connected"
            : "Connect WhatsApp",
        accent: "green",
        complete: Boolean(
          whatsappSetup?.connected || data?.whatsapp?.connected,
        ),
      },
      {
        id: 2,
        key: "businessProfile",
        title: "Business Profile",
        desc: "Tell your AI Agent about your business.",
        icon: Building2,
        status: data?.businessProfile?.status || "Incomplete",
        statusType: data?.businessProfile?.completed ? "success" : "warning",
        action: data?.businessProfile?.completed ? "Edit" : "Set up",
        accent: "blue",
        complete: Boolean(data?.businessProfile?.completed),
      },
      {
        id: 3,
        key: "properties",
        title: "Import Properties",
        desc: "Add properties your AI can recommend.",
        icon: Home,
        status:
          data?.properties?.status ||
          `${Number(data?.properties?.imported || 0)} imported`,
        statusType:
          Number(data?.properties?.imported || 0) > 0
            ? "success"
            : "muted",
        action: "Import",
        accent: "orange",
        complete: Number(data?.properties?.imported || 0) > 0,
      },
      {
        id: 4,
        key: "appointmentRules",
        title: "Appointment Rules",
        desc: "Define when and how AI can book appointments.",
        icon: CalendarDays,
        status: data?.appointmentRules?.status || "Not configured",
        statusType: data?.appointmentRules?.configured
          ? "success"
          : "muted",
        action: "Configure",
        accent: "indigo",
        complete: Boolean(data?.appointmentRules?.configured),
      },
      {
        id: 5,
        key: "behavior",
        title: "AI Behavior",
        desc: "Define how your AI should talk and what to ask.",
        icon: MessageSquare,
        status: data?.behavior?.status || "Not configured",
        statusType: data?.behavior?.configured ? "success" : "muted",
        action: "Configure",
        accent: "green",
        complete: Boolean(data?.behavior?.configured),
      },
      {
        id: 6,
        key: "automations",
        title: "Automations",
        desc: "Choose what your AI Agent should do automatically.",
        icon: Zap,
        status: data?.automations?.status || "Not configured",
        statusType: data?.automations?.configured
          ? "success"
          : "muted",
        action: data?.automations?.configured ? "Edit" : "Set up",
        accent: "purple",
        complete: Boolean(data?.automations?.configured),
      },
      {
        id: 7,
        key: "testAi",
        title: "Test AI",
        desc: "Test your AI Agent in a safe environment.",
        icon: TestTube2,
        status: data?.testAi?.status || "Not tested",
        statusType: data?.testAi?.tested ? "success" : "muted",
        action: "Test",
        accent: "pink",
        complete: Boolean(data?.testAi?.tested),
      },
      {
        id: 8,
        key: "launch",
        title: "Launch AI Agent",
        desc: "Review and launch your AI Agent.",
        icon: Rocket,
        status: data?.launch?.status || "Locked",
        statusType: data?.launch?.unlocked ? "success" : "locked",
        action: data?.launch?.unlocked ? "Launch" : "Locked",
        accent: "rose",
        complete: Boolean(data?.launch?.launched),
        locked: !data?.launch?.unlocked,
      },
    ];
  }, [setupData, whatsappSetup]);

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
            Welcome! Let’s Get Your AI Agent Ready
          </h1>

          <p className="sub_head">
            Complete these 8 quick steps. Most customers finish setup in under
            5 minutes.
          </p>
        </div>
      </header>

      <main className="cx-ai-setup-layout">
        <section className="cx-ai-setup-main">
          <h2>Your setup progress</h2>

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
                            ? "Launching..."
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
            <h3>Overall Progress</h3>

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
                  {completedSteps} of {totalSteps} steps completed
                </strong>

                <p>
                  {progress === 100
                    ? "Great work!"
                    : "You’re doing great!"}
                </p>

                <p>
                  {progress === 100
                    ? "Your AI Agent is ready."
                    : "Let’s finish setting up your AI Agent."}
                </p>
              </div>
            </div>
          </div>

          <div className="cx-side-card">
            <h3>AI Setup Status</h3>

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
              Setup Tips
            </h3>

            <div className="cx-tips-list">
              <p>
                <CheckCircle2 size={18} />
                You can edit these settings anytime
              </p>

              <p>
                <CheckCircle2 size={18} />
                Your progress is saved automatically
              </p>

              <p>
                <CheckCircle2 size={18} />
                Most customers finish in under 5 minutes
              </p>

              <p>
                <CheckCircle2 size={18} />
                Need help? Contact our support team
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}