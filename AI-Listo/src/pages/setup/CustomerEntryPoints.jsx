import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Share2, Check, Link2, ShoppingCart, UserRound, MousePointer2,
  Sparkles, Database, Network, CheckSquare, Info, ArrowLeft,
  ArrowRight, Globe2, Phone, MessageCircle, Megaphone, ShieldCheck,
  Target, GitBranch, FlaskConical, ExternalLink, ChevronRight
} from "lucide-react";
import { useSetup } from "./useSetup";
import { setupApi } from "./setupApi";
import { setupCopy, setupLanguage } from "./setupTranslations";
import websiteMobilePreview from "../../assets/cortexa/website-mobile-preview.png";
import "./setup.css";

const sectionKeys = [
  "channels", "website", "phone", "whatsapp", "marketing",
  "consent", "conversion", "routing", "test"
];

const sectionIcons = [
  Share2, Globe2, Phone, MessageCircle, Megaphone,
  ShieldCheck, Target, GitBranch, FlaskConical
];

const labels = {
  en: [
    "Customer Channels", "Website & Primary CTA", "Business Phone, Voice & SMS",
    "WhatsApp", "Marketing Links & Traffic Pages", "Consent & Source Tracking",
    "Conversion Objective", "CRM & Pipeline Routing", "Test Connection"
  ],
  es: [
    "Canales de clientes", "Sitio web y CTA principal", "Teléfono, voz y SMS",
    "WhatsApp", "Enlaces de marketing y páginas de tráfico", "Consentimiento y seguimiento de origen",
    "Objetivo de conversión", "CRM y enrutamiento del pipeline", "Probar conexión"
  ],
  pt: [
    "Canais de clientes", "Site e CTA principal", "Telefone, voz e SMS",
    "WhatsApp", "Links de marketing e páginas de tráfego", "Consentimento e rastreamento de origem",
    "Objetivo de conversão", "CRM e roteamento do pipeline", "Testar conexão"
  ]
};

