import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  Headphones,
  Info,
  MessageCircle,
  Mic2,
  Phone,
  PhoneCall,
  Play,
  Radio,
  Route,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  UserRound,
  Globe2,
} from "lucide-react";
import { useSetup } from "./useSetup";
import { setupLanguage } from "./setupTranslations";
import "./setup.css";
import "./business-phone-pass3.css";

const COPY = {
  en: {
    crumbs: [
      "AI Agent Setup",
      "Customer Entry Points",
      "Business Phone, Voice & SMS",
    ],
    title: "Business Phone, Voice & SMS",
    subtitle:
      "Connect your business number and configure how Cortexa handles calls, SMS, voice, and human handoff.",
    status: "In progress",
    save: "Save & Exit",
    testNumber: "Test Number",
    progress: "Customer Entry Points",
    sections: "sections complete",
    nav: [
      "Customer Channels",
      "Website & Primary CTA",
      "Business Phone, Voice & SMS",
      "WhatsApp",
      "Marketing Links & Traffic Pages",
      "Consent & Source Tracking",
      "Conversion Objective",
      "CRM & Pipeline Routing",
      "Test Connection",
    ],
    complete: "Complete",
    inProgress: "In progress",
    notStarted: "Not started",
    auto: "Progress saves automatically.",
    objective: "Selected objective:",
    goal: "Help customers purchase",
    change: "Change goal",
    connect: "Connect your business number",
    connectSub:
      "Use the number customers already know, or activate a new Cortexa business number.",
    existing: "Use Existing Number",
    activate: "Activate New Number",
    connected: "Connected",
    verified: "Verified complete",
    changeNumber: "Change Number",
    manage: "Manage",
    channels: "Customer channels",
    voiceCalls: "Voice Calls",
    voiceCallsSub: "Allow customers to call and speak with your AI agent.",
    sms: "SMS Messages",
    smsSub: "Receive and respond to customer text messages.",
    identity: "Business caller identity",
    displayName: "Business display name",
    country: "Country / region",
    language: "Default language",
    voice: "Voice settings",
    aiVoice: "AI voice",
    greeting: "Call greeting",
    recording: "Call recording",
    recordingSub:
      "Record calls for quality and training. Customer consent is required.",
    routing: "Call routing & human handoff",
    during: "During business hours",
    after: "After hours",
    transfer: "Human transfer number",
    advanced: "Configure Advanced Routing",
    journey: "Live Call Journey",
    journeySub: "Here's how it works when a customer calls this number.",
    journeyRows: [
      ["Customer calls", "Business number receives the call"],
      ["Cortexa answers", "AI greeting and intent detection"],
      [
        "Customer identified",
        "Existing contact matched or new contact created",
      ],
      ["Conversation handled", "Questions, qualification, and next action"],
      ["CRM updated", "Source, notes, and pipeline activity saved"],
      ["Human handoff", "Transfer when requested or required"],
    ],
    test: "Test Your Number",
    testSub: "Run a real call test before launch.",
    callConnected: "Call connected",
    run: "Run Test Call",
    capabilities: ["Voice enabled", "SMS enabled", "Caller ID ready"],
    back: "Back to Website & Primary CTA",
    saved: "All changes saved",
    next: "Save & Continue to WhatsApp",
    existingNumber: "Connected business number",
    callerId: "Caller ID",
    businessHours: "Business hours",
    select: "Select",
    english: "English (US)",
    female: "Cortexa — Ava",
    greetingValue: "",
  },
  es: {
    crumbs: [
      "Configuración del agente de IA",
      "Puntos de entrada del cliente",
      "Teléfono, voz y SMS",
    ],
    title: "Teléfono empresarial, voz y SMS",
    subtitle:
      "Conecta tu número empresarial y configura cómo Cortexa gestiona llamadas, SMS, voz y transferencias humanas.",
    status: "En progreso",
    save: "Guardar y salir",
    testNumber: "Probar número",
    progress: "Puntos de entrada del cliente",
    sections: "secciones completadas",
    nav: [
      "Canales de clientes",
      "Sitio web y CTA principal",
      "Teléfono, voz y SMS",
      "WhatsApp",
      "Enlaces de marketing y páginas de tráfico",
      "Consentimiento y seguimiento de origen",
      "Objetivo de conversión",
      "CRM y enrutamiento del pipeline",
      "Probar conexión",
    ],
    complete: "Completado",
    inProgress: "En progreso",
    notStarted: "No iniciado",
    auto: "El progreso se guarda automáticamente.",
    objective: "Objetivo seleccionado:",
    goal: "Ayudar a los clientes a comprar",
    change: "Cambiar objetivo",
    connect: "Conecta tu número empresarial",
    connectSub:
      "Usa el número que tus clientes ya conocen o activa un nuevo número empresarial de Cortexa.",
    existing: "Usar número existente",
    activate: "Activar nuevo número",
    connected: "Conectado",
    verified: "Verificación completa",
    changeNumber: "Cambiar número",
    manage: "Administrar",
    channels: "Canales de clientes",
    voiceCalls: "Llamadas de voz",
    voiceCallsSub:
      "Permite que los clientes llamen y hablen con tu agente de IA.",
    sms: "Mensajes SMS",
    smsSub: "Recibe y responde mensajes de texto.",
    identity: "Identidad de llamada empresarial",
    displayName: "Nombre empresarial",
    country: "País / región",
    language: "Idioma predeterminado",
    voice: "Configuración de voz",
    aiVoice: "Voz de IA",
    greeting: "Saludo de llamada",
    recording: "Grabación de llamadas",
    recordingSub:
      "Graba llamadas para calidad y entrenamiento. Se requiere consentimiento.",
    routing: "Enrutamiento de llamadas y transferencia humana",
    during: "Durante horario comercial",
    after: "Fuera de horario",
    transfer: "Número de transferencia humana",
    advanced: "Configurar enrutamiento avanzado",
    journey: "Recorrido de llamada en vivo",
    journeySub: "Así es como funciona cuando un cliente llama a este número.",
    journeyRows: [
      ["El cliente llama", "El número empresarial recibe la llamada"],
      ["Cortexa responde", "Saludo de IA y detección de intención"],
      [
        "Cliente identificado",
        "Se vincula contacto existente o se crea uno nuevo",
      ],
      ["Conversación gestionada", "Preguntas, calificación y próxima acción"],
      ["CRM actualizado", "Origen, notas y actividad guardados"],
      ["Transferencia humana", "Transferencia cuando se solicita o requiere"],
    ],
    test: "Prueba tu número",
    testSub: "Ejecuta una llamada real antes del lanzamiento.",
    callConnected: "Llamada conectada",
    run: "Ejecutar llamada de prueba",
    capabilities: ["Voz habilitada", "SMS habilitado", "ID de llamada listo"],
    back: "Volver a Sitio web y CTA",
    saved: "Todos los cambios guardados",
    next: "Guardar y continuar a WhatsApp",
    existingNumber: "Número empresarial conectado",
    callerId: "ID de llamada",
    businessHours: "Horario comercial",
    select: "Seleccionar",
    english: "Inglés (EE. UU.)",
    female: "Cortexa — Ava",
    greetingValue: "",
  },
  pt: {
    crumbs: [
      "Configuração do agente de IA",
      "Pontos de entrada do cliente",
      "Telefone, voz e SMS",
    ],
    title: "Telefone comercial, voz e SMS",
    subtitle:
      "Conecte seu número comercial e configure como a Cortexa gerencia chamadas, SMS, voz e transferência humana.",
    status: "Em andamento",
    save: "Salvar e sair",
    testNumber: "Testar número",
    progress: "Pontos de entrada do cliente",
    sections: "seções concluídas",
    nav: [
      "Canais de clientes",
      "Site e CTA principal",
      "Telefone, voz e SMS",
      "WhatsApp",
      "Links de marketing e páginas de tráfego",
      "Consentimento e rastreamento de origem",
      "Objetivo de conversão",
      "CRM e roteamento do pipeline",
      "Testar conexão",
    ],
    complete: "Concluído",
    inProgress: "Em andamento",
    notStarted: "Não iniciado",
    auto: "O progresso é salvo automaticamente.",
    objective: "Objetivo selecionado:",
    goal: "Ajudar clientes a comprar",
    change: "Alterar objetivo",
    connect: "Conecte seu número comercial",
    connectSub:
      "Use o número que seus clientes já conhecem ou ative um novo número comercial Cortexa.",
    existing: "Usar número existente",
    activate: "Ativar novo número",
    connected: "Conectado",
    verified: "Verificação concluída",
    changeNumber: "Alterar número",
    manage: "Gerenciar",
    channels: "Canais de clientes",
    voiceCalls: "Chamadas de voz",
    voiceCallsSub:
      "Permita que clientes liguem e conversem com seu agente de IA.",
    sms: "Mensagens SMS",
    smsSub: "Receba e responda mensagens de texto.",
    identity: "Identidade de chamada comercial",
    displayName: "Nome comercial",
    country: "País / região",
    language: "Idioma padrão",
    voice: "Configurações de voz",
    aiVoice: "Voz da IA",
    greeting: "Saudação da chamada",
    recording: "Gravação de chamadas",
    recordingSub:
      "Grave chamadas para qualidade e treinamento. O consentimento do cliente é obrigatório.",
    routing: "Roteamento de chamadas e transferência humana",
    during: "Durante o horário comercial",
    after: "Fora do horário",
    transfer: "Número de transferência humana",
    advanced: "Configurar roteamento avançado",
    journey: "Jornada de chamada ao vivo",
    journeySub:
      "Veja como funciona quando um cliente liga para este número.",
    journeyRows: [
      ["Cliente liga", "O número comercial recebe a chamada"],
      ["Cortexa atende", "Saudação da IA e detecção de intenção"],
      [
        "Cliente identificado",
        "Contato existente vinculado ou novo contato criado",
      ],
      ["Conversa atendida", "Perguntas, qualificação e próxima ação"],
      ["CRM atualizado", "Origem, notas e atividade salvas"],
      ["Transferência humana", "Transferência quando solicitada ou necessária"],
    ],
    test: "Teste seu número",
    testSub: "Execute uma chamada real antes do lançamento.",
    callConnected: "Chamada conectada",
    run: "Executar chamada de teste",
    capabilities: ["Voz habilitada", "SMS habilitado", "ID de chamada pronto"],
    back: "Voltar para Site e CTA principal",
    saved: "Todas as alterações salvas",
    next: "Salvar e continuar para WhatsApp",
    existingNumber: "Número comercial conectado",
    callerId: "ID de chamada",
    businessHours: "Horário comercial",
    select: "Selecionar",
    english: "Inglês (EUA)",
    female: "Cortexa — Ava",
    greetingValue: "",
  },
};

