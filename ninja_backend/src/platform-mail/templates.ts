// Localized platform email templates (en / es / pt).
//
// Kept deliberately simple: one function per template that returns a fully
// rendered { subject, html, text } for a given language, falling back to
// English for any unknown language so a bad/blank locale never yields an
// empty email. The visual style matches the platform password-reset email.

export type TemplateName = 'welcome' | 'abandoned_signup';
export type MailLang = 'en' | 'es' | 'pt';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateVars {
  // A friendly name if we have one (falls back to a generic greeting).
  name?: string | null;
  // Primary call-to-action link (dashboard / finish-activation).
  ctaUrl: string;
  // The one-time activation price shown in the abandoned-signup email.
  offer?: string;
}

const BRAND = 'CORTEXA';
const ACCENT = '#2563eb';

function normalizeLang(lang?: string): MailLang {
  const l = String(lang || '').slice(0, 2).toLowerCase();
  return l === 'es' || l === 'pt' ? (l as MailLang) : 'en';
}

// Shared responsive-ish wrapper. Inline styles only (email clients strip <style>).
function layout(innerHtml: string): string {
  return `
  <div style="background:#f1f5f9;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:${ACCENT};padding:20px 28px">
        <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px">${BRAND}</span>
      </div>
      <div style="padding:28px;color:#0f172a;font-size:15px;line-height:1.6">
        ${innerHtml}
      </div>
      <div style="padding:18px 28px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.5">
        ${BRAND} — AI CRM for real estate teams.
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

const COPY: Record<
  TemplateName,
  Record<MailLang, (v: TemplateVars) => { subject: string; heading: string; lines: string[]; cta: string }>
> = {
  welcome: {
    en: () => ({
      subject: 'Welcome to CORTEXA — your account is active',
      heading: 'Welcome to CORTEXA',
      lines: [
        'Your payment was confirmed and your account is now active.',
        'Jump back in and start turning conversations into booked appointments with your AI agent.',
      ],
      cta: 'Go to your dashboard',
    }),
    es: () => ({
      subject: 'Bienvenido a CORTEXA: tu cuenta está activa',
      heading: 'Bienvenido a CORTEXA',
      lines: [
        'Tu pago fue confirmado y tu cuenta ya está activa.',
        'Vuelve a entrar y empieza a convertir conversaciones en citas agendadas con tu agente de IA.',
      ],
      cta: 'Ir a tu panel',
    }),
    pt: () => ({
      subject: 'Bem-vindo à CORTEXA — sua conta está ativa',
      heading: 'Bem-vindo à CORTEXA',
      lines: [
        'Seu pagamento foi confirmado e sua conta já está ativa.',
        'Volte e comece a transformar conversas em agendamentos com seu agente de IA.',
      ],
      cta: 'Ir para o painel',
    }),
  },
  abandoned_signup: {
    en: (v) => ({
      subject: `You're one step away — activate CORTEXA for ${v.offer || '$7'}`,
      heading: 'Your CORTEXA account is waiting',
      lines: [
        'You started creating your account but did not finish.',
        `Complete your activation now for a one-time ${v.offer || '$7'} fee and put your AI agent to work today.`,
      ],
      cta: 'Finish activation',
    }),
    es: (v) => ({
      subject: `Estás a un paso: activa CORTEXA por ${v.offer || '$7'}`,
      heading: 'Tu cuenta de CORTEXA te espera',
      lines: [
        'Empezaste a crear tu cuenta pero no terminaste.',
        `Completa tu activación ahora por un único pago de ${v.offer || '$7'} y pon a trabajar a tu agente de IA hoy mismo.`,
      ],
      cta: 'Completar activación',
    }),
    pt: (v) => ({
      subject: `Falta um passo — ative a CORTEXA por ${v.offer || '$7'}`,
      heading: 'Sua conta CORTEXA está esperando',
      lines: [
        'Você começou a criar sua conta, mas não concluiu.',
        `Conclua sua ativação agora por uma taxa única de ${v.offer || '$7'} e coloque seu agente de IA para trabalhar hoje.`,
      ],
      cta: 'Concluir ativação',
    }),
  },
};

export function renderTemplate(
  name: TemplateName,
  lang: string | undefined,
  vars: TemplateVars,
): RenderedEmail {
  const l = normalizeLang(lang);
  const c = COPY[name][l](vars);
  const bodyLines = c.lines.map((p) => `<p style="margin:0 0 12px">${p}</p>`).join('');
  const html = layout(
    `<h2 style="margin:0 0 16px;font-size:20px">${c.heading}</h2>
     <p style="margin:0 0 12px">${greeting(l, vars.name)}</p>
     ${bodyLines}
     ${button(c.cta, vars.ctaUrl)}
     <p style="color:#64748b;font-size:13px;word-break:break-all">${vars.ctaUrl}</p>`,
  );
  const text = `${c.heading}\n\n${greeting(l, vars.name)}\n\n${c.lines.join(
    '\n',
  )}\n\n${c.cta}: ${vars.ctaUrl}`;
  return { subject: c.subject, html, text };
}
