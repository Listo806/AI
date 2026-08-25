// Promotional "Business Plan — 25% Off ($257/mo)" campaign email (EN / ES / PT).
//
// Rich, email-safe HTML rendered through the SAME token-substitution path as the
// onboarding designs (see renderTemplate/renderOnboarding in templates.ts). This
// template is BULK-ONLY (see manual-email.catalog.ts): it is offered in the bulk
// campaign template selector and never in the single-customer dropdown.
//
// The primary CTA opens the checkout for the promotional $257 Business price
// (Paddle price pri_01m0v8vg783g3f1xfvdkeqb15w — charged immediately, no trial)
// via the {{promo_checkout_url}} token, which the mailer fills in per send.
//
// Faithful to the two approved designs ("Take Your Business to the Next Level." /
// "Lleva tu negocio al siguiente nivel."). The PT version is a translation of the
// same approved design.

import { MailLang } from './templates';
import { OnbEmail } from './onboarding-emails.data';

interface PromoCopy {
  subject: string;
  preheader: string;
  topbar: string;
  badge: string;
  h1a: string;
  h1b: string; // accented part of the headline
  sub: string;
  cardPlan: string;
  cardOffer: string;
  ribbon: string;
  per: string; // "/month"
  wasPrefix: string; // strikethrough label, e.g. "$347/month"
  save: string; // "You save $90 every month"
  feats: string[]; // 4 offer-card feature labels
  cta: string; // "Claim Your $257 Offer"
  secure: string; // "Secure checkout • Cancel anytime"
  bandTitleA: string;
  bandTitleB: string;
  bandBody: string;
  flow: Array<{ t: string }>; // 3 steps
  bandFoot: string;
  gridTitleA: string;
  gridTitleB: string;
  gridSub: string;
  features: Array<{ t: string; d: string }>; // 6 features
  ctaBandTag: string;
  ctaBandTitle: string;
  ctaBandBody: string;
  ctaBandBtn: string;
  helpTitle: string;
  helpBody: string;
  footTag: string;
  footReason: string;
  unsub: string; // "unsubscribe" link word
  footNote: string;
  rights: string;
}

const LOGO = 'https://www.cortexaaicrm.com/cortexa-email-logo.png';
const PURPLE = '#6d5cf0';
const PURPLE_DK = '#5a49d6';
const INK = '#101322';
const BODY = '#475467';
const GREEN = '#16a34a';

// Feature-grid icons (inline SVG, stroked in brand purple).
const ICONS = [
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d5cf0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d5cf0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d5cf0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d5cf0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d5cf0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d5cf0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z"/></svg>',
];

const CHECK =
  '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:#eae7fe;color:#6d5cf0;text-align:center;line-height:18px;font-weight:700;font-size:11px;vertical-align:middle;">&#10003;</span>';

