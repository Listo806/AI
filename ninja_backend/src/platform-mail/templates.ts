// Localized platform email templates (en / es / pt).
//
// One entry per (template, language) with a fully rendered { subject, html,
// text }. Unknown languages fall back to English so a bad/blank locale never
// yields an empty email. Inline styles only (email clients strip <style>).
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
  | 'subscription_canceled';
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

// Localized label for the secondary "open your dashboard" link.
function dashLabel(lang: MailLang): string {
  if (lang === 'es') return 'Abrir tu panel';
  if (lang === 'pt') return 'Abrir seu painel';
  return 'Open your dashboard';
}

interface Copy {
  subject: string;
  heading: string;
  intro: string[]; // paragraphs before the button
  cta: string; // primary button label
  steps?: string[]; // getting-started list (welcome-style)
  editorialLabel?: string; // abandoned_2: text for the editorial link line
  support?: string; // support line (uses supportEmail)
}

const COPY: Record<TemplateName, Record<MailLang, Copy>> = {
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
};

export function renderTemplate(
  name: TemplateName,
  lang: string | undefined,
  vars: TemplateVars,
): RenderedEmail {
  const l = normalizeLang(lang);
  const c = COPY[name][l];

  const paras = c.intro.map((p) => `<p style="margin:0 0 12px">${p}</p>`).join('');

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

  const html = layout(
    `<h2 style="margin:0 0 16px;font-size:20px">${c.heading}</h2>
     <p style="margin:0 0 12px">${greeting(l, vars.name)}</p>
     ${paras}
     ${button(c.cta, vars.ctaUrl)}
     ${extra}
     <p style="color:#94a3b8;font-size:12px;word-break:break-all;margin-top:16px">${vars.ctaUrl}</p>`,
  );

  const textLines = [c.heading, '', greeting(l, vars.name), '', ...c.intro];
  if (c.steps) textLines.push('', ...c.steps);
  if (c.editorialLabel && vars.editorialUrl) {
    textLines.push('', `${c.editorialLabel}: ${vars.editorialUrl}`);
  }
  textLines.push('', `${c.cta}: ${vars.ctaUrl}`);
  if (c.support && vars.supportEmail) {
    textLines.push('', `${c.support} ${vars.supportEmail}`);
  }
  const text = textLines.join('\n');

  return { subject: c.subject, html, text };
}
