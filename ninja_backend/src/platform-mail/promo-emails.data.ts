// Promotional "Business Plan — 25% Off ($257/mo)" campaign email (EN / ES / PT).
//
// This is a FAITHFUL reproduction of the client's approved email UX
// ("Take Your Business to the Next Level." / "Lleva tu negocio al siguiente
// nivel."): the limited-time top bar, full Cortexa logo, the hero with the product
// DASHBOARD visual, the $257 offer card, the "Cortexa Works 24/7" band with its
// 3-step flow, the "Everything You Need" 6-feature grid, the "Limited Time Only"
// discount band, the "Need help deciding?" band, and the branded footer with
// social links. Reproduced as closely as email HTML allows.
//
// The one element that CANNOT be live HTML is the product dashboard — no email
// client can render a live app screen — so it is a hosted PNG cropped from the
// approved design (per language). Everything else (headlines, the offer numbers,
// feature copy, and the CTAs) stays real HTML so the buttons are clickable and the
// email is accessible/deliverable.
//
// Rendered through the same token-substitution path as the other rich emails
// (renderTemplate/renderOnboarding in templates.ts). Bulk-only (manual-email.catalog.ts).
// The primary CTA opens the $257 Business promo checkout via {{promo_checkout_url}};
// the unsubscribe footer uses {{unsubscribe_url}}. PT reuses the EN dashboard image.

import { MailLang } from './templates';
import { OnbEmail } from './onboarding-emails.data';

interface PromoCopy {
  subject: string;
  preheader: string;
  dashImg: string; // hosted dashboard screenshot for this language
  topbar: string;
  viewInBrowser: string;
  badge: string;
  h1a: string; // headline, dark part
  h1b: string; // headline, accented (purple) part
  sub: string; // hero subhead (may contain <b>)
  cardPlan: string; // "Business Plan"
  cardOffer: string; // "Special Offer"
  ribbonPct: string; // "25%"
  ribbonOff: string; // "OFF"
  per: string; // "/month"
  was: string; // "$347/month"
  save: string; // "You save $90 every month"
  feats: string[]; // 4 offer-card features
  cta: string; // "Claim Your $257 Offer"
  secure: string; // "Secure checkout • Cancel anytime"
  bandTitleA: string; // purple part
  bandTitleB: string; // dark part
  bandBody: string;
  bandStrong: string; // "No missed opportunities..."
  flow: string[]; // 3 step labels
  gridTitleA: string; // purple
  gridTitleB: string; // dark
  gridSub: string;
  features: Array<{ t: string; d: string }>; // 6
  ctaBandTag: string; // "Limited time only"
  ctaBandTitle: string;
  ctaBandBody: string;
  ctaBandBtn: string;
  helpTitle: string;
  helpBody: string;
  footTag: string;
  footReason: string;
  footNote: string;
  unsub: string;
  rights: string;
}

const LOGO = 'https://www.cortexaaicrm.com/cortexa-email-logo.png';
const PURPLE = '#6d5cf0';
const PURPLE_DK = '#5647d6';
const INK = '#181528';
const BODY = '#4b5563';
const MUTE = '#8a90a0';
const GREEN = '#16a34a';
const BAND = '#f2f0fe';
const CARD_BORDER = '#e8e4fb';
const FONT = "font-family:'Helvetica Neue',Arial,Helvetica,sans-serif;";

// Line-style icons matching the approved design (purple stroke). Inline SVG, as in
// the existing Cortexa onboarding emails.
function ico(paths: string, stroke = PURPLE, size = 22): string {
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
    `style="display:inline-block;vertical-align:middle;">${paths}</svg>`
  );
}
const I = {
  infinity:
    '<path d="M18.178 8c-3.148 0-4.264 3.5-6.178 3.5S8.97 8 5.822 8C3.71 8 2 9.79 2 12s1.71 4 3.822 4c3.148 0 4.264-3.5 6.178-3.5s3.03 3.5 6.178 3.5C20.29 16 22 14.21 22 12s-1.71-4-3.822-4z"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  grid:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  spark:
    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  bars: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  robot:
    '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>',
  funnel: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  puzzle:
    '<path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.2 2.2 0 1 1 0 4.4H2V19a2 2 0 0 0 2 2h3.8v-1.5a2.2 2.2 0 1 1 4.4 0V21H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/>',
  percent:
    '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  headset:
    '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  facebook:
    '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  linkedin:
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  youtube:
    '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
};

