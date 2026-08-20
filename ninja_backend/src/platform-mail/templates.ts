// Localized platform email templates (en / es / pt).
//
// One entry per (template, language) with a fully rendered { subject, html,
// text }. Unknown languages fall back to English so a bad/blank locale never
// yields an empty email. Inline styles only (email clients strip <style>).

import { ONBOARDING_EMAILS, OnbTemplate } from './onboarding-emails.data';
//
// Templates:
//   welcome               - after a confirmed payment (account active)
//   getting_started       - right after welcome: how to set up (onboarding link)
//   abandoned_1           - ~5-10 min after an unpaid sign-up ("account ready")
//   abandoned_2           - ~24h later, introduces the Business Editorial
//   abandoned_3           - ~48-72h later, final reminder
//   payment_failed        - a payment or renewal attempt failed (retry link)
//   subscription_canceled - a subscription was canceled (reactivate link)

export type TemplateName =
  | 'welcome'
  | 'getting_started'
  | 'abandoned_1'
  | 'abandoned_2'
  | 'abandoned_3'
  | 'payment_failed'
  | 'subscription_canceled'
  | 'recovery'
  // Free-user onboarding sequence (signup, day 3, 5, 7, 10).
  | 'free_welcome'
  | 'free_plan_value'
  | 'free_ai'
  | 'free_team'
  | 'free_upgrade'
  // New client-approved onboarding sequence (Day 0/1/2/4/6/9/12). Rich designs
  // pre-rendered in onboarding-emails.data.ts; rendered via token substitution.
  | OnbTemplate;
export type MailLang = 'en' | 'es' | 'pt';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateVars {
  name?: string | null;
  // Primary call-to-action link (log in for welcome, get started for
  // getting_started, continue activation for the abandoned sequence, retry /
  // reactivate for the billing emails). Tracking links are wrapped by the
  // mailer, not here.
  ctaUrl: string;
  // Welcome-only secondary link.
  dashboardUrl?: string;
  // abandoned_2-only localized Business Editorial link.
  editorialUrl?: string;
  // Support contact shown in welcome, getting_started, and the billing emails.
  supportEmail?: string;
  // Free-onboarding: per-recipient unsubscribe link -> renders a footer opt-out.
  unsubscribeUrl?: string;
  // Free-onboarding email #3 only: the account's real Free-plan AI allowance
  // (from plan-config). Renders an "up to N AI conversations / month" line.
  aiAllowance?: number | null;
  // Optional physical/business address line for the footer (CAN-SPAM).
  businessAddress?: string | null;
  // Deep-link targets for the rich onboarding sequence (onb_* templates). Each
  // maps to a {{token}} in the pre-rendered design HTML. All optional; any that
  // is missing falls back to ctaUrl so a link is never blank.
  appUrl?: string;
  aiAgentUrl?: string;
  aiUnitsUrl?: string;
  upgradeUrl?: string;
  workspaceUrl?: string;
  teamWorkspaceUrl?: string;
  // checkout_recovery only: resume-checkout link for the customer's selected plan.
  checkoutUrl?: string;
}

const BRAND = 'Cortexa AI CRM';
const ACCENT = '#2563eb';

function normalizeLang(lang?: string): MailLang {
  const l = String(lang || '')
    .slice(0, 2)
    .toLowerCase();
  return l === 'es' || l === 'pt' ? (l as MailLang) : 'en';
}

function layout(innerHtml: string, footerExtra?: string): string {
  return `
  <div style="background:#f1f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:${ACCENT};padding:20px 28px">
        <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px">Cortexa</span>
      </div>
      <div style="padding:28px;color:#0f172a;font-size:15px;line-height:1.6">
        ${innerHtml}
      </div>
      <div style="padding:18px 28px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.5">
        ${BRAND}${footerExtra || ''}
      </div>
    </div>
  </div>`;
}

// A hidden preheader (inbox preview text) placed before the visible content.
function preheaderHtml(text?: string): string {
  if (!text) return '';
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${text}</div>`;
}

// Jira-style green-check list for the onboarding emails.
function checklistHtml(items?: string[]): string {
  if (!items || !items.length) return '';
  const rows = items
    .map(
      (s) =>
        `<tr><td style="vertical-align:top;color:#16a34a;padding:0 8px 8px 0;font-weight:700">&#10003;</td><td style="padding:0 0 8px;color:#334155">${s}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-collapse:collapse">${rows}</table>`;
}

