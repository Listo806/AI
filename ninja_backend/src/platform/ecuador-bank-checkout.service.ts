import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MarketplacePlansService } from './marketplace-plans.service';

const AMOUNTS: Record<string, number> = { solo: 12700, business: 29700, scale: 49700 };
@Injectable()
export class EcuadorBankCheckoutService {
  constructor(private readonly db: DatabaseService, private readonly marketplace: MarketplacePlansService) {}
  private async schema() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS cortexa_ec_bank_transfers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
      plan_key text NOT NULL, amount_cents integer NOT NULL, currency text NOT NULL DEFAULT 'USD',
      reference text NOT NULL UNIQUE, bank_transaction_reference text, status text NOT NULL DEFAULT 'awaiting_transfer'
      CHECK(status IN ('awaiting_transfer','pending_review','verified','rejected')),
      reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz, review_note text,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await this.db.query(`CREATE UNIQUE INDEX IF NOT EXISTS cortexa_ec_bank_pending_unique
      ON cortexa_ec_bank_transfers(user_id,plan_key) WHERE status IN ('awaiting_transfer','pending_review')`);
  }
  bankDetails() { return this.marketplace.bankDetails(); }
  async create(userId:string, planKey:string) {
    const plan = String(planKey||'').toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(AMOUNTS,plan)) throw new BadRequestException('Invalid plan');
    if (!this.bankDetails().configured) throw new ServiceUnavailableException('Bank details not configured');
    await this.schema();
    const existing = await this.db.query(`SELECT id,reference,status,amount_cents FROM cortexa_ec_bank_transfers
      WHERE user_id=$1 AND plan_key=$2 AND status IN ('awaiting_transfer','pending_review') ORDER BY created_at DESC LIMIT 1`,[userId,plan]);
    if (existing.rows.length) return this.format(existing.rows[0]);
    const row = await this.db.query(`INSERT INTO cortexa_ec_bank_transfers(user_id,plan_key,amount_cents,reference)
      VALUES($1,$2,$3,'CX-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)))
      ON CONFLICT DO NOTHING RETURNING id,reference,status,amount_cents`,[userId,plan,AMOUNTS[plan]]);
    if(row.rows.length) return this.format(row.rows[0]);
    const retry=await this.db.query(`SELECT id,reference,status,amount_cents FROM cortexa_ec_bank_transfers WHERE user_id=$1 AND plan_key=$2 AND status IN ('awaiting_transfer','pending_review') LIMIT 1`,[userId,plan]);
    return this.format(retry.rows[0]);
  }
  private format(r:any) {return {id:r.id,reference:r.reference,status:r.status,amount:Number(r.amount_cents)/100,currency:'USD',requiresManualVerification:true};}
  async confirm(userId:string,id:string,transactionReference:string) {
    const ref=String(transactionReference||'').trim();
    if(ref.length<4||ref.length>120) throw new BadRequestException('Bank transaction reference must be 4–120 characters');
    await this.schema();
    const r=await this.db.query(`UPDATE cortexa_ec_bank_transfers SET bank_transaction_reference=$3,status='pending_review',updated_at=now()
      WHERE id=$1 AND user_id=$2 AND status IN ('awaiting_transfer','rejected') RETURNING id,reference,status,amount_cents`,[id,userId,ref]);
    if(!r.rows.length) throw new BadRequestException('Transfer not found or already submitted');
    return this.format(r.rows[0]);
  }
  async mine(userId:string,id:string) {await this.schema();const r=await this.db.query(`SELECT id,reference,status,amount_cents FROM cortexa_ec_bank_transfers WHERE id=$1 AND user_id=$2`,[id,userId]);if(!r.rows.length)throw new NotFoundException();return this.format(r.rows[0]);}
  async list() {await this.schema();return (await this.db.query(`SELECT t.id,t.user_id,u.email,t.plan_key,t.amount_cents,t.reference,t.bank_transaction_reference,t.status,t.created_at,t.reviewed_at
    FROM cortexa_ec_bank_transfers t JOIN users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 200`)).rows;}
  async review(id:string,adminId:string,approve:boolean,note:string) {
    await this.schema();
    // Review and access grant must commit together; concurrent admin approvals
    // serialize on the transfer row. Never create a Nuvei recurring mandate.
    return this.db.transaction(async (client) => {
      const result = await client.query(`SELECT * FROM cortexa_ec_bank_transfers WHERE id=$1 FOR UPDATE`, [id]);
      const transfer = result.rows[0];
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status === 'verified') return {id,reference:transfer.reference,status:'verified',alreadyProcessed:true,accessActivated:true};
      if (transfer.status !== 'pending_review') throw new BadRequestException('Request not pending review');
      if (!approve) {
        const rejected = await client.query(`UPDATE cortexa_ec_bank_transfers
          SET status='rejected',reviewed_by=$2,reviewed_at=NOW(),review_note=$3,updated_at=NOW()
          WHERE id=$1 RETURNING id,status,reference`,[id,adminId,String(note||'').slice(0,1000)]);
        return {...rejected.rows[0],accessActivated:false};
      }
      const expected = AMOUNTS[transfer.plan_key];
      if (!expected || expected !== Number(transfer.amount_cents) || transfer.currency !== 'USD'
          || !transfer.bank_transaction_reference) throw new BadRequestException('Payment data failed validation');
      const u = await client.query(`SELECT id,team_id FROM users WHERE id=$1 FOR UPDATE`,[transfer.user_id]);
      if (!u.rows.length) throw new NotFoundException('Customer not found');
      const team = await client.query(`SELECT id,owner_id FROM teams
        WHERE id=COALESCE($1::uuid,(SELECT id FROM teams WHERE owner_id=$2 ORDER BY created_at LIMIT 1)) FOR UPDATE`,[u.rows[0].team_id,transfer.user_id]);
      if (!team.rows.length || team.rows[0].owner_id !== transfer.user_id)
        throw new ConflictException('Customer must own a CRM team before activation');
      const teamId=team.rows[0].id;
      // Do not silently replace an existing active provider-managed subscription.
      const existing = await client.query(`SELECT id,provider,status FROM subscriptions
        WHERE team_id=$1 AND status IN ('active','trialing','past_due') FOR UPDATE`,[teamId]);
      if (existing.rows.some((r:any)=>r.provider!=='ecuador_bank'))
        throw new ConflictException('Existing active billing subscription requires manual reconciliation');
      const seats:Record<string,number>={solo:1,business:3,scale:5};
      const seatLimit=seats[transfer.plan_key];
      // Bank transfers grant one paid month only; there is no automatic renewal.
      const period = await client.query(`SELECT NOW() AS started, NOW()+INTERVAL '1 month' AS ends`);
      const start=period.rows[0].started,end=period.rows[0].ends;
      let subId:string;
      const bankSub=existing.rows.find((r:any)=>r.provider==='ecuador_bank');
      if(bankSub){
        subId=bankSub.id;
        await client.query(`UPDATE subscriptions SET status='active',seat_limit=$2,
          current_period_start=$3,current_period_end=$4,updated_at=NOW() WHERE id=$1`,[subId,seatLimit,start,end]);
      } else {
        const inserted=await client.query(`INSERT INTO subscriptions
          (team_id,provider,status,seat_limit,current_period_start,current_period_end,created_at,updated_at)
          VALUES($1,'ecuador_bank','active',$2,$3,$4,NOW(),NOW()) RETURNING id`,[teamId,seatLimit,start,end]);
        subId=inserted.rows[0].id;
      }
      await client.query(`UPDATE teams SET subscription_id=$2,seat_limit=$3,token_version=token_version+1,updated_at=NOW() WHERE id=$1`,[teamId,subId,seatLimit]);
      await client.query(`UPDATE users SET is_active=true,payment_status='active',checkout_status='paid',
        plan=$2,updated_at=NOW() WHERE id=$1`,[transfer.user_id,transfer.plan_key]);
      const reviewed=await client.query(`UPDATE cortexa_ec_bank_transfers
        SET status='verified',reviewed_by=$2,reviewed_at=NOW(),review_note=$3,updated_at=NOW()
        WHERE id=$1 RETURNING id,status,reference`,[id,adminId,String(note||'').slice(0,1000)]);
      return {...reviewed.rows[0],accessActivated:true,subscriptionId:subId,paidThrough:end,autoRenew:false};
    });
  }
}
