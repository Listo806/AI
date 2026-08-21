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
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;">
      <!-- Header -->
      <tr><td style="padding:26px 34px 18px;border-bottom:1px solid #ececf4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;letter-spacing:5px;color:#101322;">CORTEXA</td>
          <td style="vertical-align:middle;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#6b7180;padding-left:20px;">${t.tagline}</td>
        </tr></table>
      </td></tr>
      <!-- Icon -->
      <tr><td align="center" style="padding:34px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="84" height="84" style="width:84px;height:84px;border:2px solid #ef5f7a;border-radius:50%;font-family:Arial,Helvetica,sans-serif;font-size:34px;font-weight:800;color:#ef5f7a;line-height:80px;">!</td></tr></table>
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
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="40" height="40" style="width:40px;height:40px;background:#e7e4ff;border-radius:50%;font-size:18px;line-height:40px;">&#127911;</td></tr></table>
          </td>
          <td style="padding:16px 18px 16px 12px;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:15px;font-weight:700;color:#101322;">${t.helpTitle}</div>
            <div style="font-size:13px;color:#5b6270;padding:3px 0 6px;">${t.helpBody}</div>
            <a href="mailto:{{support_email}}" style="font-size:13px;font-weight:700;color:#5b45f6;text-decoration:none;">${t.helpCta} &rarr;</a>
          </td>
        </tr></table>
      </td></tr>
      <!-- Footer -->
      <tr><td align="center" style="background:#f3f4f8;padding:26px 40px 28px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;letter-spacing:4px;color:#3a3550;">CORTEXA</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8a90a0;padding:6px 0 14px;">${t.footerTag}</div>
        <div style="border-top:1px solid #e2e4ec;padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9aa0ae;">${t.rights}<br/>
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