function button(label: string, url: string): string {
  return `<p style="margin:24px 0">
    <a href="${url}" style="background:${ACCENT};color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${label}</a>
  </p>`;
}

function greeting(lang: MailLang, name?: string | null): string {
  const n = (name || '').trim();
  if (lang === 'es') return n ? `Hola ${n},` : 'Hola,';
  if (lang === 'pt') return n ? `Olá ${n},` : 'Olá,';
  return n ? `Hi ${n},` : 'Hi,';
}

// Localized label for the secondary "open your dashboard" link.
function dashLabel(lang: MailLang): string {
  if (lang === 'es') return 'Abrir tu panel';
  if (lang === 'pt') return 'Abrir seu painel';
  return 'Open your dashboard';
}

function unsubLabel(lang: MailLang): string {
  if (lang === 'es') return 'Cancelar suscripción';
  if (lang === 'pt') return 'Cancelar inscrição';
  return 'Unsubscribe';
}

interface Copy {
  subject: string;
  heading: string;
  intro: string[]; // paragraphs before the button
  cta: string; // primary button label
  steps?: string[]; // getting-started list (welcome-style, bulleted)
  checklist?: string[]; // Jira-style green-check list (free-onboarding)
  outro?: string[]; // paragraphs after the checklist, before the button
  preheader?: string; // hidden inbox preview text
  aiLine?: string; // free_ai: sentence wrapping the {aiAllowance} number
  editorialLabel?: string; // abandoned_2: text for the editorial link line
  support?: string; // support line (uses supportEmail)
}