// Circular icon chip (light purple background) used across the design.
function chip(svg: string, bg = '#efeafe', size = 46): string {
  return (
    `<span style="display:inline-block;width:${size}px;height:${size}px;line-height:${size}px;` +
    `text-align:center;background:${bg};border-radius:50%;">${svg}</span>`
  );
}

function promoHtml(c: PromoCopy): string {
  // "You save $90 …": only the amount is green, the rest stays neutral (approved).
  const saveHtml = c.save
    .split('$90')
    .join(`<span style="color:${GREEN};">$90</span>`);

  // ── Offer card feature (icon + label), two per row ──
  const featIcon = [I.infinity, I.users, I.grid, I.shield];
  const offerRow = (a: number, b: number) =>
    `<tr>` +
    [a, b]
      .map(
        (i) =>
          `<td width="50%" valign="middle" style="padding:6px 4px;">` +
          `<table role="presentation" cellpadding="0" cellspacing="0"><tr>` +
          `<td valign="middle" style="padding-right:8px;">${chip(ico(featIcon[i], PURPLE, 18), '#efeafe', 30)}</td>` +
          `<td valign="middle" style="${FONT}font-size:13px;font-weight:600;color:${INK};">${c.feats[i]}</td>` +
          `</tr></table></td>`,
      )
      .join('') +
    `</tr>`;

  // ── Hero offer card ──
  const offerCard =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${CARD_BORDER};border-radius:16px;box-shadow:0 14px 34px rgba(60,45,130,.10);">` +
    `<tr><td style="padding:22px 22px 6px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td valign="top" style="${FONT}font-size:12px;font-weight:700;letter-spacing:.4px;color:${INK};text-transform:uppercase;line-height:1.5;">${c.cardPlan}<br/><span style="color:${MUTE};font-weight:600;">${c.cardOffer}</span></td>` +
    `<td align="right" valign="top" width="92"><span style="display:inline-block;width:74px;background:${PURPLE};color:#fff;${FONT}font-size:12px;font-weight:800;line-height:1.2;padding:9px 8px;border-radius:8px;text-align:center;"><span style="font-size:15px;">${c.ribbonPct}</span><br/>${c.ribbonOff}</span></td>` +
    `</tr></table>` +
    `<div style="padding:14px 0 2px;"><span style="${FONT}font-size:46px;font-weight:800;color:${PURPLE};letter-spacing:-1px;">$257</span> <span style="${FONT}font-size:16px;color:${BODY};font-weight:600;">${c.per}</span></div>` +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr>` +
    `<td style="${FONT}font-size:14px;color:${MUTE};text-decoration:line-through;padding-right:14px;">${c.was}</td>` +
    `<td style="${FONT}font-size:13px;font-weight:700;color:${INK};">${saveHtml}</td>` +
    `</tr></table>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding-top:12px;">${offerRow(0, 1)}${offerRow(2, 3)}</table>` +
    `</td></tr>` +
    `<tr><td style="padding:14px 22px 22px;">` +
    `<a href="{{promo_checkout_url}}" style="display:block;background:${PURPLE};color:#ffffff;${FONT}font-size:15px;font-weight:700;letter-spacing:.3px;text-decoration:none;text-align:center;padding:15px 18px;border-radius:11px;text-transform:uppercase;">${c.cta} &nbsp;&#8594;</a>` +
    `<div style="${FONT}font-size:12px;color:${MUTE};text-align:center;padding-top:12px;">&#128274;&nbsp; ${c.secure}</div>` +
    `</td></tr></table>`;

  // ── 24/7 band: 3-step flow ──
  const flowIco = [I.chat, I.calendar, I.bars];
  const flowCells = c.flow
    .map(
      (label, i) =>
        `${i > 0 ? `<td width="26" align="center" valign="middle">${ico(I.arrow, '#c7c2e6', 16)}</td>` : ''}` +
        `<td align="center" valign="top" width="88" style="padding:0 2px;">${chip(ico(flowIco[i], PURPLE, 20), '#ffffff', 44)}<div style="${FONT}font-size:11px;font-weight:700;color:${INK};line-height:1.3;padding-top:8px;">${label}</div></td>`,
    )
    .join('');

  const band247 =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BAND};border-radius:16px;"><tr><td style="padding:24px 26px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td class="c60" valign="top" width="60%" style="padding-right:14px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr>` +
    `<td valign="middle" style="padding-right:12px;">${chip(ico(I.spark, '#ffffff', 22), PURPLE, 40)}</td>` +
    `<td valign="middle" style="${FONT}font-size:17px;font-weight:800;line-height:1.25;"><span style="color:${PURPLE};">${c.bandTitleA}</span> <span style="color:${INK};">${c.bandTitleB}</span></td>` +
    `</tr></table>` +
    `<div style="${FONT}font-size:13.5px;line-height:1.6;color:${BODY};padding:12px 0 10px;">${c.bandBody}</div>` +
    `<div style="${FONT}font-size:13px;font-weight:700;color:${INK};">${c.bandStrong}</div>` +
    `</td>` +
    `<td class="c40" valign="middle" align="right" width="40%">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>${flowCells}</tr></table>` +
    `</td>` +
    `</tr></table>` +
    `</td></tr></table>`;

  // ── 6-feature grid ──
  const gridIco = [I.robot, I.chat, I.funnel, I.bars, I.users, I.puzzle];
  const featCard = (i: number) =>
    `<td class="c33" valign="top" width="33.33%" style="padding:14px 12px;">` +
    `<div>${chip(ico(gridIco[i], PURPLE, 22), '#efeafe', 46)}</div>` +
    `<div style="${FONT}font-size:14.5px;font-weight:700;color:${INK};padding:12px 0 5px;">${c.features[i].t}</div>` +
    `<div style="${FONT}font-size:12.5px;line-height:1.6;color:${BODY};">${c.features[i].d}</div>` +
    `</td>`;
  const featGrid =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr>${featCard(0)}${featCard(1)}${featCard(2)}</tr>` +
    `<tr>${featCard(3)}${featCard(4)}${featCard(5)}</tr>` +
    `</table>`;

  // ── Social row (footer) ──
  const social = [I.globe, I.facebook, I.linkedin, I.youtube]
    .map(
      (s) =>
        `<td width="34" align="center" valign="middle">${ico(s, INK, 18)}</td>`,
    )
    .join('<td width="8"></td>');

  return `