const copy = {
  en: {
    breadcrumb:"AI Agent Setup", current:"Customer Entry Points", progress:"Entry Point Setup",
    complete:"Complete", inProgress:"In progress", notStarted:"Not started", needsAttention:"Needs attention",
    saveExit:"Save & Exit", preview:"Preview Flow", sectionsComplete:"sections complete",
    webTitle:"Website & Primary Conversion Button",
    webSub:"Configure where your primary CTA appears and what happens when a customer clicks it.",
    businessWebsite:"Business website", verified:"Verified", verify:"Verify",
    primaryGoal:"Primary conversion goal", selectedWorkspace:"Selected for this workspace", changeGoal:"Change goal",
    placementTitle:"Where should the primary button appear?",
    placements:["Product pages","Pricing page","Campaign pages","Home page (optional)"],
    settings:"Button settings", buttonLabel:"Button label", buttonStyle:"Button style",
    destination:"Destination", afterClick:"After-click action", websiteMessage:"Website message", websiteMessageHelp:"This message opens the AI conversation when someone clicks your button.",
    whatsappTitle:"WhatsApp as an additional channel", manage:"Manage Channel",
    tracking:"Track page, campaign, product, and source context", trackingHelp:"Capture UTM, referrer, product and page data.", createContact:"Create CRM contact automatically", createContactHelp:"New contacts are created from every conversation.", previewChecks:["Source tracked","Product context","Pipeline ready"],
    journey:"Live Customer Journey", journeySub:"Here's what happens when someone uses your primary CTA.",
    journeySteps:[
      ["Visitor arrives","Source and page are recorded"],["Primary CTA clicked","AI-assisted conversation opens"],
      ["Cortexa AI Agent responds","Answers questions and qualifies intent"],["Contact captured","CRM record created automatically"],
      ["Correct pipeline selected","Source, product, and intent determine routing"],["Conversion or human handoff","Checkout opens or team member takes over"]
    ],
    mobilePreview:"Website preview (mobile)", back:"Back to AI Agent Setup",
    help:"Need help with your website or connections?", request:"Request assistance",
    continue:"Save & Continue to Business Phone", recommended:"Recommended for your goal",
    buyNow:"Buy Now", chatWhatsapp:"Chat on WhatsApp", yourBusiness:"Your business",
    hero:"Quality products for a better tomorrow"
  },
  es: {
    breadcrumb:"Configuración del agente de IA", current:"Puntos de entrada del cliente", progress:"Configuración de puntos de entrada",
    complete:"Completado", inProgress:"En progreso", notStarted:"No iniciado", needsAttention:"Requiere atención",
    saveExit:"Guardar y salir", preview:"Vista previa del flujo", sectionsComplete:"secciones completadas",
    webTitle:"Sitio web y botón principal de conversión",
    webSub:"Configura dónde aparece tu CTA principal y qué sucede cuando un cliente hace clic.",
    businessWebsite:"Sitio web del negocio", verified:"Verificado", verify:"Verificar",
    primaryGoal:"Objetivo principal de conversión", selectedWorkspace:"Seleccionado para este espacio", changeGoal:"Cambiar objetivo",
    placementTitle:"¿Dónde debe aparecer el botón principal?",
    placements:["Páginas de productos","Página de precios","Páginas de campaña","Página de inicio (opcional)"],
    settings:"Configuración del botón", buttonLabel:"Texto del botón", buttonStyle:"Estilo del botón",
    destination:"Destino", afterClick:"Acción después del clic", websiteMessage:"Mensaje del sitio web", websiteMessageHelp:"Este mensaje abre la conversación de IA cuando alguien hace clic en tu botón.",
    whatsappTitle:"WhatsApp como canal adicional", manage:"Administrar canal",
    tracking:"Rastrear página, campaña, producto y origen", trackingHelp:"Captura UTM, referencia, producto y datos de página.", createContact:"Crear contacto CRM automáticamente", createContactHelp:"Se crean nuevos contactos desde cada conversación.", previewChecks:["Origen rastreado","Contexto del producto","Pipeline listo"],
    journey:"Recorrido del cliente en vivo", journeySub:"Esto sucede cuando alguien usa tu CTA principal.",
    journeySteps:[
      ["El visitante llega","Se registran el origen y la página"],["Clic en CTA principal","Se abre la conversación asistida por IA"],
      ["El agente Cortexa responde","Responde preguntas y califica la intención"],["Contacto capturado","Se crea automáticamente el registro CRM"],
      ["Pipeline correcto seleccionado","Origen, producto e intención determinan la ruta"],["Conversión o transferencia humana","Se abre checkout o toma el control un miembro del equipo"]
    ],
    mobilePreview:"Vista previa del sitio (móvil)", back:"Volver a Configuración del agente",
    help:"¿Necesitas ayuda con tu sitio o conexiones?", request:"Solicitar asistencia",
    continue:"Guardar y continuar al teléfono", recommended:"Recomendado para tu objetivo",
    buyNow:"Comprar ahora", chatWhatsapp:"Chatear por WhatsApp", yourBusiness:"Tu negocio",
    hero:"Productos de calidad para un mañana mejor"
  },
  pt: {
    breadcrumb:"Configuração do agente de IA", current:"Pontos de entrada do cliente", progress:"Configuração de pontos de entrada",
    complete:"Concluído", inProgress:"Em andamento", notStarted:"Não iniciado", needsAttention:"Requer atenção",
    saveExit:"Salvar e sair", preview:"Visualizar fluxo", sectionsComplete:"seções concluídas",
    webTitle:"Site e botão principal de conversão",
    webSub:"Configure onde seu CTA principal aparece e o que acontece quando um cliente clica.",
    businessWebsite:"Site da empresa", verified:"Verificado", verify:"Verificar",
    primaryGoal:"Objetivo principal de conversão", selectedWorkspace:"Selecionado para este workspace", changeGoal:"Alterar objetivo",
    placementTitle:"Onde o botão principal deve aparecer?",
    placements:["Páginas de produtos","Página de preços","Páginas de campanha","Página inicial (opcional)"],
    settings:"Configurações do botão", buttonLabel:"Texto do botão", buttonStyle:"Estilo do botão",
    destination:"Destino", afterClick:"Ação após o clique", websiteMessage:"Mensagem do site", websiteMessageHelp:"Esta mensagem abre a conversa de IA quando alguém clica no botão.",
    whatsappTitle:"WhatsApp como canal adicional", manage:"Gerenciar canal",
    tracking:"Rastrear página, campanha, produto e origem", trackingHelp:"Capture UTM, referência, produto e dados da página.", createContact:"Criar contato CRM automaticamente", createContactHelp:"Novos contatos são criados a partir de cada conversa.", previewChecks:["Origem rastreada","Contexto do produto","Pipeline pronto"],
    journey:"Jornada do cliente ao vivo", journeySub:"Veja o que acontece quando alguém usa seu CTA principal.",
    journeySteps:[
      ["Visitante chega","Origem e página são registradas"],["CTA principal clicado","Conversa assistida por IA é aberta"],
      ["Agente Cortexa responde","Responde perguntas e qualifica a intenção"],["Contato capturado","Registro CRM criado automaticamente"],
      ["Pipeline correto selecionado","Origem, produto e intenção definem o roteamento"],["Conversão ou transferência humana","Checkout abre ou um membro da equipe assume"]
    ],
    mobilePreview:"Prévia do site (celular)", back:"Voltar à Configuração do agente",
    help:"Precisa de ajuda com seu site ou conexões?", request:"Solicitar assistência",
    continue:"Salvar e continuar para Telefone", recommended:"Recomendado para seu objetivo",
    buyNow:"Comprar agora", chatWhatsapp:"Conversar no WhatsApp", yourBusiness:"Sua empresa",
    hero:"Produtos de qualidade para um amanhã melhor"
  }
};