// Partial per-locale so a template can ship English-only and fall back to it
// (renderTemplate resolves the locale or English). Every template must have `en`.
const COPY: Partial<Record<TemplateName, Partial<Record<MailLang, Copy>>>> = {
  welcome: {
    en: {
      subject: 'Welcome to Cortexa AI CRM — your account is active',
      heading: 'Welcome to Cortexa',
      intro: [
        'Thank you. Your payment was successful and your account is now active.',
        'Log in and put your AI agent to work turning conversations into booked appointments.',
      ],
      cta: 'Log in to your account',
      support: 'Need anything? Reach us any time at',
    },
    es: {
      subject: 'Bienvenido a Cortexa AI CRM: tu cuenta está activa',
      heading: 'Bienvenido a Cortexa',
      intro: [
        'Gracias. Tu pago se realizó con éxito y tu cuenta ya está activa.',
        'Inicia sesión y pon a trabajar a tu agente de IA para convertir conversaciones en citas agendadas.',
      ],
      cta: 'Iniciar sesión',
      support: '¿Necesitas algo? Escríbenos cuando quieras a',
    },
    pt: {
      subject: 'Bem-vindo à Cortexa AI CRM — sua conta está ativa',
      heading: 'Bem-vindo à Cortexa',
      intro: [
        'Obrigado. Seu pagamento foi concluído com sucesso e sua conta já está ativa.',
        'Entre e coloque seu agente de IA para transformar conversas em agendamentos.',
      ],
      cta: 'Entrar na sua conta',
      support: 'Precisa de algo? Fale conosco a qualquer momento em',
    },
  },
  getting_started: {
    en: {
      subject: 'Getting started with Cortexa',
      heading: "Let's get you set up",
      intro: [
        'Your account is ready. Here is how to get your AI agent up and running in a few minutes.',
      ],
      cta: 'Click Here to Get Started',
      steps: [
        'Connect WhatsApp so your AI agent can start replying.',
        'Add your business details and properties.',
        'Turn on auto-reply and appointment booking.',
      ],
      support: 'Questions along the way? We are here to help at',
    },
    es: {
      subject: 'Empieza con Cortexa',
      heading: 'Vamos a configurar tu cuenta',
      intro: [
        'Tu cuenta está lista. Así puedes poner en marcha tu agente de IA en unos minutos.',
      ],
      cta: 'Haz clic para empezar',
      steps: [
        'Conecta WhatsApp para que tu agente de IA empiece a responder.',
        'Agrega los datos de tu negocio y tus propiedades.',
        'Activa la respuesta automática y el agendamiento de citas.',
      ],
      support: '¿Tienes dudas por el camino? Estamos aquí para ayudarte en',
    },
    pt: {
      subject: 'Comece a usar a Cortexa',
      heading: 'Vamos configurar sua conta',
      intro: [
        'Sua conta está pronta. Veja como colocar seu agente de IA para funcionar em poucos minutos.',
      ],
      cta: 'Clique aqui para começar',
      steps: [
        'Conecte o WhatsApp para o seu agente de IA começar a responder.',
        'Adicione os dados do seu negócio e seus imóveis.',
        'Ative a resposta automática e o agendamento de reuniões.',
      ],
      support: 'Alguma dúvida pelo caminho? Estamos aqui para ajudar em',
    },
  },
  abandoned_1: {
    en: {
      subject: 'Your Cortexa account is ready.',
      heading: 'Your account is ready',
      intro: [
        'Your Cortexa account has already been created.',
        'It looks like you left before finishing your activation.',
        "Whenever you're ready, simply click below to continue where you left off.",
      ],
      cta: 'Continue My Activation',
    },
    es: {
      subject: 'Tu cuenta de Cortexa está lista.',
      heading: 'Tu cuenta está lista',
      intro: [
        'Tu cuenta de Cortexa ya fue creada.',
        'Parece que saliste antes de terminar tu activación.',
        'Cuando quieras, haz clic abajo para continuar donde lo dejaste.',
      ],
      cta: 'Continuar mi activación',
    },
    pt: {
      subject: 'Sua conta Cortexa está pronta.',
      heading: 'Sua conta está pronta',
      intro: [
        'Sua conta Cortexa já foi criada.',
        'Parece que você saiu antes de concluir sua ativação.',
        'Quando quiser, clique abaixo para continuar de onde parou.',
      ],
      cta: 'Continuar minha ativação',
    },
  },
  abandoned_2: {
    en: {
      subject: 'Why Cortexa is different',
      heading: "You're closer than you think",
      intro: [
        'Your account is still saved and ready.',
        'Before you decide, here is why Cortexa is not just another CRM. It is an AI agent that captures, qualifies, and follows up with your leads automatically, so you close more without more work.',
      ],
      editorialLabel: 'Read: how AI is transforming every business',
      cta: 'Continue Activation',
    },
    es: {
      subject: 'Por qué Cortexa es diferente',
      heading: 'Estás más cerca de lo que crees',
      intro: [
        'Tu cuenta sigue guardada y lista.',
        'Antes de decidir, esto es por qué Cortexa no es solo otro CRM. Es un agente de IA que capta, califica y da seguimiento a tus leads automáticamente, para que cierres más sin más trabajo.',
      ],
      editorialLabel: 'Lee: cómo la IA está transformando cada negocio',
      cta: 'Continuar activación',
    },
    pt: {
      subject: 'Por que a Cortexa é diferente',
      heading: 'Você está mais perto do que imagina',
      intro: [
        'Sua conta continua salva e pronta.',
        'Antes de decidir, veja por que a Cortexa não é apenas mais um CRM. É um agente de IA que capta, qualifica e faz o follow-up dos seus leads automaticamente, para você fechar mais sem mais trabalho.',
      ],
      editorialLabel: 'Leia: como a IA está transformando todo negócio',
      cta: 'Continuar ativação',
    },
  },
  abandoned_3: {
    en: {
      subject: 'Your AI business platform is ready whenever you are',
      heading: 'We saved your account',
      intro: [
        "We're saving your account, but we'd love to help you get started.",
        'Your AI business platform is ready whenever you are.',
      ],
      cta: 'Continue Activation',
    },
    es: {
      subject: 'Tu plataforma de negocio con IA está lista cuando tú lo estés',
      heading: 'Guardamos tu cuenta',
      intro: [
        'Estamos guardando tu cuenta, pero nos encantaría ayudarte a empezar.',
        'Tu plataforma de negocio con IA está lista cuando tú lo estés.',
      ],
      cta: 'Continuar activación',
    },
    pt: {
      subject: 'Sua plataforma de negócios com IA está pronta quando você estiver',
      heading: 'Guardamos sua conta',
      intro: [
        'Estamos guardando sua conta, mas adoraríamos ajudar você a começar.',
        'Sua plataforma de negócios com IA está pronta quando você estiver.',
      ],
      cta: 'Continuar ativação',
    },
  },
  payment_failed: {
    en: {
      subject: 'Your Cortexa payment did not go through',
      heading: 'Payment did not complete',
      intro: [
        'We tried to process your payment but it did not go through.',
        'To keep your account active, please update your payment details and try again.',
      ],
      cta: 'Retry payment',
      support: 'Need a hand? Contact us at',
    },
    es: {
      subject: 'Tu pago de Cortexa no se completó',
      heading: 'El pago no se completó',
      intro: [
        'Intentamos procesar tu pago pero no se completó.',
        'Para mantener tu cuenta activa, actualiza tu información de pago e inténtalo de nuevo.',
      ],
      cta: 'Reintentar el pago',
      support: '¿Necesitas ayuda? Escríbenos a',
    },
    pt: {
      subject: 'Seu pagamento da Cortexa não foi concluído',
      heading: 'O pagamento não foi concluído',
      intro: [
        'Tentamos processar seu pagamento, mas ele não foi concluído.',
        'Para manter sua conta ativa, atualize seus dados de pagamento e tente novamente.',
      ],
      cta: 'Tentar novamente',
      support: 'Precisa de ajuda? Fale conosco em',
    },
  },
  // Incomplete-registration recovery: sent ~1-2 min after an account is created
  // with NO plan chosen and still has none. The CTA is a secure single-use link
  // that activates Free Forever on the existing account (never a new signup).
  recovery: {
    en: {
      subject: 'Your Cortexa account is ready — activate Free Forever',
      heading: 'Your account is ready',
      intro: [
        "You're almost there.",
        "Your Cortexa account has been created, but you haven't finished activating your plan.",
        'Activate your Free Forever plan and start using Cortexa with no monthly subscription required.',
        'Your Free plan includes access to the core Cortexa CRM, WhatsApp, and limited AI capabilities so you can start working immediately.',
        'No credit card required.',
      ],
      cta: 'Activate My Free Plan',
    },
    es: {
      subject: 'Tu cuenta de Cortexa está lista: activa el plan Free Forever',
      heading: 'Tu cuenta está lista',
      intro: [
        'Ya casi terminas.',
        'Tu cuenta de Cortexa fue creada, pero aún no has activado tu plan.',
        'Activa tu plan Free Forever y empieza a usar Cortexa sin suscripción mensual.',
        'Tu plan Free incluye acceso al CRM principal de Cortexa, WhatsApp y capacidades limitadas de IA para que empieces a trabajar de inmediato.',
        'No se requiere tarjeta de crédito.',
      ],
      cta: 'Activar mi plan Free',
    },
    pt: {
      subject: 'Sua conta Cortexa está pronta: ative o plano Free Forever',
      heading: 'Sua conta está pronta',
      intro: [
        'Você está quase lá.',
        'Sua conta Cortexa foi criada, mas você ainda não ativou seu plano.',
        'Ative seu plano Free Forever e comece a usar a Cortexa sem assinatura mensal.',
        'Seu plano Free inclui acesso ao CRM principal da Cortexa, WhatsApp e recursos limitados de IA para você começar a trabalhar imediatamente.',
        'Não é necessário cartão de crédito.',
      ],
      cta: 'Ativar meu plano Free',
    },
  },
  subscription_canceled: {
    en: {
      subject: 'Your Cortexa subscription has been canceled',
      heading: 'Your subscription is canceled',
      intro: [
        'Your Cortexa subscription has been canceled and it will not renew.',
        'You can reactivate any time to restore full access to your account.',
      ],
      cta: 'Reactivate my account',
      support: 'If this was a mistake or you need help, contact us at',
    },
    es: {
      subject: 'Tu suscripción de Cortexa ha sido cancelada',
      heading: 'Tu suscripción está cancelada',
      intro: [
        'Tu suscripción de Cortexa ha sido cancelada y no se renovará.',
        'Puedes reactivarla cuando quieras para recuperar el acceso completo a tu cuenta.',
      ],
      cta: 'Reactivar mi cuenta',
      support: 'Si fue un error o necesitas ayuda, escríbenos a',
    },
    pt: {
      subject: 'Sua assinatura da Cortexa foi cancelada',
      heading: 'Sua assinatura foi cancelada',
      intro: [
        'Sua assinatura da Cortexa foi cancelada e não será renovada.',
        'Você pode reativar quando quiser para recuperar o acesso completo à sua conta.',
      ],
      cta: 'Reativar minha conta',
      support: 'Se foi um engano ou precisa de ajuda, fale conosco em',
    },
  },

  // ===== Free-user onboarding sequence =====
  // English copy per the client spec. es/pt recipients fall back to English for
  // V1 (renderTemplate resolves the locale or English); translations later.
  free_welcome: {
    en: {
      subject: 'Welcome to Cortexa — Your Account Is Ready',
      preheader:
        'Everything you need to start organizing your business is ready.',
      heading: 'Welcome to Cortexa',
      intro: [
        'Your account is ready.',
        'Cortexa gives you one connected place to organize your leads, contacts, pipeline, tasks, customer activity, and business data.',
        'A good place to start:',
      ],
      checklist: [
        'Add or review your contacts',
        'Organize your leads',
        'Set up your pipeline',
        'Explore your dashboard',
      ],
      outro: [
        "You don't have to learn everything today.",
        'Start with what your business needs most and build from there.',
      ],
      cta: 'Open Cortexa',
      support: 'Need help? Reply to this email or contact',
    },
  },
  free_plan_value: {
    en: {
      subject: "Here's What You Get With Cortexa Free",
      preheader: 'Your Free Forever account has more waiting for you.',
      heading: "Here's what you get with Cortexa Free",
      intro: [
        'Your Cortexa Free Forever account is yours to keep.',
        'You can use it to start managing important parts of your business from one connected workspace.',
        'Your Free account includes access to core capabilities such as:',
      ],
      checklist: [
        'Contact management',
        'Lead organization',
        'Pipeline visibility',
        'Dashboard access',
        'Basic business tools',
        'Cortexa AI assistance with limited monthly usage',
      ],
      outro: [
        'There is no need to upgrade just to keep your Free account.',
        'Use Cortexa, learn what works for your business, and expand when you need more.',
        "Need help deciding where to start? Reply to this email and tell us what kind of business you run, and we'll point you in the right direction.",
      ],
      cta: 'Explore my account',
    },
  },
  free_ai: {
    en: {
      subject: 'Your Cortexa AI Is Ready When You Need It',
      preheader: 'See how AI assistance fits into your Cortexa workspace.',
      heading: 'Your Cortexa AI is ready when you need it',
      intro: [
        'Cortexa AI is built into your workspace to help you work with the information and activity inside your CRM.',
        'Your Free Forever account includes limited AI usage each month.',
      ],
      aiLine:
        'Your Free plan includes up to {aiAllowance} AI conversations each month.',
      outro: [
        'The Free plan is designed to let you experience Cortexa AI while keeping your core CRM available to you.',
        'If your business eventually needs more AI capacity or additional capabilities, you can explore the available upgrades from inside your account.',
        "Questions about what AI can help you with? Reply to this email and tell us what you're trying to accomplish.",
      ],
      cta: 'Explore Cortexa AI',
    },
  },
  free_team: {
    en: {
      subject: 'Bring Your Work Together in Cortexa',
      preheader:
        'Keep your business activity organized in one connected workspace.',
      heading: 'Bring your work together in Cortexa',
      intro: [
        'Cortexa becomes even more useful when the people and information behind your business stay connected.',
        'Use your workspace to keep track of:',
      ],
      checklist: [
        'Leads and contacts',
        'Pipeline activity',
        'Tasks and responsibilities',
        'Customer information',
        'Business activity',
      ],
      outro: [
        'If your current plan supports additional users, you can bring your team into the same workspace and keep everyone working from the same information.',
        'Working by yourself? No problem. Cortexa works for solo businesses too, so keep using your workspace to organize the parts of your business that matter most.',
      ],
      cta: 'Open my workspace',
    },
  },
  free_upgrade: {
    en: {
      subject: 'What Could Cortexa Do for Your Business?',
      preheader: "Tell us what you do and we'll help you find the right setup.",
      heading: 'What could Cortexa do for your business?',
      intro: [
        'Every business uses Cortexa differently.',
        'A real estate business may need different tools than an agency, service company, sales team, or growing organization.',
        'That is why Cortexa can grow beyond your Free account.',
        'Depending on what your business needs, you can access additional plans and Workspaces with expanded capabilities.',
        'Not sure what makes sense for you? Tell us:',
      ],
      checklist: [
        'What kind of business do you run?',
        'What are you trying to manage or improve?',
        'What is taking up too much of your time today?',
      ],
      outro: [
        "Reply directly to this email and we'll help point you toward the Cortexa setup that makes the most sense for your business.",
        'No pressure to upgrade. Your Free Forever account remains available while you decide what your business needs.',
      ],
      cta: 'Explore plans & workspaces',
      support: 'Or simply reply to this email:',
    },
  },
};