function promoHtml(c: PromoCopy): string {
  const font = 'font-family:Arial,Helvetica,sans-serif;';

  const offerFeats = c.feats
    .map(
      (f) =>
        `<td width="50%" valign="middle" style="${font}font-size:13px;color:${INK};padding:6px 4px;">${CHECK}&nbsp;&nbsp;${f}</td>`,
    );
  const offerRows =
    `<tr>${offerFeats[0]}${offerFeats[1]}</tr><tr>${offerFeats[2]}${offerFeats[3]}</tr>`;

  const flowCells = c.flow
    .map(
      (f, i) =>
        `${i > 0 ? '<td width="24" align="center" valign="middle" style="' + font + 'color:#c3c7d2;font-size:18px;">&#8594;</td>' : ''}` +
        `<td align="center" valign="top" style="padding:0 4px;">` +
        `<span style="display:inline-block;width:44px;height:44px;border-radius:50%;background:#eae7fe;line-height:44px;">${ICONS[i === 0 ? 1 : i === 1 ? 5 : 3]}</span>` +
        `<div style="${font}font-size:12px;font-weight:700;color:${INK};padding-top:8px;line-height:15px;">${f.t}</div></td>`,
    )
    .join('');

  const featCell = (f: { t: string; d: string }, icon: string) =>
    `<td width="50%" valign="top" style="padding:10px 10px;">` +
    `<span style="display:inline-block;width:40px;height:40px;border-radius:10px;background:#f4f2ff;line-height:44px;text-align:center;">${icon}</span>` +
    `<div style="${font}font-size:14px;font-weight:700;color:${INK};padding:10px 0 4px;">${f.t}</div>` +
    `<div style="${font}font-size:12.5px;line-height:18px;color:${BODY};">${f.d}</div></td>`;

  const F = c.features;
  const featGrid =
    `<tr>${featCell(F[0], ICONS[0])}${featCell(F[1], ICONS[1])}</tr>` +
    `<tr>${featCell(F[2], ICONS[2])}${featCell(F[3], ICONS[3])}</tr>` +
    `<tr>${featCell(F[4], ICONS[4])}${featCell(F[5], ICONS[5])}</tr>`;

  return `
<div style="background:#f1f1f6;padding:0;margin:0;${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f1f6;">
<tr><td align="center" style="padding:14px 12px;${font}font-size:12px;color:#8a90a0;">${c.topbar}</td></tr>
<tr><td align="center" style="padding:0 12px 32px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e6ee;">

<!-- logo -->
<tr><td style="padding:24px 32px 8px;">
<img src="${LOGO}" width="200" alt="Cortexa — Agentic AI Revenue OS" style="display:block;width:200px;max-width:70%;height:auto;border:0;" />
</td></tr>

<!-- hero -->
<tr><td style="padding:16px 32px 8px;">
<div style="${font}font-size:12px;font-weight:700;letter-spacing:1px;color:${PURPLE};text-transform:uppercase;">${c.badge}</div>
<div style="${font}font-size:32px;line-height:1.15;font-weight:800;color:${INK};padding:10px 0 0;">${c.h1a} <span style="color:${PURPLE};">${c.h1b}</span></div>
<div style="${font}font-size:15px;line-height:1.6;color:${BODY};padding:14px 0 0;">${c.sub}</div>
</td></tr>

<!-- offer card -->
<tr><td style="padding:20px 32px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9ff;border:1px solid #e7e3fb;border-radius:14px;">
<tr><td style="padding:22px 22px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="top" style="${font}font-size:12px;font-weight:700;letter-spacing:.5px;color:${INK};text-transform:uppercase;">${c.cardPlan}<br/><span style="color:${PURPLE};">${c.cardOffer}</span></td>
<td align="right" valign="top"><span style="display:inline-block;background:${PURPLE};color:#fff;${font}font-size:12px;font-weight:800;line-height:1.1;padding:8px 12px;border-radius:8px;text-align:center;">${c.ribbon}</span></td>
</tr></table>
<div style="padding:12px 0 2px;"><span style="${font}font-size:44px;font-weight:800;color:${PURPLE};">$257</span><span style="${font}font-size:16px;color:${BODY};">${c.per}</span></div>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="${font}font-size:14px;color:#98a2b3;text-decoration:line-through;padding-right:14px;">${c.wasPrefix}</td>
<td style="${font}font-size:14px;font-weight:700;color:${GREEN};">${c.save}</td>
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding-top:12px;">${offerRows}</table>
</td></tr>
<tr><td style="padding:14px 22px 22px;">
<a href="{{promo_checkout_url}}" style="display:block;background:${PURPLE};color:#ffffff;${font}font-size:16px;font-weight:700;text-decoration:none;text-align:center;padding:15px 20px;border-radius:10px;">${c.cta} &#8594;</a>
<div style="${font}font-size:12px;color:#98a2b3;text-align:center;padding-top:10px;">&#128274; ${c.secure}</div>
</td></tr>
</table>
</td></tr>

<!-- 24/7 band -->
<tr><td style="padding:20px 32px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ff;border-radius:14px;"><tr><td style="padding:22px;">
<div style="${font}font-size:18px;font-weight:800;color:${PURPLE};">${c.bandTitleA} <span style="color:${INK};">${c.bandTitleB}</span></div>
<div style="${font}font-size:13.5px;line-height:1.6;color:${BODY};padding:10px 0 16px;">${c.bandBody}</div>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>${flowCells}</tr></table>
<div style="${font}font-size:13px;font-weight:700;color:${INK};padding-top:16px;">${c.bandFoot}</div>
</td></tr></table>
</td></tr>

<!-- feature grid -->
<tr><td style="padding:26px 26px 0;text-align:center;">
<div style="${font}font-size:22px;font-weight:800;color:${INK};"><span style="color:${PURPLE};">${c.gridTitleA}</span> ${c.gridTitleB}</div>
<div style="${font}font-size:13.5px;line-height:1.6;color:${BODY};padding:10px 6px 6px;">${c.gridSub}</div>
</td></tr>
<tr><td style="padding:4px 16px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${featGrid}</table>
</td></tr>

<!-- CTA band -->
<tr><td style="padding:16px 32px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ff;border-radius:14px;"><tr><td style="padding:22px;">
<div style="${font}font-size:12px;font-weight:700;letter-spacing:1px;color:${PURPLE};text-transform:uppercase;">${c.ctaBandTag}</div>
<div style="${font}font-size:17px;font-weight:800;color:${INK};padding:8px 0 4px;">${c.ctaBandTitle}</div>
<div style="${font}font-size:13px;line-height:1.55;color:${BODY};padding-bottom:16px;">${c.ctaBandBody}</div>
<a href="{{promo_checkout_url}}" style="display:inline-block;background:${PURPLE};color:#ffffff;${font}font-size:14px;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:9px;">${c.ctaBandBtn} &#8594;</a>
</td></tr></table>
</td></tr>

<!-- help -->
<tr><td style="padding:16px 32px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fa;border-radius:12px;"><tr><td style="padding:18px 20px;">
<div style="${font}font-size:14px;font-weight:700;color:${INK};">${c.helpTitle}</div>
<div style="${font}font-size:13px;line-height:1.55;color:${BODY};padding-top:6px;">${c.helpBody}</div>
</td></tr></table>
</td></tr>

<!-- footer -->
<tr><td style="padding:24px 32px 8px;border-top:1px solid #eeeef4;">
<img src="${LOGO}" width="170" alt="Cortexa" style="display:block;width:170px;max-width:60%;height:auto;border:0;" />
<div style="${font}font-size:12.5px;color:${BODY};padding-top:10px;">${c.footTag}</div>
</td></tr>
<tr><td style="padding:6px 32px 26px;">
<div style="${font}font-size:11.5px;line-height:1.6;color:#98a2b3;">${c.footReason}<br/>${c.footNote} <a href="{{unsubscribe_url}}" style="color:${PURPLE_DK};">${c.unsub}</a>.<br/>${c.rights}</div>
</td></tr>

</table>
</td></tr>
</table>
</div>`;
}