function sectionStatus(c, key, tests = []) {
  if (key === "channels") {
    const x = c.customerChannels || [];
    return x.length ? "complete" : "notStarted";
  }
  if (key === "website") {
    const w = c.website || {};
    if (w.url && w.ctaLabel && w.destination && (w.placements || []).length) return "complete";
    return Object.values(w).some(Boolean) ? "inProgress" : "notStarted";
  }
  if (key === "phone") {
    if (c.phone?.connectionStatus === "connected") return "complete";
    return c.phone?.number || c.phone?.displayName ? "inProgress" : "notStarted";
  }
  if (key === "whatsapp") {
    if (c.whatsapp?.connected === true) return "complete";
    return c.whatsapp?.status === "connecting" ? "inProgress" : "notStarted";
  }
  if (key === "marketing") {
    const m = c.marketing || {};
    if (m.primaryPage && m.sourceName) return "complete";
    return Object.values(m).some(Boolean) ? "inProgress" : "notStarted";
  }
  if (key === "consent") {
    const x = c.consent || {};
    if (x.configured === true && x.captureSource === true) return "complete";
    return Object.values(x).some(Boolean) ? "inProgress" : "notStarted";
  }
  if (key === "conversion") {
    const x = c.conversion || {};
    if (x.objective && x.desiredAction) return "complete";
    return Object.values(x).some(Boolean) ? "inProgress" : "notStarted";
  }
  if (key === "routing") {
    const x = c.routing || {};
    if (x.pipelineId && x.stageId) return "complete";
    return Object.values(x).some(Boolean) ? "inProgress" : "notStarted";
  }
  if (key === "test") {
    return Array.isArray(tests) && tests.some(x => x.status === "pass") ? "complete" : "notStarted";
  }
  return "notStarted";
}