// The 7 rich onboarding designs render outside the simple `layout()` shell:
// their approved HTML is pre-rendered in onboarding-emails.data.ts and only needs
// runtime {{tokens}} substituted. Kept faithful to the client's designs.
const ONB_NAMES: OnbTemplate[] = [
  'onb_welcome',
  'onb_support',
  'onb_ai',
  'onb_connect',
  'onb_system',
  'onb_ready',
  'onb_team',
  'checkout_recovery',
];
function isOnb(name: TemplateName): name is OnbTemplate {
  return (ONB_NAMES as string[]).includes(name);
}

function renderOnboarding(
  name: OnbTemplate,
  l: MailLang,
  vars: TemplateVars,
): RenderedEmail {
  const entry = ONBOARDING_EMAILS[name][l] || ONBOARDING_EMAILS[name].en;
  const app = vars.appUrl || vars.ctaUrl || '';
  const first = (vars.name || '').trim();
  const tokens: Record<string, string> = {
    '{{app_url}}': app,
    '{{ai_agent_url}}': vars.aiAgentUrl || app,
    '{{ai_units_url}}': vars.aiUnitsUrl || app,
    '{{upgrade_url}}': vars.upgradeUrl || app,
    '{{workspace_url}}': vars.workspaceUrl || app,
    '{{team_workspace_url}}': vars.teamWorkspaceUrl || app,
    '{{support_email}}': vars.supportEmail || 'support@cortexaaicrm.com',
    '{{unsubscribe_url}}': vars.unsubscribeUrl || app,
    '{{checkout_url}}': vars.checkoutUrl || vars.upgradeUrl || app,
  };
  const sub = (s: string) => {
    for (const [k, v] of Object.entries(tokens)) s = s.split(k).join(v);
    return s;
  };
  let html = sub(preheaderHtml(entry.preheader) + entry.html).split('{{first_name}}').join(first);
  // When the first name is unknown, tidy a greeting like "Hi {{first_name}},"
  // (now "Hi ,") down to a clean "Hi,".
  if (!first) html = html.replace(/(Hi|Hola|Olá) ,/g, '$1,');
  // Subject: drop ", {{first_name}}" entirely when the recipient name is unknown,
  // otherwise substitute it, then collapse any doubled spaces.
  let subject = first
    ? entry.subject.split('{{first_name}}').join(first)
    : entry.subject.replace(/,?\s*\{\{first_name\}\}/g, '');
  subject = subject.replace(/\s{2,}/g, ' ').trim();
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { subject, html, text };
}

