// Promotional "Business Plan — 25% Off ($257/mo)" campaign email (EN / ES / PT).
//
// LITERAL reproduction of the client's APPROVED email UX. The client's design is a
// finished, composed layout (exact colors, spacing, proportions, positioning and
// visual hierarchy), so it is reproduced by rendering the approved design ITSELF as
// section images — the only way an HTML email can match a pixel-composed design
// exactly. The two CTAs ("Claim your $257 offer" and "Get my 25% discount") are
// clickable (each section image is wrapped in a link to the promo checkout), and the
// footer's unsubscribe is a real link. The tiny legal line is real HTML text (so the
// unsubscribe link works and stays compliant); everything else is the approved design.
//
// Section images live at https://www.cortexaaicrm.com/promo/<lang>-<section>.png
// (AI-Listo/public/promo/, sliced from the approved designs at clean whitespace
// gaps). EN + ES are the two designs the client supplied and approved. PT reuses the
// EN creative (no Portuguese design was supplied) with a Portuguese subject + legal.
//
// Rendered through the same token path as the other rich emails (renderTemplate /
// renderOnboarding in templates.ts): {{promo_checkout_url}} = the $257 promo checkout,
// {{unsubscribe_url}} = the per-recipient opt-out. Bulk-only (manual-email.catalog.ts).

import { MailLang } from './templates';
import { OnbEmail } from './onboarding-emails.data';

interface PromoCopy {
  subject: string;
  preheader: string;
  // Which slice set to use: 'en' or 'es' (PT reuses 'en').
  img: 'en' | 'es';
  alt: { top: string; hero: string; mid: string; cta: string; foot: string };
  // Legal line (real HTML so the unsubscribe link works). Matches the approved
  // design's footer legal text per language.
  footReason: string;
  footNote: string;
  unsub: string;
  rights: string;
}

const BASE = 'https://www.cortexaaicrm.com/promo';
const LINK = '{{promo_checkout_url}}';

function promoHtml(c: PromoCopy): string {
  const img = (name: string, alt: string) =>
    `<img src="${BASE}/${c.img}-${name}.png" width="660" alt="${alt}" ` +
    `style="display:block;width:100%;max-width:660px;height:auto;border:0;outline:none;text-decoration:none;" />`;
  const linked = (name: string, alt: string) =>
    `<a href="${LINK}" target="_blank" style="display:block;text-decoration:none;">${img(name, alt)}</a>`;

  return `
<div style="background:#ffffff;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:0;">
<table role="presentation" width="660" cellpadding="0" cellspacing="0" style="width:660px;max-width:100%;">
<tr><td style="font-size:0;line-height:0;">${img('top', c.alt.top)}</td></tr>
<tr><td style="font-size:0;line-height:0;">${linked('hero', c.alt.hero)}</td></tr>
<tr><td style="font-size:0;line-height:0;">${img('mid', c.alt.mid)}</td></tr>
<tr><td style="font-size:0;line-height:0;">${linked('cta', c.alt.cta)}</td></tr>
<tr><td style="font-size:0;line-height:0;">${img('helpfoot', c.alt.foot)}</td></tr>
<tr><td style="padding:16px 22px 30px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:1.8;color:#9aa0ac;">
${c.footReason}<br/>${c.footNote} <a href="{{unsubscribe_url}}" style="color:#5647d6;text-decoration:underline;">${c.unsub}</a>.<br/>${c.rights}
</td></tr>
</table>
</td></tr>
</table>
</div>`;
}