export default function CustomerEntryPoints() {
  const n = useNavigate();
  const [params] = useSearchParams();
  const { i18n } = useTranslation();
  const lang = setupLanguage(i18n);
  const tr = copy[lang];
  const { data, state, save, load } = useSetup();

  const requestedSection = params.get("section");
  const initial = sectionKeys.includes(requestedSection) ? requestedSection : "website";
  const [active, setActive] = useState(initial);

  if (!data) return <main className="setup-shell"><div className="setup-loading">{setupCopy[lang].loading}</div></main>;

  const c = data.config || {};
  const website = c.website || {};
  const statuses = sectionKeys.map(k => sectionStatus(c, k, data.tests));
  const done = statuses.filter(x => x === "complete").length;
  const pct = Math.round((done / 9) * 100);

  const patchWebsite = (key, value, immediate = false) =>
    save({ website: { ...website, [key]: value } }, immediate);

  const placementValues = website.placements || [];
  const setPlacement = (value, checked) => {
    const next = checked
      ? [...new Set([...placementValues, value])]
      : placementValues.filter(x => x !== value);
    patchWebsite("placements", next, true);
  };

  const statusText = key => tr[sectionStatus(c, key, data.tests)] || tr.notStarted;


  const patchConfig = (group, patch, immediate = true) =>
    save({ [group]: { ...(c[group] || {}), ...patch } }, immediate);

  const setChannel = (channel, enabled) => {
    const current = c.customerChannels || [];
    const next = enabled
      ? [...new Set([...current, channel])]
      : current.filter(x => x !== channel);
    save({ customerChannels: next }, true);
  };

  useEffect(() => {
    let alive = true;
    setupApi.whatsappStatus()
      .then((wa) => {
        if (!alive || !wa) return;
        const connected = wa.connected === true;
        const current = c.whatsapp || {};
        if (
          current.connected !== connected ||
          current.number !== (wa.phone || null) ||
          current.status !== wa.status
        ) {
          save({
            whatsapp: {
              ...current,
              connected,
              number: wa.phone || null,
              status: wa.status || (connected ? "connected" : "disconnected"),
              connectedAt: wa.connected_at || null,
            },
          }, true);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
    // only sync provider status when this page/setup identity changes
  }, [data?.id]);

  const renderWebsite = () => (
    <>
      <div className="cep-section-head">
        <div><h2>{tr.webTitle}</h2><p>{tr.webSub}</p></div>
      </div>

      <div className="cep-field-block">
        <h4>{tr.businessWebsite}</h4>
        <div className="cep-url-line">
          <label>{tr.businessWebsite === "Business website" ? "Website URL" : lang === "es" ? "URL del sitio web" : "URL do site"}</label>
          <div className="cep-url">
            <Link2/>
            <input
              value={website.url || ""}
              placeholder="https://yourbusiness.com"
              onChange={e => patchWebsite("url", e.target.value)}
              onBlur={() => patchWebsite("url", website.url, true)}
            />
          </div>
          <span className={`cep-verified-pill ${website.url ? "verified" : ""}`}><Check/> {website.url ? tr.verified : tr.verify}</span>
        </div>
      </div>

      <div className="cep-field-block">
        <h4>{tr.primaryGoal}</h4>
        <button className="cep-goal" onClick={() => n("/dashboard/ai-cortexa-setup")}>
          <span className="cep-goal-icon"><ShoppingCart/></span>
          <span><b>{data.selected_objective || (lang === "es" ? "Selecciona un objetivo" : lang === "pt" ? "Selecione um objetivo" : "Select an objective")}</b><small>{tr.recommended}</small></span>
          <em>{tr.changeGoal} <ChevronRight/></em>
        </button>
      </div>

      <div className="cep-field-block">
        <h4>{tr.placementTitle}</h4>
        <div className="cep-placement-grid">
          {tr.placements.map((label, i) => {
            const value = ["Product pages","Pricing page","Campaign pages","Home page (optional)"][i];
            return <label key={value}><input type="checkbox" checked={placementValues.includes(value)} onChange={e => setPlacement(value, e.target.checked)}/><span>{label}</span></label>;
          })}
        </div>
      </div>

      <div className="cep-field-block">
        <h4>{tr.settings}</h4>
        <div className="cep-settings-exact">
          <label className="cep-setting-label"><span>{tr.buttonLabel}</span><input value={website.ctaLabel || ""} placeholder={tr.buyNow} onChange={e => patchWebsite("ctaLabel", e.target.value)} onBlur={() => patchWebsite("ctaLabel", website.ctaLabel, true)}/></label>
          <div className="cep-style-field"><span>{tr.buttonStyle}</span>
            {["Floating button","Inline button","Both"].map((value, idx) => {
              const names = lang === "es" ? ["Botón flotante","Botón en línea","Ambos"] : lang === "pt" ? ["Botão flutuante","Botão inline","Ambos"] : ["Floating button","Inline button","Both"];
              const selected=(website.ctaPlacement || "Inline button")===value;
              return <label key={value}><button type="button" className={selected ? "selected" : ""} onClick={() => patchWebsite("ctaPlacement", value, true)}>{selected && <i/>}</button>{names[idx]}</label>;
            })}
          </div>
          <div className="cep-destination-stack">
            <label><span>{tr.destination}</span><select value={website.destination || ""} onChange={e => patchWebsite("destination", e.target.value, true)}><option value="">Select</option><option>Product checkout</option><option>Appointment booking</option><option>Quote request</option><option>AI conversation</option></select></label>
            <label><span>{tr.afterClick}</span><select value={website.afterClickAction || "Start AI-assisted purchase conversation"} onChange={e => patchWebsite("afterClickAction", e.target.value, true)}><option>Start AI-assisted purchase conversation</option><option>Open checkout</option><option>Book appointment</option></select></label>
          </div>
        </div>
      </div>

      <div className="cep-field-block cep-message-block">
        <h4>{tr.websiteMessage}</h4>
        <p className="cep-field-help">{tr.websiteMessageHelp}</p>
        <div className="cep-message-wrap">
          <textarea maxLength={500} className="cep-message" value={website.openingMessage || ""} onChange={e => patchWebsite("openingMessage", e.target.value)} onBlur={() => patchWebsite("openingMessage", website.openingMessage, true)} placeholder="Hi, I'm interested in this product. Can you help me complete my purchase?"/>
          <span>{(website.openingMessage || "").length}/500</span>
        </div>
      </div>

      <div className="cep-field-block">
        <h4>{tr.whatsappTitle}</h4>
        <div className="cep-whatsapp">
          <span className="wa-logo">◉</span>
          <div className="cep-wa-copy"><div><b>WhatsApp</b><span className={`cep-state ${c.whatsapp?.connected ? "complete" : ""}`}><Check/> {c.whatsapp?.connected ? tr.connected || "Connected" : tr.notStarted}</span></div><strong>{c.whatsapp?.number || "—"}</strong><small>{lang === "es" ? "WhatsApp entra en el mismo flujo de Cortexa asistido por IA. No abre una bandeja no administrada." : lang === "pt" ? "O WhatsApp entra no mesmo fluxo Cortexa assistido por IA. Ele não abre uma caixa não gerenciada." : "WhatsApp enters the same AI-assisted Cortexa flow. It does not open an unmanaged inbox."}</small></div>
          <button onClick={() => setActive("whatsapp")}>{tr.manage}</button>
        </div>
      </div>

      <div className="cep-toggles">
        <label className="cep-toggle-row">
          <button type="button" className={website.sourceTracking !== false ? "cep-switch on" : "cep-switch"} onClick={() => patchWebsite("sourceTracking", website.sourceTracking === false, true)}><i /></button>
          <span><b>{tr.tracking}</b><small>{tr.trackingHelp}</small></span>
        </label>
        <label className="cep-toggle-row">
          <button type="button" className={website.createContact !== false ? "cep-switch on" : "cep-switch"} onClick={() => patchWebsite("createContact", website.createContact === false, true)}><i /></button>
          <span><b>{tr.createContact}</b><small>{tr.createContactHelp}</small></span>
        </label>
      </div>
    </>
  );

  const renderGeneric = () => {
    const channels = c.customerChannels || [];
    const cardHead = (Icon, title, sub) => (
      <div className="cep-section-head">
        <div><h2><Icon className="cep-inline-icon"/>{title}</h2><p>{sub}</p></div>
      </div>
    );

    if (active === "channels") {
      const options = [
        ["website", Globe2, "Website", "Primary CTA and website conversations"],
        ["phone", Phone, "Voice Calls", "Business phone calls handled by Cortexa"],
        ["sms", MessageCircle, "SMS", "Customer text messages"],
        ["whatsapp", MessageCircle, "WhatsApp", "Existing Cortexa WhatsApp QR connection"],
      ];
      return <div className="cep-functional">
        {cardHead(Share2, labels[lang][0], "Choose the customer channels this AI Agent should handle. Only selected channels are required for launch.")}
        <div className="cep-option-list">
          {options.map(([id,Icon,title,sub]) => <label className="cep-option-row" key={id}>
            <span className="cep-option-icon"><Icon/></span>
            <span><b>{title}</b><small>{sub}</small></span>
            <button type="button" className={channels.includes(id) ? "cep-switch on" : "cep-switch"} onClick={() => setChannel(id,!channels.includes(id))}><i/></button>
          </label>)}
        </div>
        <div className="cep-info-note"><Info/>Select only channels you intend to launch. Readiness checks will not require unselected channels.</div>
      </div>;
    }

    if (active === "phone") return <div className="cep-functional">
      {cardHead(Phone, labels[lang][2], setupCopy[lang].phoneSub)}
      <div className="cep-action-panel">
        <div><b>{c.phone?.number || "No business number connected"}</b><small>{c.phone?.connectionStatus === "connected" ? "Connected and available to this setup." : "Connect or configure a business number before Voice/SMS can be launch-ready."}</small></div>
        <button className="cep-primary" onClick={() => n("/dashboard/ai-cortexa-setup/customer-entry-points/business-phone")}>Configure business phone</button>
      </div>
    </div>;

    if (active === "whatsapp") {
      const wa=c.whatsapp||{};
      const connect=async()=>{
        if(wa.connected){ await setupApi.whatsappDisconnect(); }
        else { await setupApi.whatsappConnect(); }
        const status=await setupApi.whatsappStatus();
        save({whatsapp:{...wa,connected:status?.connected===true,number:status?.phone||null,status:status?.status||"disconnected",connectedAt:status?.connected_at||null}},true);
      };
      return <div className="cep-functional">
        {cardHead(MessageCircle, labels[lang][3], "Use the existing Cortexa WhatsApp QR integration. Setup reads the real connection status; it does not mark WhatsApp connected manually.")}
        <div className="cep-connection-card">
          <span className="wa-logo">◉</span>
          <div><b>{wa.connected ? "WhatsApp connected" : wa.status === "connecting" ? "WhatsApp connection in progress" : "WhatsApp not connected"}</b><small>{wa.number || "No connected number"}</small></div>
          <span className={`cep-state ${wa.connected?"complete":""}`}>{wa.connected?"Connected":wa.status||"Disconnected"}</span>
        </div>
        <div className="cep-form-actions">
          <button className="cep-secondary" onClick={connect}>{wa.connected ? "Disconnect" : "Start WhatsApp connection"}</button>
          <button className="cep-primary" onClick={() => n("/dashboard/whatsapp")}>Open WhatsApp workspace</button>
        </div>
        {!wa.connected && <div className="cep-info-note"><Info/>The existing QR/pairing flow completes the connection. Return here afterward; status is read from <b>/whatsapp-qr/status</b>.</div>}
      </div>;
    }

    if (active === "marketing") {
      const m=c.marketing||{};
      return <div className="cep-functional">
        {cardHead(Megaphone, labels[lang][4], "Define the primary traffic page and source label so conversations retain campaign context.")}
        <div className="cep-generic-grid">
          <label><span>Primary traffic / landing page</span><input value={m.primaryPage||""} placeholder="https://yourbusiness.com/offer" onChange={e=>patchConfig("marketing",{primaryPage:e.target.value},false)} onBlur={()=>patchConfig("marketing",{primaryPage:m.primaryPage||""},true)}/></label>
          <label><span>Default source name</span><input value={m.sourceName||""} placeholder="Website / Google Ads / Meta Ads" onChange={e=>patchConfig("marketing",{sourceName:e.target.value},false)} onBlur={()=>patchConfig("marketing",{sourceName:m.sourceName||""},true)}/></label>
          <label><span>Campaign parameter</span><input value={m.campaignParameter||"utm_campaign"} onChange={e=>patchConfig("marketing",{campaignParameter:e.target.value},true)}/></label>
          <label><span>Source parameter</span><input value={m.sourceParameter||"utm_source"} onChange={e=>patchConfig("marketing",{sourceParameter:e.target.value},true)}/></label>
        </div>
      </div>;
    }

    if (active === "consent") {
      const x=c.consent||{};
      return <div className="cep-functional">
        {cardHead(ShieldCheck, labels[lang][5], "Configure customer consent and source capture used by the approved entry points.")}
        <div className="cep-option-list">
          <label className="cep-option-row"><span className="cep-option-icon"><ShieldCheck/></span><span><b>Consent configured</b><small>Confirm your customer-facing consent language/process is ready.</small></span><button type="button" className={x.configured?"cep-switch on":"cep-switch"} onClick={()=>patchConfig("consent",{configured:!x.configured})}><i/></button></label>
          <label className="cep-option-row"><span className="cep-option-icon"><Link2/></span><span><b>Capture source automatically</b><small>Store referrer, UTM and entry-point source with the CRM record.</small></span><button type="button" className={x.captureSource?"cep-switch on":"cep-switch"} onClick={()=>patchConfig("consent",{captureSource:!x.captureSource})}><i/></button></label>
        </div>
        <label className="cep-full-field"><span>Consent notice / reference</span><textarea value={x.notice||""} placeholder="Optional internal note about the consent notice used on your site or channels." onChange={e=>patchConfig("consent",{notice:e.target.value},false)} onBlur={()=>patchConfig("consent",{notice:x.notice||""},true)}/></label>
      </div>;
    }

    if (active === "conversion") {
      const x=c.conversion||{};
      return <div className="cep-functional">
        {cardHead(Target, labels[lang][6], "Choose the conversion outcome the entry-point flow should optimize for.")}
        <div className="cep-generic-grid">
          <label><span>Conversion objective</span><select value={x.objective||data.selected_objective||""} onChange={e=>patchConfig("conversion",{objective:e.target.value})}><option value="">Select objective</option>{setupCopy[lang].objectives.map(o=><option key={o} value={o}>{o}</option>)}</select></label>
          <label><span>Desired action</span><select value={x.desiredAction||""} onChange={e=>patchConfig("conversion",{desiredAction:e.target.value})}><option value="">Select action</option>{["Purchase","Appointment","Quote","Viewing","Demo","Support","Human handoff"].map(v=><option key={v}>{v}</option>)}</select></label>
        </div>
        <div className="cep-info-note"><Info/>The primary conversion action remains above WhatsApp. WhatsApp enters the same Cortexa-assisted flow.</div>
      </div>;
    }

    if (active === "routing") {
      const x=c.routing||{};
      return <div className="cep-functional">
        {cardHead(GitBranch, labels[lang][7], "Choose the CRM pipeline and stage used for customers captured by this setup.")}
        <div className="cep-generic-grid">
          <label><span>Pipeline ID</span><input value={x.pipelineId||""} placeholder="Paste/select your CRM pipeline ID" onChange={e=>patchConfig("routing",{pipelineId:e.target.value},false)} onBlur={()=>patchConfig("routing",{pipelineId:x.pipelineId||""},true)}/></label>
          <label><span>Stage ID</span><input value={x.stageId||""} placeholder="Paste/select the destination stage ID" onChange={e=>patchConfig("routing",{stageId:e.target.value},false)} onBlur={()=>patchConfig("routing",{stageId:x.stageId||""},true)}/></label>
          <label><span>Owner / assignee (optional)</span><input value={x.ownerId||""} placeholder="Owner ID" onChange={e=>patchConfig("routing",{ownerId:e.target.value},false)} onBlur={()=>patchConfig("routing",{ownerId:x.ownerId||""},true)}/></label>
          <label><span>Routing note</span><input value={x.note||""} placeholder="Optional routing rule note" onChange={e=>patchConfig("routing",{note:e.target.value},false)} onBlur={()=>patchConfig("routing",{note:x.note||""},true)}/></label>
        </div>
        <div className="cep-info-note"><Info/>This section saves real CRM identifiers. It is Complete only when both pipeline and stage IDs are present.</div>
      </div>;
    }

    if (active === "test") return <div className="cep-functional">
      {cardHead(FlaskConical, labels[lang][8], "Run the end-to-end connection test after selected channels, consent and CRM routing are configured.")}
      <div className="cep-action-panel">
        <div><b>{sectionStatus(c,"test",data.tests)==="complete" ? "Connection test passed" : "Connection test not completed"}</b><small>Test evidence is stored with this setup and is used by launch readiness.</small></div>
        <button className="cep-primary" onClick={() => n("/dashboard/ai-cortexa-setup/test-launch")}>Open Test & Launch</button>
      </div>
    </div>;

    return null;
  };

  return <main className="setup-shell cep-page">
    <div className="cep-breadcrumb"><span>{tr.breadcrumb}</span><b>›</b><strong>{tr.current}</strong></div>

    <header className="cep-header">
      <span className="cep-header-icon"><Share2/></span>
      <div><h1>{setupCopy[lang].entryTitle}</h1><p>{setupCopy[lang].entrySub}</p></div>
      <span className="cep-head-status"><Info/>{tr.inProgress}</span>
      <button className="cep-secondary">{tr.saveExit}</button>
      <button className="cep-secondary"><ExternalLink/>{tr.preview}</button>
    </header>

    <section className="cep-progress">
      <b>{tr.progress}</b><span>{done} of 9 {tr.sectionsComplete}</span>
      <div><i style={{width:`${pct}%`}}/></div><strong>{pct}% complete</strong>
    </section>

    <div className="cep-layout">
      <aside className="cep-nav">
        {sectionKeys.map((key, i) => {
          const currentIndex = sectionKeys.indexOf(active);
          const realStatus = sectionStatus(c, key, data.tests);
          const isCurrent = i === currentIndex;
          const isComplete = realStatus === "complete";
          const visualStatus = isComplete ? "complete" : isCurrent ? "inProgress" : realStatus;
          return <button key={key} className={isCurrent ? "active" : ""} onClick={() => setActive(key)}>
            <span className={`cep-nav-step-wrap ${isComplete ? "complete" : ""}`}>
              <span className={`cep-nav-num ${visualStatus}`}>{i + 1}</span>
              {isComplete && <span className="cep-nav-done"><Check/></span>}
            </span>
            <span className="cep-nav-copy"><b>{labels[lang][i]}</b><small className={visualStatus}>{isComplete ? tr.complete : isCurrent ? tr.inProgress : statusText(key)}</small></span>
          </button>;
        })}
        <div className="cep-nav-save"><Info/><span>{setupCopy[lang].auto}</span></div>
      </aside>

      <section className="cep-main-card">{active === "website" ? renderWebsite() : renderGeneric()}</section>

      <aside className="cep-journey">
        <h2>{tr.journey}</h2><p>{tr.journeySub}</p>
        <div className="cep-journey-list">
          {tr.journeySteps.map(([title, sub], i) => {
            const I = [UserRound, MousePointer2, Sparkles, Database, Network, CheckSquare][i];
            return <div className="cep-journey-step" key={title}>
              <span>{i+1}</span><i><I/></i><div><b>{title}</b><small>{sub}</small></div>
            </div>;
          })}
        </div>
        <div className="cep-preview-title">{tr.mobilePreview}</div>
        <div className="cep-phone-image-wrap"><img src={websiteMobilePreview} alt={tr.mobilePreview} /></div>
        <div className="cep-preview-checks">
          {(tr.previewChecks || ["Source tracked","Product context","Pipeline ready"]).map(label => <span key={label}><Check/>{label}</span>)}
        </div>
      </aside>
    </div>

    <footer className="cep-footer">
      <button className="cep-secondary" onClick={() => n("/dashboard/ai-cortexa-setup")}><ArrowLeft/>{tr.back}</button>
      <div><span>{tr.help}</span><button onClick={() => n("/dashboard/ai-cortexa-setup/assistance")}>{tr.request}</button></div>
      <button className="cep-primary" onClick={() => n("/dashboard/ai-cortexa-setup/customer-entry-points/business-phone")}>{tr.continue}<ArrowRight/></button>
    </footer>
  </main>;
}