const navIcons = [
  Share2,
  Globe2,
  Phone,
  MessageCircle,
  Target,
  ShieldCheck,
  Sparkles,
  Route,
  TestTube2,
];
const journeyIcons = [
  PhoneCall,
  Sparkles,
  UserRound,
  MessageCircle,
  Database,
  Headphones,
];

export default function BusinessPhoneSetup() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = setupLanguage(i18n);
  const t = COPY[lang] || COPY.en;

  const { data, state, save } = useSetup();

  const [mode, setMode] = useState("existing");
  const [testing, setTesting] = useState(false);
  const connectRef = useRef(null);

  /*
   * IMPORTANT:
   * Hooks phải luôn chạy cùng thứ tự ở mọi render.
   * Vì vậy không đặt useMemo() phía sau `if (!data) return`.
   */
  const c = data?.config || {};
  const phone = c.phone || {};
  const current = 2;

  const completed = useMemo(() => {
    return [
      (c.customerChannels || []).length > 0,

      !!(c.website?.url && c.website?.ctaLabel && c.website?.destination),

      c.phone?.connectionStatus === "connected",

      c.whatsapp?.connected === true,

      !!c.marketing?.primaryPage,

      !!c.consent?.configured,

      !!(c.conversion?.objective || c.conversion?.desiredAction),

      !!(c.routing?.pipelineId && c.routing?.stageId),

      Array.isArray(data?.tests) && data.tests.some((x) => x.status === "pass"),
    ];
  }, [
    c.customerChannels,
    c.website,
    c.whatsapp,
    c.marketing,
    c.consent,
    c.conversion,
    c.routing,
    data?.tests,
  ]);

  /*
   * Early return phải nằm SAU tất cả hooks.
   */
  if (!data) {
    return (
      <main className="setup-shell phone3-page">
        <div className="setup-loading">Loading setup…</div>
      </main>
    );
  }

  const completeCount = completed.filter(Boolean).length;

  const pct = Math.round((completeCount / 9) * 100);

  const patch = (obj, immediate = false) => {
    save(
      {
        phone: {
          ...phone,
          ...obj,
        },
      },
      immediate,
    );
  };

  const isConnected =
    phone.connectionStatus === "connected" &&
    phone.providerVerified === true;

  const voiceReady =
    isConnected &&
    phone.providerCapabilities?.voice === true;

  const smsReady =
    isConnected &&
    phone.providerCapabilities?.sms === true;

  const callerIdReady =
    isConnected &&
    phone.providerCapabilities?.callerId === true &&
    phone.callerIdVerified === true;

  const voiceEnabled = voiceReady && phone.voiceEnabled === true;

  const smsEnabled = smsReady && phone.smsEnabled === true;

  const recording = !!phone.callRecording;

  return (
    <main className="setup-shell phone3-page">
      <div className="phone3-crumb">
        {t.crumbs.map((x, i) => (
          <span key={x}>
            {i > 0 && <ChevronRight />}
            <b className={i === 2 ? "active" : ""}>{x}</b>
          </span>
        ))}
      </div>

      <header className="phone3-header">
        <span className="phone3-title-icon">
          <Phone />
        </span>
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <span className="phone3-status">
          <Info />
          {t.status}
        </span>
        <button className="phone3-outline" onClick={() => navigate("/dashboard/ai-cortexa-setup")}>{t.save}</button>
        <button className="phone3-outline" onClick={() => document.querySelector(".phone3-test")?.scrollIntoView({behavior:"smooth",block:"center"})}>
          <PhoneCall />
          {t.testNumber}
        </button>
      </header>

      <section className="phone3-progress">
        <b>{t.progress}</b>
        <span>
          {completeCount} of 9 {t.sections}
        </span>
        <div>
          <i style={{ width: `${pct}%` }} />
        </div>
        <strong>{pct}% complete</strong>
      </section>

      <div className="phone3-layout">
        <aside className="phone3-nav">
          {t.nav.map((label, i) => {
            const done = completed[i];
            const active = i === current;
            return (
              <button key={label} className={active ? "active" : ""} onClick={() => {
                if (i === 2) return;
                const keys=["channels","website","phone","whatsapp","marketing","consent","conversion","routing","test"];
                navigate(`/dashboard/ai-cortexa-setup/customer-entry-points?section=${keys[i]}`);
              }}>
                <span className={`phone3-step-wrap ${done ? "done" : ""}`}>
                  <span className={`phone3-num ${active ? "active" : ""}`}>{i + 1}</span>
                  {done && <span className="phone3-complete-check"><Check /></span>}
                </span>
                <span className="phone3-nav-copy">
                  <b>{label}</b>
                  <small className={done ? "done" : active ? "active" : ""}>
                    {done ? t.complete : active ? t.inProgress : t.notStarted}
                  </small>
                </span>
              </button>
            );
          })}
          <div className="phone3-autosave">
            <Info />
            {t.auto}
          </div>
        </aside>

        <section className="phone3-main">
          <div className="phone3-objective">
            <span className="phone3-objective-icon"><Target /></span>
            <div className="phone3-objective-copy">
              <div><small>{t.objective}</small>
              <b>{data.selected_objective || t.goal}</b>
              </div>
              <div>This number will answer product questions, capture customer information, and guide callers toward checkout or a human team member.</div>
            </div>
            <button onClick={() => navigate("/dashboard/ai-cortexa-setup")}>
              {t.change}<ChevronRight />
            </button>
          </div>

          <section className="phone3-section" ref={connectRef}>
            <div className="phone3-section-head">
              <div>
                <h2>{t.connect}</h2>
                <p>{t.connectSub}</p>
              </div>
            </div>
            <div className="phone3-tabs">
              <button
                className={mode === "existing" ? "active" : ""}
                onClick={() => setMode("existing")}
              >
                {t.existing}
              </button>
              <button
                className={mode === "new" ? "active" : ""}
                onClick={() => setMode("new")}
              >
                {t.activate}
              </button>
            </div>
            <div className="phone3-number">
              <span className="phone3-phone-icon"><Phone /></span>
              <div className="phone3-number-copy">
                {mode === "existing" ? (
                  <>
                    <input
                      value={phone.number || ""}
                      placeholder="+1 305 555 0100"
                      onChange={(e) => patch({ number: e.target.value, connectionStatus: "pending" })}
                      onBlur={() => patch({ number: phone.number || "", connectionStatus: phone.number ? "pending" : "disconnected" }, true)}
                    />
                    <em>{phone.number ? "Saved — verification/provider connection still required" : "Enter the existing business number"}</em>
                  </>
                ) : (
                  <>
                    <b>New-number activation requires the configured phone provider.</b>
                    <em>No number will be marked connected until the provider confirms activation.</em>
                  </>
                )}
              </div>
              <button onClick={() => { patch({ number:"", callerId:"", connectionStatus:"disconnected", voiceEnabled:false, smsEnabled:false }, true); setMode("existing"); }}>{t.changeNumber}</button>
              <button onClick={() => document.querySelector(".phone3-fields.three")?.scrollIntoView({behavior:"smooth",block:"center"})}>{t.manage}</button>
            </div>
          </section>

          <section className="phone3-section">
            <h2>{t.channels}</h2>
            <div className="phone3-channel-grid">
              <div>
                <span className="phone3-channel-icon">
                  <PhoneCall />
                </span>
                <div>
                  <b>{t.voiceCalls}</b>
                  <small>{t.voiceCallsSub}</small>
                </div>
                <button
                  className={voiceEnabled ? "on" : ""}
                  disabled={!voiceReady}
                  title={!voiceReady ? "Voice is available only after the phone provider confirms voice capability." : ""}
                  onClick={() => patch({ voiceEnabled: !voiceEnabled }, true)}
                >
                  <i />
                </button>
              </div>
              <div>
                <span className="phone3-channel-icon sms">
                  <MessageCircle />
                </span>
                <div>
                  <b>{t.sms}</b>
                  <small>{t.smsSub}</small>
                </div>
                <button
                  className={smsEnabled ? "on" : ""}
                  disabled={!smsReady}
                  title={!smsReady ? "SMS is available only after the phone provider confirms SMS capability." : ""}
                  onClick={() => patch({ smsEnabled: !smsEnabled }, true)}
                >
                  <i />
                </button>
              </div>
            </div>
          </section>

          <section className="phone3-section">
            <h2>{t.identity}</h2>
            <div className="phone3-fields three">
              <label>
                <span>{t.displayName}</span>
                <input
                  value={phone.displayName || ""}
                  onChange={(e) => patch({ displayName: e.target.value })}
                  onBlur={() =>
                    patch({ displayName: phone.displayName || "" }, true)
                  }
                />
              </label>
              <label>
                <span>{t.country}</span>
                <select
                  value={phone.country || ""}
                  onChange={(e) => patch({ country: e.target.value }, true)}
                >
                  <option value="">{t.select}</option><option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                </select>
              </label>
              <label>
                <span>{t.language}</span>
                <select
                  value={phone.language || ""}
                  onChange={(e) => patch({ language: e.target.value }, true)}
                >
                  <option value="">{t.select}</option><option>{t.english}</option>
                  <option>Spanish</option>
                  <option>Portuguese</option>
                </select>
              </label>
            </div>
          </section>

          <section className="phone3-section">
            <h2>{t.voice}</h2>
            <div className="phone3-fields voice">
              <label>
                <span>{t.aiVoice}</span>
                <select
                  value={phone.aiVoice || ""}
                  onChange={(e) => patch({ aiVoice: e.target.value }, true)}
                >
                  <option value="">{t.select}</option><option>{t.female}</option>
                  <option>Cortexa — Noah</option>
                </select>
              </label>
              <label className="greeting">
                <span>{t.greeting}</span>
                <input
                  value={phone.greeting || ""}
                  onChange={(e) => patch({ greeting: e.target.value })}
                  onBlur={() =>
                    patch({ greeting: phone.greeting || "" }, true)
                  }
                />
              </label>
            </div>
            <div className="phone3-record">
              <span>
                <Mic2 />
              </span>
              <div>
                <b>{t.recording}</b>
                <small>{t.recordingSub}</small>
              </div>
              <button
                className={recording ? "on" : ""}
                onClick={() => patch({ callRecording: !recording }, true)}
              >
                <i />
              </button>
            </div>
          </section>

          <section className="phone3-section">
            <h2>{t.routing}</h2>
            <div className="phone3-fields three">
              <label>
                <span>{t.during}</span>
                <select
                  value={phone.duringHours || "AI answers first"}
                  onChange={(e) => patch({ duringHours: e.target.value }, true)}
                >
                  <option>AI answers first</option>
                  <option>Ring team first</option>
                  <option>Human only</option>
                </select>
              </label>
              <label>
                <span>{t.after}</span>
                <select
                  value={phone.afterHours || "AI answers"}
                  onChange={(e) => patch({ afterHours: e.target.value }, true)}
                >
                  <option>AI answers</option>
                  <option>Voicemail</option>
                  <option>Forward call</option>
                </select>
              </label>
              <label>
                <span>{t.transfer}</span>
                <input
                  value={phone.transferNumber || ""}
                  placeholder="+1 ..."
                  onChange={(e) => patch({ transferNumber: e.target.value })}
                  onBlur={() =>
                    patch({ transferNumber: phone.transferNumber || "" }, true)
                  }
                />
              </label>
            
            <button className="phone3-advanced" onClick={() => navigate("/dashboard/ai-cortexa-setup/customer-entry-points?section=routing")}>
              <Settings2 />
              {t.advanced}
              <ChevronRight />
            </button>
            </div>
          </section>
        </section>

        <aside className="phone3-right">
          <section className="phone3-right-card">
            <h2>{t.journey}</h2>
            <p>{t.journeySub}</p>
            <div className="phone3-journey">
              {t.journeyRows.map(([a, b], i) => {
                const Icon = journeyIcons[i];
                return (
                  <div key={a}>
                    <span>{i + 1}</span>
                    <i>
                      <Icon />
                    </i>
                    <section>
                      <b>{a}</b>
                      <small>{b}</small>
                    </section>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="phone3-test">
            <div className="phone3-test-head">
              <span>
                <TestTube2 />
              </span>
              <div>
                <h2>{t.test}</h2>
                <p>{t.testSub}</p>
              </div>
            </div>
            <div className="phone3-test-number">
              <small>{t.existingNumber}</small>
              <b>{phone.number || "—"}</b>
            </div>
            {phone.testStatus === "connected" && (
              <div className="phone3-call-ok">
                <CheckCircle2 />
                {t.callConnected}
              </div>
            )}
            <div className="phone3-wave">
              {[8, 15, 25, 12, 30, 20, 10, 24, 34, 18, 9, 27, 15, 22, 8].map(
                (h, i) => (
                  <i key={i} style={{ height: h }} />
                ),
              )}
            </div>
            <button
              className="phone3-run"
              disabled={true}
              title="A real phone-provider test-call endpoint must be connected before this action is enabled."
            >
              <Play />
              {testing ? "Testing…" : t.run}
            </button>
            <div className="phone3-caps">
              {t.capabilities.map((x, i) => {
                const ready = [
                  voiceReady,
                  smsReady,
                  callerIdReady,
                ][i];
                return (
                  <span key={x} className={ready ? "ready" : "pending"}>
                    {ready ? <CheckCircle2 /> : <Info />}
                    {x}
                  </span>
                );
              })}
            </div>
            {!isConnected && (
              <p className="phone3-real-note">
                <Info />
                Connect and verify the business number before running a real
                test call.
              </p>
            )}
          </section>
        </aside>
      </div>

      <footer className="phone3-footer">
        <button
          className="phone3-back"
          onClick={() =>
            navigate("/dashboard/ai-cortexa-setup/customer-entry-points")
          }
        >
          <ArrowLeft />
          {t.back}
        </button>
        <span>
          <CheckCircle2 />
          {state || t.saved}
        </span>
        <button
          className="phone3-next"
          onClick={() =>
            navigate(
              "/dashboard/ai-cortexa-setup/customer-entry-points?section=whatsapp",
            )
          }
        >
          {t.next}
          <ArrowRight />
        </button>
      </footer>
    </main>
  );
}