const EN: PromoCopy = {
  subject: 'Your most popular plan, 25% off — Business for $257/month',
  preheader: 'Limited-time 25% off the Business Plan: unlimited AI, 1 workspace, up to 3 users.',
  topbar: 'Limited time offer for registered Cortexa members.',
  badge: 'Limited time offer',
  h1a: 'Take Your Business to the',
  h1b: 'Next Level.',
  sub: 'For a limited time, get our most popular <b>Business Plan</b> with <b>25% OFF</b>. Unlimited AI, 1 Workspace and up to 3 users — everything you need to grow faster.',
  cardPlan: 'Business Plan',
  cardOffer: 'Special Offer',
  ribbon: '25%<br/>OFF',
  per: '/month',
  wasPrefix: '$347/month',
  save: 'You save $90 every month',
  feats: ['Unlimited AI', 'Up to 3 Users', '1 Workspace Included', 'Full Platform Access'],
  cta: 'Claim Your $257 Offer',
  secure: 'Secure checkout • Cancel anytime',
  bandTitleA: 'Let Cortexa Work 24/7',
  bandTitleB: 'So You Can Focus on Growth',
  bandBody:
    'Our AI Agent answers calls, chats and messages instantly, qualifies leads, books appointments on your calendar and updates your pipeline automatically.',
  flow: [{ t: 'AI Agent Answers & Qualifies' }, { t: 'Books Appointments' }, { t: 'Updates Your Pipeline' }],
  bandFoot: 'No missed opportunities. No manual follow-up. Just results.',
  gridTitleA: 'Everything You Need.',
  gridTitleB: 'All in One OS.',
  gridSub:
    'Cortexa brings your leads, customers, team and automation together — so you can focus on what matters most: growing your business.',
  features: [
    { t: 'AI Agent 24/7', d: 'Answers calls, chats and messages instantly, qualifies leads and books appointments while you focus on growth.' },
    { t: 'WhatsApp Automation', d: 'Engage leads and customers on autopilot. Follow up, nurture and close more through WhatsApp.' },
    { t: 'Smart CRM & Pipeline', d: 'Visual pipelines, automated follow-ups and deal tracking make every opportunity easy to manage.' },
    { t: 'Powerful Analytics', d: "Real-time dashboards and reports show what's working so you can make data-driven decisions." },
    { t: 'Team Workspace', d: 'Collaborate with your team, assign tasks, share files and keep projects moving in one place.' },
    { t: 'Built for Your Business', d: "Every business is different. We'll help configure Cortexa to match your workflows and goals." },
  ],
  ctaBandTag: 'Limited time only',
  ctaBandTitle: 'Get 25% OFF our most popular Business Plan.',
  ctaBandBody: 'Unlimited AI + 1 Workspace + Up to 3 Users for just $257/month.',
  ctaBandBtn: 'Get My 25% Discount',
  helpTitle: 'Need help deciding?',
  helpBody: 'Our team is here to help you get the most out of Cortexa. Just reply to this email — we’re happy to assist.',
  footTag: 'All-in-one platform. Infinite possibilities.',
  footReason: "You received this email because you're a registered Cortexa member.",
  unsub: 'unsubscribe',
  footNote: 'If you no longer wish to receive these emails, you can',
  rights: '© 2026 Cortexa OS. All rights reserved.',
};