<div style="background:#ffffff;margin:0;padding:0;${FONT}">
<style>
@media only screen and (max-width:620px){
  .c60,.c40,.c33{display:block !important;width:100% !important;padding-right:0 !important;}
  .c40{padding-top:16px !important;}
  .heroL,.heroR{display:block !important;width:100% !important;padding:0 !important;}
  .heroR{padding-top:22px !important;}
  .tbL,.tbR{display:none !important;}
  .flowwrap{margin:0 auto !important;}
}
</style>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:0 12px;">
<table role="presentation" width="660" cellpadding="0" cellspacing="0" style="width:660px;max-width:100%;">

<!-- top bar: notice centered, view-in-browser at right -->
<tr><td style="padding:16px 6px 10px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td class="tbL" valign="middle" width="120">&nbsp;</td>
<td valign="middle" align="center" style="${FONT}font-size:12px;color:${MUTE};">${c.topbar}</td>
<td class="tbR" valign="middle" align="right" width="120" style="${FONT}font-size:12px;"><a href="{{promo_checkout_url}}" style="color:${MUTE};text-decoration:underline;">${c.viewInBrowser}</a></td>
</tr></table>
</td></tr>

<!-- content (edge-to-edge white, like the approved design) -->
<tr><td style="background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">

<!-- logo -->
<tr><td style="padding:24px 30px 4px;">
<img src="${LOGO}" width="205" alt="Cortexa — Agentic AI Revenue OS" style="display:block;width:205px;max-width:66%;height:auto;border:0;" />
</td></tr>

