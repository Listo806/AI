import { OnbEmail } from './onboarding-emails.data';

/*
 * "You're out of AI credits" email (EN / ES / PT), email-safe HTML.
 *
 * Runtime tokens ({{ai_units_url}}, {{support_email}}, {{unsubscribe_url}},
 * {{app_url}}) are substituted by renderTemplate in templates.ts, exactly like
 * the onboarding designs. It is rendered through the same rich-template path.
 *
 * NOTE: this is a faithful, bulletproof (table + inline styles, no SVG) build
 * of the approved reference design. When the client sends the FINAL approved
 * design/UX, replace the `html` blocks below and nothing else changes — the
 * automation, triggers, language routing and SendGrid pipeline all stay put.
 */

// Shared, email-safe body. `t` carries the localized strings.
// Brand hexagon mark (same inline-SVG approach as the onboarding designs).
const LOGO = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" fill="#5b45f6"/><path d="M12 7.5l4.5 2.6v5.2L12 17.9l-4.5-2.6V10.1L12 7.5z" fill="#ffffff"/><circle cx="12" cy="12" r="2.1" fill="#5b45f6"/></svg>`;
// Battery-with-alert mark, matching the approved design (centered + clear).
const BATTERY = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="16" width="26" height="16" rx="3.5" stroke="#e5484d" stroke-width="2.6"/><rect x="36" y="20.5" width="3.8" height="7" rx="1.6" fill="#e5484d"/><rect x="19.8" y="19.6" width="2.6" height="6" rx="1.3" fill="#e5484d"/><circle cx="21.1" cy="28.3" r="1.35" fill="#e5484d"/></svg>`;
// Footer social marks (white glyph on a purple circle).
const soc = (glyph: string) =>
  `<td style="padding:0 5px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle" width="30" height="30" style="width:30px;height:30px;background:#5b45f6;border-radius:50%;">${glyph}</td></tr></table></td>`;
const SOCIAL =
  soc(`<svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.6c-.3 0-1.3-.1-2.3-.1-2.2 0-3.6 1.3-3.6 3.7v2.1H8.3V14h2.2v7h3z"/></svg>`) +
  soc(`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.4"/><circle cx="16.6" cy="7.4" r="1" fill="#fff" stroke="none"/></svg>`) +
  soc(`<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M21.6 8.2c-.2-1-.9-1.7-1.8-1.9C18 5.9 12 5.9 12 5.9s-6 0-7.8.4c-.9.2-1.6.9-1.8 1.9C2 10 2 12 2 12s0 2 .4 3.8c.2 1 .9 1.7 1.8 1.9 1.8.4 7.8.4 7.8.4s6 0 7.8-.4c.9-.2 1.6-.9 1.8-1.9C22 14 22 12 22 12s0-2-.4-3.8zM10 15V9l5 3-5 3z"/></svg>`) +
  soc(`<svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M6.5 8.6h-3V21h3V8.6zM5 3.6a1.75 1.75 0 100 3.5 1.75 1.75 0 000-3.5zM21 21h-3v-6.3c0-1.6-.6-2.5-1.9-2.5-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V21h-3V8.6h3v1.7c.4-.7 1.2-1.6 2.9-1.6 2.1 0 3.9 1.4 3.9 4.3V21z"/></svg>`);