const ES: PromoCopy = {
  subject: 'Tu plan más popular, 25% de descuento — Business por $257/mes',
  preheader: '25% de descuento por tiempo limitado en el plan Business: IA ilimitada, 1 workspace, hasta 3 usuarios.',
  topbar: 'Oferta por tiempo limitado para miembros registrados de Cortexa.',
  badge: 'Oferta por tiempo limitado',
  h1a: 'Lleva tu negocio al',
  h1b: 'siguiente nivel.',
  sub: 'Por tiempo limitado, obtén nuestro plan más popular <b>Business</b> con <b>25% DE DESCUENTO</b>. IA ilimitada, 1 Workspace y hasta 3 usuarios — todo lo que necesitas para crecer más rápido.',
  cardPlan: 'Plan Business',
  cardOffer: 'Oferta Especial',
  ribbon: '25%<br/>DTO',
  per: '/mes',
  wasPrefix: '$347/mes',
  save: 'Ahorras $90 cada mes',
  feats: ['IA ilimitada', 'Hasta 3 usuarios', '1 Workspace incluido', 'Acceso completo a la plataforma'],
  cta: 'Obtener mi plan por $257',
  secure: 'Pago seguro • Cancela cuando quieras',
  bandTitleA: 'Deja que la IA trabaje 24/7',
  bandTitleB: 'para ti',
  bandBody:
    'Nuestro AI Agent responde llamadas, chats y mensajes al instante, califica leads, agenda citas en tu calendario y actualiza tu pipeline automáticamente.',
  flow: [{ t: 'El AI Agent responde y califica' }, { t: 'Agenda citas' }, { t: 'Actualiza tu pipeline' }],
  bandFoot: 'Sin oportunidades perdidas. Sin seguimiento manual. Solo resultados.',
  gridTitleA: 'Todo lo que necesitas.',
  gridTitleB: 'Todo en un solo OS.',
  gridSub:
    'Cortexa reúne tus leads, clientes, equipo y automatizaciones en una sola plataforma para que puedas enfocarte en lo que realmente importa: hacer crecer tu negocio.',
  features: [
    { t: 'AI Agent 24/7', d: 'Responde llamadas, chats y mensajes al instante, califica leads y agenda citas mientras tú creces.' },
    { t: 'Automatización WhatsApp', d: 'Comunícate, da seguimiento y nutre a tus clientes automáticamente con WhatsApp.' },
    { t: 'CRM Inteligente y Pipeline', d: 'Visualiza tu pipeline, automatiza seguimientos y rastrea cada oportunidad para cerrar más.' },
    { t: 'Analíticas Poderosas', d: 'Dashboards en tiempo real que te muestran qué funciona para tomar mejores decisiones.' },
    { t: 'Team Workspace', d: 'Colabora con tu equipo, asigna tareas, comparte archivos y mantén todo organizado en un solo lugar.' },
    { t: 'Hecho para tu Negocio', d: 'Cada negocio es diferente. Te ayudamos a configurar Cortexa a tu forma de trabajar.' },
  ],
  ctaBandTag: 'Oferta por tiempo limitado',
  ctaBandTitle: 'Obtén 25% de descuento en nuestro plan Business.',
  ctaBandBody: 'IA ilimitada + 1 Workspace + hasta 3 usuarios por solo $257/mes.',
  ctaBandBtn: 'Obtener 25% de descuento',
  helpTitle: '¿Tienes preguntas?',
  helpBody: 'Nuestro equipo está aquí para ayudarte a sacar el máximo provecho de Cortexa. Solo responde a este correo y con gusto te asistiremos.',
  footTag: 'Una plataforma todo en uno. Posibilidades infinitas.',
  footReason: 'Recibiste este correo porque eres un miembro registrado de Cortexa.',
  unsub: 'cancelar la suscripción',
  footNote: 'Si ya no deseas recibir estos correos, puedes',
  rights: '© 2026 Cortexa OS. Todos los derechos reservados.',
};