<!-- HERO: text + offer card (left) | dashboard image (right) -->
<tr><td style="padding:12px 30px 18px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td class="heroL" valign="top" width="48%" style="padding-right:14px;">
<div style="${FONT}font-size:12px;font-weight:700;letter-spacing:.8px;color:${PURPLE};text-transform:uppercase;">${c.badge} &#9201;</div>
<div style="${FONT}font-size:34px;line-height:1.1;font-weight:800;color:${INK};letter-spacing:-.5px;padding:10px 0 0;">${c.h1a} <span style="color:${PURPLE};">${c.h1b}</span></div>
<div style="${FONT}font-size:14.5px;line-height:1.6;color:${BODY};padding:14px 0 18px;">${c.sub}</div>
${offerCard}
</td>
<td class="heroR" valign="top" width="52%" align="right">
<img src="${c.dashImg}" width="375" alt="Cortexa dashboard" style="display:block;width:100%;max-width:380px;height:auto;border:0;margin-left:auto;" />
</td>
</tr></table>
</td></tr>

<!-- 24/7 band -->
<tr><td style="padding:6px 30px 6px;">${band247}</td></tr>

<!-- Everything You Need -->
<tr><td style="padding:30px 30px 0;text-align:center;">
<div style="${FONT}font-size:23px;font-weight:800;color:${INK};letter-spacing:-.3px;"><span style="color:${PURPLE};">${c.gridTitleA}</span> ${c.gridTitleB}</div>
<div style="${FONT}font-size:13.5px;line-height:1.6;color:${BODY};padding:12px 8px 4px;">${c.gridSub}</div>
</td></tr>
<tr><td style="padding:6px 20px 8px;">${featGrid}</td></tr>

<!-- Limited time only band -->
<tr><td style="padding:14px 30px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BAND};border-radius:16px;"><tr><td style="padding:22px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td class="c60" valign="middle" width="62%" style="padding-right:14px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" style="padding-right:12px;">${chip(ico(I.percent, '#ffffff', 20), PURPLE, 40)}</td>
<td valign="middle">
<div style="${FONT}font-size:11px;font-weight:700;letter-spacing:.8px;color:${PURPLE};text-transform:uppercase;">${c.ctaBandTag}</div>
<div style="${FONT}font-size:16px;font-weight:800;color:${INK};padding:3px 0 2px;">${c.ctaBandTitle}</div>
<div style="${FONT}font-size:12.5px;line-height:1.5;color:${BODY};">${c.ctaBandBody}</div>
</td></tr></table>
</td>
<td class="c40" valign="middle" align="right" width="38%">
<a href="{{promo_checkout_url}}" style="display:inline-block;background:${PURPLE};color:#ffffff;${FONT}font-size:13px;font-weight:700;letter-spacing:.3px;text-decoration:none;padding:14px 20px;border-radius:10px;text-transform:uppercase;">${c.ctaBandBtn} &nbsp;&#8594;</a>
</td>
</tr></table>
</td></tr></table>
</td></tr>

<!-- Need help deciding -->
<tr><td style="padding:8px 30px 4px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;border-radius:14px;"><tr><td style="padding:18px 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" width="52" style="padding-right:14px;">${chip(ico(I.headset, '#6b7280', 22), '#eceef2', 44)}</td>
<td valign="middle">
<div style="${FONT}font-size:14px;font-weight:700;color:${INK};">${c.helpTitle}</div>
<div style="${FONT}font-size:12.5px;line-height:1.55;color:${BODY};padding-top:4px;">${c.helpBody}</div>
</td></tr></table>
</td></tr></table>
</td></tr>

