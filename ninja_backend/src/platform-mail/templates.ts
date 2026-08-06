// Localized platform email templates (en / es / pt).
//
// One entry per (template, language) with a fully rendered { subject, html,
// text }. Unknown languages fall back to English so a bad/blank locale never
// yields an empty email. Inline styles only (email clients strip <style>).
//
// Templates:
//   welcome      - after a confirmed payment (account active)
//   abandoned_1  - ~5-10 min after an unpaid sign-up ("your account is ready")
//   abandoned_2  - ~24h later, introduces the Business Editorial
//   abandoned_3  - ~48-72h later, final reminder

export type TemplateName =
  | 'welcome'
  | 'abandoned_1'
  | 'abandoned_2'
  | 'abandoned_3';
export type MailLang = 'en' | 'es' | 'pt';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateVars {
  name?: string | null;
  // Primary call-to-action link (log in for welcome, continue activation for the
  // abandoned sequence). Tracking links are wrapped by the mailer, not here.
  ctaUrl: string;
  // Welcome-only secondary link.
  dashboardUrl?: string;
  // abandoned_2-only localized Business Editorial link.
  editorialUrl?: string;
  // Support contact shown in the welcome email.
  supportEmail?: string;
}

const BRAND = 'Cortexa AI CRM';
const ACCENT = '#2563eb';

function normalizeLang(lang?: string): MailLang {
  const l = String(lang || '')
    .slice(0, 2)
    .toLowerCase();
  return l === 'es' || l === 'pt' ? (l as MailLang) : 'en';
}

function layout(innerHtml: string): string {
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
        ${BRAND}
      </div>
    </div>
  </div>`;
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

interface Copy {
  subject: string;
  heading: string;
  intro: string[]; // paragraphs before the button
  cta: string; // primary button label
  steps?: string[]; // welcome: getting-started list
  editorialLabel?: string; // abandoned_2: text for the editorial link line
  support?: string; // welcome: support line (uses supportEmail)
}

const COPY: Record<TemplateName, Record<MailLang, Copy>> = {
  welcome: {
    en: {
      subject: 'Welcome to Cortexa AI CRM — your account is active',
      heading: 'Welcome to Cortexa',
      intro: [
        'Your payment was confirmed and your account is now active.',
        'Log in and put your AI agent to work turning conversations into booked appointments.',
      ],
      cta: 'Log in to your account',
      steps: [
        'Connect WhatsApp so your AI agent can start replying.',
        'Add your business details and properties.',
        'Turn on auto-reply and appointment booking.',
      ],
      support: 'Need help getting started? Reach us any time at',
    },
    es: {
      subject: 'Bienvenido a Cortexa AI CRM: tu cuenta está activa',
      heading: 'Bienvenido a Cortexa',
      intro: [
        'Tu pago fue confirmado y tu cuenta ya está activa.',
        'Inicia sesión y pon a trabajar a tu agente de IA para convertir conversaciones en citas agendadas.',
      ],
      cta: 'Iniciar sesión',
      steps: [
        'Conecta WhatsApp para que tu agente de IA empiece a responder.',
        'Agrega los datos de tu negocio y tus propiedades.',
        'Activa la respuesta automática y el agendamiento de citas.',
      ],
      support: '¿Necesitas ayuda para empezar? Escríbenos cuando quieras a',
    },
    pt: {
      subject: 'Bem-vindo à Cortexa AI CRM — sua conta está ativa',
      heading: 'Bem-vindo à Cortexa',
      intro: [
        'Seu pagamento foi confirmado e sua conta já está ativa.',
        'Entre e coloque seu agente de IA para transformar conversas em agendamentos.',
      ],
      cta: 'Entrar na sua conta',
      steps: [
        'Conecte o WhatsApp para o seu agente de IA começar a responder.',
        'Adicione os dados do seu negócio e seus imóveis.',
        'Ative a resposta automática e o agendamento de reuniões.',
      ],
      support: 'Precisa de ajuda para começar? Fale conosco a qualquer momento em',
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
};

export function renderTemplate(
  name: TemplateName,
  lang: string | undefined,
  vars: TemplateVars,
): RenderedEmail {
  const l = normalizeLang(lang);
  const c = COPY[name][l];

  const paras = c.intro.map((p) => `<p style="margin:0 0 12px">${p}</p>`).join('');

  let extra = '';
  if (name === 'welcome') {
    if (c.steps && c.steps.length) {
      const items = c.steps
        .map((s) => `<li style="margin:0 0 6px">${s}</li>`)
        .join('');
      extra += `<ul style="margin:8px 0 0;padding-left:20px;color:#334155">${items}</ul>`;
    }
    if (vars.dashboardUrl) {
      extra += `<p style="margin:16px 0 0;font-size:14px">
        <a href="${vars.dashboardUrl}" style="color:${ACCENT}">Open your dashboard</a></p>`;
    }
    if (c.support && vars.supportEmail) {
      extra += `<p style="margin:16px 0 0;color:#64748b;font-size:13px">${c.support}
        <a href="mailto:${vars.supportEmail}" style="color:${ACCENT}">${vars.supportEmail}</a></p>`;
    }
  }
  if (name === 'abandoned_2' && vars.editorialUrl && c.editorialLabel) {
    extra += `<p style="margin:16px 0 0;font-size:14px">
      <a href="${vars.editorialUrl}" style="color:${ACCENT};font-weight:600">${c.editorialLabel}</a></p>`;
  }

  const html = layout(
    `<h2 style="margin:0 0 16px;font-size:20px">${c.heading}</h2>
     <p style="margin:0 0 12px">${greeting(l, vars.name)}</p>
     ${paras}
     ${button(c.cta, vars.ctaUrl)}
     ${extra}
     <p style="color:#94a3b8;font-size:12px;word-break:break-all;margin-top:16px">${vars.ctaUrl}</p>`,
  );

  const textLines = [c.heading, '', greeting(l, vars.name), '', ...c.intro];
  if (name === 'welcome' && c.steps) textLines.push('', ...c.steps);
  if (name === 'abandoned_2' && vars.editorialUrl && c.editorialLabel) {
    textLines.push('', `${c.editorialLabel}: ${vars.editorialUrl}`);
  }
  textLines.push('', `${c.cta}: ${vars.ctaUrl}`);
  const text = textLines.join('\n');

  return { subject: c.subject, html, text };
}