const PT: PromoCopy = {
  subject: 'Seu plano mais popular, 25% de desconto — Business por $257/mês',
  preheader: '25% de desconto por tempo limitado no plano Business: IA ilimitada, 1 workspace, até 3 usuários.',
  topbar: 'Oferta por tempo limitado para membros registrados da Cortexa.',
  badge: 'Oferta por tempo limitado',
  h1a: 'Leve o seu negócio ao',
  h1b: 'próximo nível.',
  sub: 'Por tempo limitado, garanta o nosso plano mais popular <b>Business</b> com <b>25% DE DESCONTO</b>. IA ilimitada, 1 Workspace e até 3 usuários — tudo o que você precisa para crescer mais rápido.',
  cardPlan: 'Plano Business',
  cardOffer: 'Oferta Especial',
  ribbon: '25%<br/>OFF',
  per: '/mês',
  wasPrefix: '$347/mês',
  save: 'Você economiza $90 por mês',
  feats: ['IA ilimitada', 'Até 3 usuários', '1 Workspace incluído', 'Acesso completo à plataforma'],
  cta: 'Garantir meu plano por $257',
  secure: 'Pagamento seguro • Cancele quando quiser',
  bandTitleA: 'Deixe a IA trabalhar 24/7',
  bandTitleB: 'para você',
  bandBody:
    'Nosso AI Agent responde ligações, chats e mensagens na hora, qualifica leads, agenda compromissos no seu calendário e atualiza seu pipeline automaticamente.',
  flow: [{ t: 'O AI Agent responde e qualifica' }, { t: 'Agenda compromissos' }, { t: 'Atualiza seu pipeline' }],
  bandFoot: 'Sem oportunidades perdidas. Sem follow-up manual. Só resultados.',
  gridTitleA: 'Tudo o que você precisa.',
  gridTitleB: 'Tudo em um só OS.',
  gridSub:
    'A Cortexa reúne seus leads, clientes, equipe e automações em uma só plataforma — para você focar no que mais importa: fazer o seu negócio crescer.',
  features: [
    { t: 'AI Agent 24/7', d: 'Responde ligações, chats e mensagens na hora, qualifica leads e agenda compromissos enquanto você cresce.' },
    { t: 'Automação WhatsApp', d: 'Interaja, faça follow-up e nutra seus clientes automaticamente pelo WhatsApp.' },
    { t: 'CRM Inteligente e Pipeline', d: 'Pipelines visuais, follow-ups automáticos e acompanhamento de negócios para fechar mais.' },
    { t: 'Análises Poderosas', d: 'Dashboards em tempo real mostram o que está funcionando para decisões baseadas em dados.' },
    { t: 'Team Workspace', d: 'Colabore com sua equipe, atribua tarefas, compartilhe arquivos e mantenha tudo organizado.' },
    { t: 'Feito para o seu Negócio', d: 'Cada negócio é diferente. Ajudamos a configurar a Cortexa do seu jeito de trabalhar.' },
  ],
  ctaBandTag: 'Oferta por tempo limitado',
  ctaBandTitle: 'Ganhe 25% de desconto no nosso plano Business.',
  ctaBandBody: 'IA ilimitada + 1 Workspace + até 3 usuários por apenas $257/mês.',
  ctaBandBtn: 'Quero meu desconto de 25%',
  helpTitle: 'Precisa de ajuda para decidir?',
  helpBody: 'Nossa equipe está aqui para ajudar você a aproveitar o máximo da Cortexa. Basta responder a este e-mail — teremos prazer em ajudar.',
  footTag: 'Plataforma tudo em um. Possibilidades infinitas.',
  footReason: 'Você recebeu este e-mail porque é um membro registrado da Cortexa.',
  unsub: 'cancelar a inscrição',
  footNote: 'Se não quiser mais receber estes e-mails, você pode',
  rights: '© 2026 Cortexa OS. Todos os direitos reservados.',
};

function build(c: PromoCopy): OnbEmail {
  return { subject: c.subject, preheader: c.preheader, html: promoHtml(c) };
}

// One promotional template with three fully-authored language versions. The bulk
// language selector picks which one is sent; there is no silent fallback for the
// three supported languages.
export const PROMO_EMAILS: Record<string, Record<MailLang, OnbEmail>> = {
  promo_business_257: { en: build(EN), es: build(ES), pt: build(PT) },
};