const EN: PromoCopy = {
  subject: 'Your most popular plan, 25% off — Business for $257/month',
  preheader: 'Limited-time 25% off the Business Plan: unlimited AI, 1 workspace, up to 3 users.',
  img: 'en',
  alt: {
    top: 'Cortexa — limited time offer for registered members',
    hero: 'Take Your Business to the Next Level. Business Plan special offer: $257/month, 25% off (was $347). Unlimited AI, up to 3 users, 1 workspace included, full platform access. Claim your $257 offer.',
    mid: 'Let Cortexa work 24/7: the AI Agent answers and qualifies, books appointments and updates your pipeline. Everything you need in one OS — AI Agent 24/7, WhatsApp automation, smart CRM & pipeline, powerful analytics, team workspace, built for your business.',
    cta: 'Limited time only: get 25% off our most popular Business Plan — $257/month. Get my 25% discount.',
    foot: 'Need help deciding? Just reply to this email. Cortexa — all-in-one platform.',
  },
  footReason: "You received this email because you're a registered Cortexa member.",
  footNote: 'If you no longer wish to receive these emails, you can',
  unsub: 'unsubscribe',
  rights: '© 2026 Cortexa OS. All rights reserved.',
};

const ES: PromoCopy = {
  subject: 'Tu plan más popular, 25% de descuento — Negocios por $257/mes',
  preheader: '25% de descuento por tiempo limitado en el plan Negocios: IA ilimitada, 1 workspace, hasta 3 usuarios.',
  img: 'es',
  alt: {
    top: 'Cortexa — oferta por tiempo limitado para miembros registrados',
    hero: 'Lleva tu negocio al siguiente nivel. Oferta especial: $257/mes, 25% de descuento (antes $347). IA ilimitada, hasta 3 usuarios, 1 workspace incluido, acceso completo a la plataforma. Obtener mi plan por $257.',
    mid: 'Deja que la IA trabaje 24/7: el AI Agent responde y califica, agenda citas y actualiza tu pipeline. Todo lo que necesitas en un solo OS: AI Agent 24/7, automatización WhatsApp, CRM inteligente y pipeline, analíticas poderosas, team workspace, hecho para tu negocio.',
    cta: 'Oferta por tiempo limitado: obtén 25% de descuento en nuestro plan por solo $257/mes. Obtener 25% de descuento.',
    foot: '¿Tienes preguntas? Solo responde a este correo. Cortexa — una plataforma todo en uno.',
  },
  footReason: 'Recibiste este correo porque eres un miembro registrado de Cortexa.',
  footNote: 'Si ya no deseas recibir estos correos, puedes',
  unsub: 'cancelar la suscripción',
  rights: '© 2026 Cortexa OS. Todos los derechos reservados.',
};

// No Portuguese design was supplied, so PT reuses the approved English creative with
// a Portuguese subject + legal line.
const PT: PromoCopy = {
  subject: 'Seu plano mais popular, 25% de desconto — Business por $257/mês',
  preheader: '25% de desconto por tempo limitado no plano Business: IA ilimitada, 1 workspace, até 3 usuários.',
  img: 'en',
  alt: {
    top: 'Cortexa — oferta por tempo limitado para membros registrados',
    hero: 'Leve o seu negócio ao próximo nível. Oferta especial: $257/mês, 25% de desconto (antes $347). IA ilimitada, até 3 usuários, 1 workspace incluído, acesso completo. Garantir meu plano por $257.',
    mid: 'Deixe a IA trabalhar 24/7. Tudo o que você precisa em um só OS: AI Agent 24/7, automação WhatsApp, CRM inteligente e pipeline, análises poderosas, team workspace, feito para o seu negócio.',
    cta: 'Oferta por tempo limitado: ganhe 25% de desconto no nosso plano por apenas $257/mês. Quero meu desconto de 25%.',
    foot: 'Precisa de ajuda para decidir? Basta responder a este e-mail. Cortexa — plataforma tudo em um.',
  },
  footReason: 'Você recebeu este e-mail porque é um membro registrado da Cortexa.',
  footNote: 'Se não quiser mais receber estes e-mails, você pode',
  unsub: 'cancelar a inscrição',
  rights: '© 2026 Cortexa OS. Todos os direitos reservados.',
};

function build(c: PromoCopy): OnbEmail {
  return { subject: c.subject, preheader: c.preheader, html: promoHtml(c) };
}

// One promotional template with three language versions. The bulk language selector
// picks which one is sent.
export const PROMO_EMAILS: Record<string, Record<MailLang, OnbEmail>> = {
  promo_business_257: { en: build(EN), es: build(ES), pt: build(PT) },
};