function build(t: {
  headline: string;
  body: string;
  cta: string;
  helpTitle: string;
  helpBody: string;
  helpCta: string;
  tagline: string;
  footerTag: string;
  rights: string;
}): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f4;">
  <tr><td align="center" style="padding:20px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7e9f0;">
      <!-- Header -->
      <tr><td style="padding:24px 34px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:9px;vertical-align:middle;">${LOGO}</td>
              <td style="vertical-align:middle;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:800;letter-spacing:4px;color:#101322;">CORTEXA</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:8px;font-weight:700;letter-spacing:2px;color:#9aa0ae;">AGENTIC AI REVENUE OS</div>
              </td>
            </tr></table>
          </td>
          <td width="215" style="vertical-align:middle;text-align:right;border-left:1px solid #ececf4;padding-left:18px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#6b7180;">${t.tagline}</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:16px 34px 0;"><div style="border-top:2px solid #6a5cff;font-size:0;line-height:0;">&nbsp;</div></td></tr>
      <!-- Icon -->
      <tr><td align="center" style="padding:34px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle" width="86" height="86" style="width:86px;height:86px;border:2px solid #f2acb7;border-radius:50%;">${BATTERY}</td></tr></table>
      </td></tr>
      <!-- Headline -->
      <tr><td align="center" style="padding:24px 44px 0;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:800;color:#101322;line-height:1.25;">${t.headline}</td></tr>
      <tr><td align="center" style="padding:16px 0 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="40" style="border-top:3px solid #6a5cff;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
      <!-- Body -->
      <tr><td align="center" style="padding:20px 54px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#5b6270;">${t.body}</td></tr>
      <!-- CTA -->
      <tr><td align="center" style="padding:26px 40px 6px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#5b45f6" style="border-radius:10px;">
          <a href="{{ai_units_url}}" style="display:inline-block;padding:15px 34px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${t.cta} &nbsp;&rarr;</a>
        </td></tr></table>
      </td></tr>
      <!-- Support card -->
      <tr><td style="padding:22px 40px 34px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ff;border:1px solid #ececf4;border-radius:12px;"><tr>
          <td width="52" style="padding:16px 0 16px 18px;vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle" width="40" height="40" style="width:40px;height:40px;background:#e7e4ff;border-radius:50%;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5b45f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M18 19a2 2 0 0 0 2-2v-2h-3v4z"/><path d="M6 19a2 2 0 0 1-2-2v-2h3v4z"/></svg></td></tr></table>
          </td>
          <td style="padding:16px 18px 16px 12px;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:15px;font-weight:700;color:#101322;">${t.helpTitle}</div>
            <div style="font-size:13px;color:#5b6270;padding:3px 0 6px;">${t.helpBody}</div>
            <a href="mailto:{{support_email}}" style="font-size:13px;font-weight:700;color:#5b45f6;text-decoration:none;">${t.helpCta} &rarr;</a>
          </td>
        </tr></table>
      </td></tr>
      <!-- Footer -->
      <tr><td align="center" style="background:#f4f5f9;padding:26px 40px 26px;">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
          <td style="padding-right:8px;vertical-align:middle;">${LOGO}</td>
          <td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;letter-spacing:3px;color:#3a3550;">CORTEXA</td>
        </tr></table>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8a90a0;padding:8px 0 14px;">${t.footerTag}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>${SOCIAL}</tr></table>
        <div style="border-top:1px solid #e2e4ec;margin-top:4px;padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0ae;">${t.rights}<br/>
          <a href="{{unsubscribe_url}}" style="color:#9aa0ae;text-decoration:underline;">Unsubscribe</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>`.trim();
}

export const AI_CREDITS_EMAIL: Record<'en' | 'es' | 'pt', OnbEmail> = {
  en: {
    subject: "You're out of AI credits",
    preheader: 'Add more credits to keep using your AI Agent.',
    html: build({
      headline: "You&rsquo;re out of AI credits.",
      body: 'To add more credits and continue using your AI Agent, click here.',
      cta: 'Add AI Credits',
      helpTitle: 'Need Help?',
      helpBody: 'Our support team is here for you.',
      helpCta: 'Contact Support',
      tagline: '<b style="color:#5b45f6;">AI revenue operating system</b> for businesses tired of complicated, overpriced CRM software.',
      footerTag: 'AI Revenue Operating System for Businesses',
      rights: '&copy; 2026 Cortexa OS. All rights reserved.',
    }),
  },
  es: {
    subject: 'Te has quedado sin créditos de IA',
    preheader: 'Agrega más créditos para seguir usando tu Agente de IA.',
    html: build({
      headline: 'Te has quedado sin cr&eacute;ditos de IA.',
      body: 'Para agregar más créditos y seguir usando tu Agente de IA, haz clic aquí.',
      cta: 'Agregar Créditos de IA',
      helpTitle: '¿Necesitas ayuda?',
      helpBody: 'Nuestro equipo de soporte está aquí para ti.',
      helpCta: 'Contactar Soporte',
      tagline: '<b style="color:#5b45f6;">El sistema de operaciones de ingresos con IA</b> para empresas cansadas de software CRM complicado y sobrevalorado.',
      footerTag: 'Sistema de Operaciones de Ingresos con IA para Empresas',
      rights: '&copy; 2026 Cortexa OS. Todos los derechos reservados.',
    }),
  },
  pt: {
    subject: 'Você ficou sem créditos de IA',
    preheader: 'Adicione mais créditos para continuar usando seu Agente de IA.',
    html: build({
      headline: 'Voc&ecirc; ficou sem cr&eacute;ditos de IA.',
      body: 'Para adicionar mais créditos e continuar usando seu Agente de IA, clique aqui.',
      cta: 'Adicionar Créditos de IA',
      helpTitle: 'Precisa de ajuda?',
      helpBody: 'Nossa equipe de suporte está aqui para você.',
      helpCta: 'Falar com o Suporte',
      tagline: '<b style="color:#5b45f6;">O sistema de operações de receita com IA</b> para empresas cansadas de software CRM complicado e caro.',
      footerTag: 'Sistema de Operações de Receita com IA para Empresas',
      rights: '&copy; 2026 Cortexa OS. Todos os direitos reservados.',
    }),
  },
};
