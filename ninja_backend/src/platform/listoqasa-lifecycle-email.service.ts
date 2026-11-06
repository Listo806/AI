import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/** ListoQasa-only transactional email. Does not read or modify Cortexa's mail configuration. */
@Injectable()
export class ListoqasaLifecycleEmailService {
  private readonly logger = new Logger(ListoqasaLifecycleEmailService.name);
  constructor(private readonly db: DatabaseService) {}

  private async schema() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS listoqasa_email_events (
      enrollment_id uuid NOT NULL REFERENCES marketplace_plan_enrollments(id),
      event_type text NOT NULL, status text NOT NULL DEFAULT 'claimed',
      claimed_at timestamptz NOT NULL DEFAULT NOW(), sent_at timestamptz,
      error text, provider_message_id text,
      PRIMARY KEY (enrollment_id,event_type)
    )`);
  }

  async send(enrollmentId: string, kind: 'welcome'|'bank_instructions'|'receipt_received'|'activated'): Promise<void> {
    if (process.env.LISTOQASA_EMAIL_ENABLED !== 'true') return;
    await this.schema();
    // Reuse the existing Render SendGrid credentials unless ListoQasa-specific overrides are supplied.
    // Keep the ListoQasa feature flag and branded message content independent of Cortexa.
    const key = (process.env.LISTOQASA_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY)?.trim();
    const from = (process.env.LISTOQASA_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL)?.trim();
    if (!key || !from) { this.logger.warn('ListoQasa SendGrid sender is not configured'); return; }
    const claim = await this.db.query(`INSERT INTO listoqasa_email_events(enrollment_id,event_type)
      SELECT e.id,$2 FROM marketplace_plan_enrollments e WHERE e.id=$1
      AND ($2 <> 'activated' OR e.status='active')
      AND ($2 <> 'bank_instructions' OR (e.status='pending_payment' AND e.payment_reference LIKE 'LQB-%'))
      AND ($2 <> 'receipt_received' OR EXISTS (SELECT 1 FROM marketplace_bank_transfer_requests r WHERE r.enrollment_id=e.id))
      ON CONFLICT DO NOTHING RETURNING enrollment_id`,[enrollmentId,kind]);
    if (!claim.rowCount) return;
    try {
      const result = await this.db.query(`SELECT e.id,e.plan_key,e.price_cents,e.currency,e.status,e.payment_reference,
        u.name,u.email,u.preferred_language FROM marketplace_plan_enrollments e JOIN users u ON u.id=e.user_id WHERE e.id=$1`,[enrollmentId]);
      const e = result.rows[0];
      if (!e?.email) throw new Error('Customer email missing');
      const language = String(e.preferred_language || '').toLowerCase().split(/[-_]/)[0];
      const lang = ['es','pt'].includes(language) ? language : 'en';
      const labels: Record<string,Record<string,string>> = {
        en:{welcome:'Welcome to ListoQasa',bank_instructions:'Your ListoQasa bank transfer instructions',receipt_received:'We received your bank transfer confirmation',activated:'Your ListoQasa plan is active'},
        es:{welcome:'Bienvenido a ListoQasa',bank_instructions:'Instrucciones de transferencia de ListoQasa',receipt_received:'Recibimos tu comprobante de transferencia',activated:'Tu plan de ListoQasa está activo'},
        pt:{welcome:'Boas-vindas ao ListoQasa',bank_instructions:'Instruções de transferência do ListoQasa',receipt_received:'Recebemos seu comprovante de transferência',activated:'Seu plano ListoQasa está ativo'},
      };
      const esc=(v:unknown)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const bank = {
        name:process.env.MARKETPLACE_BANK_NAME,
        holder:process.env.MARKETPLACE_BANK_ACCOUNT_HOLDER,
        number:process.env.MARKETPLACE_BANK_ACCOUNT_NUMBER,
        type:process.env.MARKETPLACE_BANK_ACCOUNT_TYPE,
      };
      const plan = esc(e.plan_key.replace(/-/g,' '));
      const localePath = lang === 'es' ? '/es-ec' : lang === 'pt' ? '/pt' : '/en';
      const account = `https://listoqasa.com${localePath}/marketplace/account`;
      const listings = `https://listoqasa.com${localePath}/my-listings`;
      const content: Record<string,Record<string,string>> = {
        en:{welcome:`Your account is ready. Your selected plan is <b>${plan}</b>. Sign in to manage your listings and get started.`,bank_instructions:`Pay USD ${(e.price_cents/100).toFixed(2)} using the verified bank details below. Reference: <b>${esc(e.payment_reference)}</b>. Your plan activates only after we verify payment.`,receipt_received:'We received your transfer confirmation. Payment verification is pending. We will email you when your plan is active.',activated:`Payment approved. Your <b>${plan}</b> plan is active. You can now publish your listings.`},
        es:{welcome:`Tu cuenta está lista. Tu plan seleccionado es <b>${plan}</b>. Ingresa para administrar tus anuncios y comenzar.`,bank_instructions:`Transfiere USD ${(e.price_cents/100).toFixed(2)} usando los datos bancarios verificados. Referencia: <b>${esc(e.payment_reference)}</b>. Tu plan se activará después de verificar el pago.`,receipt_received:'Recibimos tu comprobante de transferencia. La verificación del pago está pendiente. Te avisaremos cuando se active tu plan.',activated:`Pago aprobado. Tu plan <b>${plan}</b> está activo. Ya puedes publicar tus anuncios.`},
        pt:{welcome:`Sua conta está pronta. Seu plano selecionado é <b>${plan}</b>. Entre para gerenciar seus anúncios e começar.`,bank_instructions:`Transfira USD ${(e.price_cents/100).toFixed(2)} usando os dados bancários verificados. Referência: <b>${esc(e.payment_reference)}</b>. Seu plano será ativado após a verificação do pagamento.`,receipt_received:'Recebemos seu comprovante de transferência. A verificação está pendente. Avisaremos quando seu plano estiver ativo.',activated:`Pagamento aprovado. Seu plano <b>${plan}</b> está ativo. Agora você pode publicar seus anúncios.`},
      };
      if (kind==='bank_instructions' && Object.values(bank).some(v=>!v)) throw new Error('Verified bank details missing');
      const bankBlock = kind==='bank_instructions' ? `<p>${esc(bank.name)} · ${esc(bank.type)}<br/>${esc(bank.holder)}<br/>${esc(bank.number)}</p>` : '';
      const href=kind==='activated'?listings:account;
      const button=kind==='activated'?(lang==='es'?'Ir a Mis anuncios':lang==='pt'?'Ver meus anúncios':'Go to My Listings'):(lang==='es'?'Ir a mi cuenta':lang==='pt'?'Ir para minha conta':'Go to my account');
      const html=`<!doctype html><html><body style="margin:0;padding:28px;background:#e9f3ff;font-family:Arial,sans-serif;color:#09183b"><div style="max-width:620px;margin:auto;background:white;border-radius:16px;padding:32px"><h2 style="color:#075af4">ListoQasa Marketplace</h2><h1>${esc(labels[lang][kind])}</h1><p>${lang==='es'?'Hola':lang==='pt'?'Olá':'Hi'} ${esc(e.name||'')},</p><p>${content[lang][kind]}</p>${bankBlock}<p><a href="${href}" style="display:inline-block;padding:14px 24px;border-radius:9px;background:#075af4;color:white;text-decoration:none">${button} →</a></p><hr/><p style="font-size:13px">ListoQasa · ${esc(process.env.LISTOQASA_SUPPORT_EMAIL || from)}</p></div></body></html>`;
      // Optional customer-approved SendGrid Dynamic Templates. Configure only after approval.
      const templateVar: Record<typeof kind,string> = {
        welcome:'LISTOQASA_TEMPLATE_WELCOME', bank_instructions:'LISTOQASA_TEMPLATE_BANK_INSTRUCTIONS',
        receipt_received:'LISTOQASA_TEMPLATE_RECEIPT_RECEIVED', activated:'LISTOQASA_TEMPLATE_ACTIVATED',
      };
      const templateId = process.env[`${templateVar[kind]}_${lang.toUpperCase()}`]?.trim()
        || process.env[templateVar[kind]]?.trim();
      const message: Record<string,unknown> = {
        personalizations:[{to:[{email:e.email}],custom_args:{listoqasa_enrollment_id:enrollmentId,listoqasa_event:kind},
          ...(templateId ? {dynamic_template_data:{name:e.name||'',language:lang,plan:e.plan_key,
            amount:(Number(e.price_cents)/100).toFixed(2),currency:e.currency||'USD',
            payment_reference:e.payment_reference||'',bank_name:bank.name||'',
            bank_account_holder:bank.holder||'',bank_account_number:bank.number||'',
            bank_account_type:bank.type||'',account_url:account,my_listings_url:listings,
            support_email:process.env.LISTOQASA_SUPPORT_EMAIL||''}} : {})}],
        from:{email:from,name:'ListoQasa'},
        ...(process.env.LISTOQASA_SUPPORT_EMAIL ? {reply_to:{email:process.env.LISTOQASA_SUPPORT_EMAIL}} : {}),
        ...(templateId ? {template_id:templateId} : {subject:labels[lang][kind],content:[{type:'text/html',value:html}]}),
      };
      const response=await fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(message)});
      if(!response.ok) throw new Error(`SendGrid ${response.status}: ${(await response.text()).slice(0,200)}`);
      await this.db.query(`UPDATE listoqasa_email_events SET status='sent',sent_at=NOW(),provider_message_id=$3 WHERE enrollment_id=$1 AND event_type=$2`,[enrollmentId,kind,response.headers.get('x-message-id')]);
    } catch (error) {
      // Do not blindly retry an uncertain send: SendGrid may have accepted it.
      await this.db.query(`UPDATE listoqasa_email_events SET status='needs_review',error=$3 WHERE enrollment_id=$1 AND event_type=$2`,[enrollmentId,kind,String(error).slice(0,500)]);
      this.logger.warn(`ListoQasa email ${kind} needs review for ${enrollmentId}: ${String(error)}`);
    }
  }
}