<!-- footer brand -->
<tr><td style="padding:26px 30px 14px;border-top:1px solid #eeeef4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" class="c60" width="62%">
<img src="${LOGO}" width="170" alt="Cortexa" style="display:block;width:170px;max-width:60%;height:auto;border:0;" />
<div style="${FONT}font-size:12.5px;color:${BODY};padding-top:10px;">${c.footTag}</div>
</td>
<td valign="middle" align="right" class="c40" width="38%">
<table role="presentation" cellpadding="0" cellspacing="0" align="right" class="flowwrap"><tr>${social}</tr></table>
</td>
</tr></table>
</td></tr>

</table>
</td></tr>

<!-- legal -->
<tr><td style="padding:18px 24px 30px;text-align:center;">
<div style="${FONT}font-size:11.5px;line-height:1.7;color:${MUTE};">${c.footReason}<br/>${c.footNote} <a href="{{unsubscribe_url}}" style="color:${PURPLE_DK};">${c.unsub}</a>.<br/>${c.rights}</div>
</td></tr>

</table>
</td></tr>
</table>
</div>`;
}

const DASH_EN = 'https://www.cortexaaicrm.com/cortexa-promo-dashboard-en.png';
const DASH_ES = 'https://www.cortexaaicrm.com/cortexa-promo-dashboard-es.png';

const EN: PromoCopy = {
  subject: 'Your most popular plan, 25% off — Business for $257/month',
  preheader: 'Limited-time 25% off the Business Plan: unlimited AI, 1 workspace, up to 3 users.',
  dashImg: DASH_EN,
  topbar: 'Limited time offer for registered Cortexa members.',
  viewInBrowser: 'View in browser',
  badge: 'Limited time offer',
  h1a: 'Take Your Business to the',
  h1b: 'Next Level.',
  sub: 'For a limited time, get our most popular <b>Business Plan</b> with <b>25% OFF</b>. Unlimited AI, 1 Workspace and up to 3 users — everything you need to grow faster.',
  cardPlan: 'Business Plan',
  cardOffer: 'Special Offer',
  ribbonPct: '25%',
  ribbonOff: 'OFF',
  per: '/month',
  was: '$347/month',
  save: 'You save $90 every month',
  feats: ['Unlimited AI', 'Up to 3 Users', '1 Workspace Included', 'Full Platform Access'],
  cta: 'Claim Your $257 Offer',
  secure: 'Secure checkout • Cancel anytime',
  bandTitleA: 'Let Cortexa Work 24/7',
  bandTitleB: 'So You Can Focus on Growth',
  bandBody:
    'Our AI Agent answers calls, chats and messages instantly, qualifies leads, books appointments on your calendar and updates your pipeline automatically.',
  bandStrong: 'No missed opportunities. No manual follow-up. Just results.',
  flow: ['AI Agent Answers & Qualifies', 'Books Appointments', 'Updates Your Pipeline'],
  gridTitleA: 'Everything You Need.',
  gridTitleB: 'All in One OS.',
  gridSub:
    'Cortexa brings your leads, customers, team and automation together — so you can focus on what matters most: growing your business.',
  features: [
    { t: 'AI Agent 24/7', d: 'Answers calls, chats and messages instantly, qualifies leads and books appointments while you focus on growth.' },
    { t: 'WhatsApp Automation', d: 'Engage leads and customers on autopilot. Follow up, nurture and close more through WhatsApp.' },
    { t: 'Smart CRM & Pipeline', d: 'Visual pipelines, automated follow-ups and deal tracking make it easy to manage every opportunity and close more deals.' },
    { t: 'Powerful Analytics', d: "Real-time dashboards and reports show you what's working so you can make data-driven decisions that increase revenue." },
    { t: 'Team Workspace', d: 'Collaborate with your team, assign tasks, share files and keep projects moving in one central workspace.' },
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
  footNote: 'If you no longer wish to receive these emails, you can',
  unsub: 'unsubscribe',
  rights: '© 2026 Cortexa OS. All rights reserved.',
};

const ES: PromoCopy = {
  subject: 'Tu plan más popular, 25% de descuento — Negocios por $257/mes',
  preheader: '25% de descuento por tiempo limitado en el plan Negocios: IA ilimitada, 1 workspace, hasta 3 usuarios.',
  dashImg: DASH_ES,
  topbar: 'Oferta por tiempo limitado para miembros registrados de Cortexa.',
  viewInBrowser: 'Ver en el navegador',
  badge: 'Oferta por tiempo limitado',
  h1a: 'Lleva tu negocio al',
  h1b: 'siguiente nivel.',
  sub: 'Por tiempo limitado, obtén nuestro plan más popular <b>Negocios</b> con <b>25% DE DESCUENTO</b>. IA ilimitada, 1 Workspace y hasta 3 usuarios — todo lo que necesitas para crecer más rápido.',
  cardPlan: 'Plan Negocios',
  cardOffer: 'Oferta Especial',
  ribbonPct: '25%',
  ribbonOff: 'DE DESCUENTO',
  per: '/mes',
  was: '$347/mes',
  save: 'Ahorras $90 cada mes',
  feats: ['IA ilimitada', 'Hasta 3 usuarios', '1 Workspace incluido', 'Acceso completo a la plataforma'],
  cta: 'Obtener mi plan por $257',
  secure: 'Pago seguro • Cancela cuando quieras',
  bandTitleA: 'Deja que la IA trabaje 24/7 para ti',
  bandTitleB: '',
  bandBody:
    'Nuestro AI Agent responde llamadas, chats y mensajes al instante, califica leads, agenda citas en tu calendario y actualiza tu pipeline automáticamente.',
  bandStrong: 'Sin oportunidades perdidas. Sin seguimiento manual. Solo resultados.',
  flow: ['AI Agent responde y califica', 'Agenda citas', 'Actualiza tu pipeline'],
  gridTitleA: 'Todo lo que necesitas.',
  gridTitleB: 'Todo en un solo OS.',
  gridSub:
    'Cortexa reúne tus leads, clientes, equipo y automatizaciones en una sola plataforma para que puedas enfocarte en lo que realmente importa: hacer crecer tu negocio.',
  features: [
    { t: 'AI Agent 24/7', d: 'Responde llamadas, chats y mensajes al instante, califica leads, agenda citas y nunca deja escapar una oportunidad.' },
    { t: 'Automatización WhatsApp', d: 'Comunícate, da seguimiento y nutre a tus clientes automáticamente con WhatsApp.' },
    { t: 'CRM Inteligente y Pipeline', d: 'Visualiza tu pipeline, automatiza seguimientos y rastrea cada oportunidad para cerrar más negocios.' },
    { t: 'Analíticas Poderosas', d: 'Dashboards en tiempo real que te muestran qué funciona para tomar decisiones basadas en datos y aumentar tus ingresos.' },
    { t: 'Team Workspace', d: 'Colabora con tu equipo, asigna tareas, comparte archivos y mantén todos los proyectos organizados en un solo lugar.' },
    { t: 'Hecho para tu Negocio', d: 'Cada negocio es diferente. Te ayudamos a configurar Cortexa para que se adapte a tu forma de trabajar.' },
  ],
  ctaBandTag: 'Oferta por tiempo limitado',
  ctaBandTitle: 'Obtén 25% de descuento en nuestro plan Negocios.',
  ctaBandBody: 'IA ilimitada + 1 Workspace + hasta 3 usuarios por solo $257/mes.',
  ctaBandBtn: 'Obtener 25% de descuento',
  helpTitle: '¿Tienes preguntas?',
  helpBody: 'Nuestro equipo está aquí para ayudarte a sacar el máximo provecho de Cortexa. Solo responde a este correo y con gusto te asistiremos.',
  footTag: 'Una plataforma todo en uno. Posibilidades infinitas.',
  footReason: 'Recibiste este correo porque eres un miembro registrado de Cortexa.',
  footNote: 'Si ya no deseas recibir estos correos, puedes',
  unsub: 'cancelar la suscripción',
  rights: '© 2026 Cortexa OS. Todos los derechos reservados.',
};

const PT: PromoCopy = {
  subject: 'Seu plano mais popular, 25% de desconto — Business por $257/mês',
  preheader: '25% de desconto por tempo limitado no plano Business: IA ilimitada, 1 workspace, até 3 usuários.',
  dashImg: DASH_EN,
  topbar: 'Oferta por tempo limitado para membros registrados da Cortexa.',
  viewInBrowser: 'Ver no navegador',
  badge: 'Oferta por tempo limitado',
  h1a: 'Leve o seu negócio ao',
  h1b: 'próximo nível.',
  sub: 'Por tempo limitado, garanta o nosso plano mais popular <b>Business</b> com <b>25% DE DESCONTO</b>. IA ilimitada, 1 Workspace e até 3 usuários — tudo o que você precisa para crescer mais rápido.',
  cardPlan: 'Plano Business',
  cardOffer: 'Oferta Especial',
  ribbonPct: '25%',
  ribbonOff: 'OFF',
  per: '/mês',
  was: '$347/mês',
  save: 'Você economiza $90 por mês',
  feats: ['IA ilimitada', 'Até 3 usuários', '1 Workspace incluído', 'Acesso completo à plataforma'],
  cta: 'Garantir meu plano por $257',
  secure: 'Pagamento seguro • Cancele quando quiser',
  bandTitleA: 'Deixe a IA trabalhar 24/7',
  bandTitleB: 'para você focar no crescimento',
  bandBody:
    'Nosso AI Agent responde ligações, chats e mensagens na hora, qualifica leads, agenda compromissos no seu calendário e atualiza seu pipeline automaticamente.',
  bandStrong: 'Sem oportunidades perdidas. Sem follow-up manual. Só resultados.',
  flow: ['O AI Agent responde e qualifica', 'Agenda compromissos', 'Atualiza seu pipeline'],
  gridTitleA: 'Tudo o que você precisa.',
  gridTitleB: 'Tudo em um só OS.',
  gridSub:
    'A Cortexa reúne seus leads, clientes, equipe e automações em uma só plataforma — para você focar no que mais importa: fazer o seu negócio crescer.',
  features: [
    { t: 'AI Agent 24/7', d: 'Responde ligações, chats e mensagens na hora, qualifica leads e agenda compromissos enquanto você foca no crescimento.' },
    { t: 'Automação WhatsApp', d: 'Interaja com leads e clientes no piloto automático. Faça follow-up, nutra e feche mais pelo WhatsApp.' },
    { t: 'CRM Inteligente e Pipeline', d: 'Pipelines visuais, follow-ups automáticos e acompanhamento de negócios para gerir cada oportunidade e fechar mais.' },
    { t: 'Análises Poderosas', d: 'Dashboards e relatórios em tempo real mostram o que está funcionando para decisões baseadas em dados que aumentam a receita.' },
    { t: 'Team Workspace', d: 'Colabore com sua equipe, atribua tarefas, compartilhe arquivos e mantenha os projetos avançando em um só lugar.' },
    { t: 'Feito para o seu Negócio', d: 'Cada negócio é diferente. Ajudamos a configurar a Cortexa para o seu jeito de trabalhar e seus objetivos.' },
  ],
  ctaBandTag: 'Oferta por tempo limitado',
  ctaBandTitle: 'Ganhe 25% de desconto no nosso plano Business.',
  ctaBandBody: 'IA ilimitada + 1 Workspace + até 3 usuários por apenas $257/mês.',
  ctaBandBtn: 'Quero meu desconto de 25%',
  helpTitle: 'Precisa de ajuda para decidir?',
  helpBody: 'Nossa equipe está aqui para ajudar você a aproveitar o máximo da Cortexa. Basta responder a este e-mail — teremos prazer em ajudar.',
  footTag: 'Plataforma tudo em um. Possibilidades infinitas.',
  footReason: 'Você recebeu este e-mail porque é um membro registrado da Cortexa.',
  footNote: 'Se não quiser mais receber estes e-mails, você pode',
  unsub: 'cancelar a inscrição',
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