export function renderTemplate(
  name: TemplateName,
  lang: string | undefined,
  vars: TemplateVars,
): RenderedEmail {
  const l = normalizeLang(lang);
  if (isOnb(name)) return renderOnboarding(name, l, vars);
  // Locale copy with an English fallback (every non-onboarding template has `en`).
  const entry: Partial<Record<MailLang, Copy>> = COPY[name] || {};
  const c = (entry[l] || entry.en) as Copy;

  const paras = c.intro.map((p) => `<p style="margin:0 0 12px">${p}</p>`).join('');

  // AI-allowance line (free_ai email #3): real number from plan-config.
  let aiBlock = '';
  if (c.aiLine && vars.aiAllowance != null) {
    const line = c.aiLine.replace('{aiAllowance}', String(vars.aiAllowance));
    aiBlock = `<div style="margin:16px 0;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;color:#0f172a;font-size:14px">${line}</div>`;
  }

  // Extras are driven by the copy fields + provided vars, not the template name,
  // so any template can carry steps, a dashboard link, an editorial link, or a
  // support line by simply declaring them.
  let extra = '';
  if (c.steps && c.steps.length) {
    const items = c.steps
      .map((s) => `<li style="margin:0 0 6px">${s}</li>`)
      .join('');
    extra += `<ul style="margin:8px 0 0;padding-left:20px;color:#334155">${items}</ul>`;
  }
  if (vars.dashboardUrl) {
    extra += `<p style="margin:16px 0 0;font-size:14px">
      <a href="${vars.dashboardUrl}" style="color:${ACCENT}">${dashLabel(l)}</a></p>`;
  }
  if (c.editorialLabel && vars.editorialUrl) {
    extra += `<p style="margin:16px 0 0;font-size:14px">
      <a href="${vars.editorialUrl}" style="color:${ACCENT};font-weight:600">${c.editorialLabel}</a></p>`;
  }
  if (c.support && vars.supportEmail) {
    extra += `<p style="margin:16px 0 0;color:#64748b;font-size:13px">${c.support}
      <a href="mailto:${vars.supportEmail}" style="color:${ACCENT}">${vars.supportEmail}</a></p>`;
  }

  // Footer support + address + unsubscribe, but ONLY for emails that carry an
  // unsubscribe link (the onboarding sequence). Other lifecycle emails keep their
  // existing footer untouched.
  let footerExtra = '';
  if (vars.unsubscribeUrl) {
    if (vars.supportEmail) {
      footerExtra += `<br>Need help? <a href="mailto:${vars.supportEmail}" style="color:#94a3b8">${vars.supportEmail}</a>`;
    }
    if (vars.businessAddress) {
      footerExtra += `<br>${vars.businessAddress}`;
    }
    footerExtra += `<br><a href="${vars.unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline">${unsubLabel(l)}</a>`;
  }

  const html =
    preheaderHtml(c.preheader) +
    layout(
      `<h2 style="margin:0 0 16px;font-size:20px">${c.heading}</h2>
     <p style="margin:0 0 12px">${greeting(l, vars.name)}</p>
     ${paras}
     ${checklistHtml(c.checklist)}
     ${aiBlock}
     ${(c.outro || []).map((p) => `<p style="margin:0 0 12px">${p}</p>`).join('')}
     ${button(c.cta, vars.ctaUrl)}
     ${extra}
     <p style="color:#94a3b8;font-size:12px;word-break:break-all;margin-top:16px">${vars.ctaUrl}</p>`,
      footerExtra,
    );

  const textLines = [c.heading, '', greeting(l, vars.name), '', ...c.intro];
  if (c.checklist) textLines.push('', ...c.checklist.map((s) => `- ${s}`));
  if (c.aiLine && vars.aiAllowance != null) {
    textLines.push('', c.aiLine.replace('{aiAllowance}', String(vars.aiAllowance)));
  }
  if (c.outro) textLines.push('', ...c.outro);
  if (c.steps) textLines.push('', ...c.steps);
  if (c.editorialLabel && vars.editorialUrl) {
    textLines.push('', `${c.editorialLabel}: ${vars.editorialUrl}`);
  }
  textLines.push('', `${c.cta}: ${vars.ctaUrl}`);
  if (c.support && vars.supportEmail) {
    textLines.push('', `${c.support} ${vars.supportEmail}`);
  }
  if (vars.unsubscribeUrl) {
    textLines.push('', `${unsubLabel(l)}: ${vars.unsubscribeUrl}`);
  }
  const text = textLines.join('\n');

  return { subject: c.subject, html, text };
}
