import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PropertyStatus, PropertyOrigin } from '../properties/entities/property.entity';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';
import { MarketplacePlansService } from './marketplace-plans.service';
import { UserRole } from '../users/entities/user.entity';

/**
 * Platform listings: Agent/Owner submit without CRM.
 * Listings default to PENDING_REVIEW.
 */
@Injectable()
export class PlatformListingsService {
  constructor(private readonly db: DatabaseService, private readonly marketplacePlans: MarketplacePlansService) {}

  /** Serialize listing activations for each owner so concurrent requests cannot
   * both consume the same last available listing slot. The entitlement is checked
   * inside the same transaction as the insert/update. */
  private async withListingSlot<T>(userId: string, work: (client: any) => Promise<T>): Promise<T> {
    return this.db.transaction(async client => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`platform-listings:${userId}`]);
      const state = await this.marketplacePlans.requireEntitlement(userId);
      if (state.maxListings !== null) {
        const result = await client.query(`SELECT COUNT(*)::int AS total FROM properties
          WHERE created_by=$1 AND origin='platform' AND status NOT IN ('draft','rejected','deleted','archived')`, [userId]);
        if (Number(result.rows[0]?.total || 0) >= state.maxListings)
          throw new BadRequestException(`Your plan permits ${state.maxListings} active listings. Upgrade or archive an existing listing.`);
      }
      return work(client);
    });
  }

  async create(dto: CreatePropertyDto, userId: string, teamId: string | null): Promise<any> {
    const status = PropertyStatus.PENDING_REVIEW;
    const origin = PropertyOrigin.PLATFORM;

    return this.withListingSlot(userId, async client => {
    const { rows } = await client.query(
      `INSERT INTO properties (
        title, description, address, city, state, zip_code, price, type, status, origin,
        bedrooms, bathrooms, square_feet, lot_size, year_built, created_by, team_id,
        latitude, longitude, created_at, updated_at, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW(), NULL)
      RETURNING id, title, description, address, city, state, zip_code as "zipCode", price, type, status, origin,
                bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                created_by as "createdBy", team_id as "teamId", latitude, longitude,
                created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"`,
      [
        dto.title,
        dto.description || null,
        dto.address || null,
        dto.city || null,
        dto.state || null,
        dto.zipCode || null,
        dto.price || null,
        dto.type,
        status,
        origin,
        dto.bedrooms || null,
        dto.bathrooms || null,
        dto.squareFeet || null,
        dto.lotSize || null,
        dto.yearBuilt || null,
        userId,
        teamId,
        dto.latitude || null,
        dto.longitude || null,
      ],
    );

    return rows[0];
    });
  }

  async createDraft(dto: CreatePropertyDto, userId: string, teamId: string | null) {
    const { rows } = await this.db.query(`INSERT INTO properties
      (title, description, address, city, state, price, type, status, origin, bedrooms, bathrooms, square_feet, created_by, team_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'draft','platform',$8,$9,$10,$11,$12,NOW(),NOW()) RETURNING *`,
      [dto.title || 'Untitled draft',dto.description || null,dto.address || null,dto.city || null,dto.state || null,dto.price ?? null,dto.type || 'sale',dto.bedrooms ?? null,dto.bathrooms ?? null,dto.squareFeet ?? null,userId,teamId]);
    return rows[0];
  }

  private async ownedDraft(id: string, userId: string) {
    const { rows } = await this.db.query(`SELECT * FROM properties WHERE id=$1 AND created_by=$2 AND origin='platform' AND status='draft'`,[id,userId]);
    if (!rows.length) throw new NotFoundException('Draft not found or not editable');
    return rows[0];
  }

  async updateDraft(id: string, dto: CreatePropertyDto, userId: string) {
    await this.ownedDraft(id,userId);
    const {rows}=await this.db.query(`UPDATE properties SET title=$3,description=$4,address=$5,city=$6,state=$7,price=$8,type=$9,bedrooms=$10,bathrooms=$11,square_feet=$12,updated_at=NOW()
      WHERE id=$1 AND created_by=$2 AND status='draft' RETURNING *`,
      [id,userId,dto.title || 'Untitled draft',dto.description || null,dto.address || null,dto.city || null,dto.state || null,dto.price ?? null,dto.type || 'sale',dto.bedrooms ?? null,dto.bathrooms ?? null,dto.squareFeet ?? null]);
    if (!rows.length) throw new NotFoundException('Draft no longer editable');
    return rows[0];
  }

  async addDraftMedia(id: string, userId: string, fileId: string) {
    await this.ownedDraft(id,userId);
    // Only attach files uploaded by this user, in this listing's folder.
    const stored = await this.db.query(`SELECT url, mime_type FROM stored_files WHERE id=$1 AND user_id=$2 AND folder=$3`,[fileId,userId,`marketplace/listings/${id}`]);
    if (!stored.rows.length) throw new BadRequestException('Uploaded file not found for this listing');
    const {url,mime_type}=stored.rows[0];
    if (!['image/jpeg','image/png','image/webp'].includes(mime_type)) throw new BadRequestException('Unsupported image type');
    const existing=await this.db.query(`SELECT * FROM property_media WHERE property_id=$1 AND url=$2 LIMIT 1`,[id,url]);
    if(existing.rows.length)return existing.rows[0];
    const {rows}=await this.db.query(`INSERT INTO property_media (property_id,url,type,is_primary,display_order,created_at)
      VALUES ($1,$2,'image',NOT EXISTS(SELECT 1 FROM property_media WHERE property_id=$1),
      (SELECT COUNT(*) FROM property_media WHERE property_id=$1),NOW()) RETURNING *`,[id,url]);
    return rows[0];
  }

  async submitDraft(id: string,userId: string) {
    return this.withListingSlot(userId, async client => {
    const draftResult=await client.query(`SELECT * FROM properties WHERE id=$1 AND created_by=$2 AND origin='platform' AND status='draft' FOR UPDATE`,[id,userId]);
    if(!draftResult.rows.length) throw new NotFoundException('Draft not found or not editable');
    const draft=draftResult.rows[0];
    if (!draft.title || draft.title==='Untitled draft' || !draft.description || !draft.address || !draft.city || !draft.price || Number(draft.price)<=0)
      throw new BadRequestException('Complete title, description, address, city and price before submission');
    const media=await client.query(`SELECT COUNT(*)::int AS count FROM property_media WHERE property_id=$1 AND type='image'`,[id]);
    if (!media.rows[0]?.count) throw new BadRequestException('Upload at least one image before submission');
    // Do not silently grant publishing entitlements here: subscription enforcement must be wired to the checkout entitlement service.
    const {rows}=await client.query(`UPDATE properties SET status='pending_review',updated_at=NOW() WHERE id=$1 AND created_by=$2 AND status='draft' RETURNING *`,[id,userId]);
    if (!rows.length) throw new NotFoundException('Draft no longer editable');
    return rows[0];
    });
  }

  async findMine(userId: string, teamId: string | null, role: string): Promise<any[]> {
    let conditions: string;
    const params: any[] = [userId];
    if (teamId && (role === UserRole.AGENT || role === UserRole.OWNER)) {
      conditions = `(created_by = $1 OR team_id = $2) AND origin = 'platform'`;
      params.push(teamId);
    } else {
      conditions = `created_by = $1 AND origin = 'platform'`;
    }

    const { rows } = await this.db.query(
      `SELECT id, title, description, address, city, state, zip_code as "zipCode", price, type, status, origin,
              bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
              created_by as "createdBy", team_id as "teamId", reviewed_by as "reviewedBy", reviewed_at as "reviewedAt",
              rejection_reason as "rejectionReason", created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
       FROM properties
       WHERE ${conditions}
       ORDER BY created_at DESC`,
      params,
    );
    return rows;
  }
  async dashboard(userId: string) {
    const listings = await this.findMine(userId, null, '');
    const ids = listings.map(x => x.id);
    let views: number | null = null;
    let byProperty: Record<string, number> = {};
    // buyer_property_views measures identified buyer activity, not all anonymous page views.
    // Report it separately rather than mislabeling it as total page views.
    if (ids.length) {
      const rows = await this.db.query(`SELECT property_id, SUM(view_count)::int AS count
        FROM buyer_property_views WHERE property_id = ANY($1::uuid[]) GROUP BY property_id`, [ids]);
      byProperty = Object.fromEntries(rows.rows.map(r => [r.property_id, Number(r.count)]));
      views = rows.rows.reduce((n,r) => n + Number(r.count), 0);
    } else views = 0;
    return { data: listings, metrics: {
      activeListings: listings.filter(x => ['published','approved'].includes(x.status)).length,
      identifiedBuyerViews: views, viewsByProperty: byProperty,
      // No verified inquiry/contact-click event source in this backend yet.
      inquiriesReceived: null, contactClicks: null,
    }, recentInquiries: null, publicListingsUrl: null };
  }

  async action(id: string, userId: string, action: string) {
    const transitions: Record<string, {from: string[]; to: string}> = {
      pause: {from:['published','approved'],to:'paused'},
      reactivate: {from:['paused'],to:'pending_review'},
      sold: {from:['published','approved'],to:'sold'},
      rented: {from:['published','approved'],to:'rented'},
      delete: {from:['draft','pending_review','rejected','paused','published','approved','sold','rented'],to:'archived'},
    };
    const transition = transitions[action];
    if (!transition) throw new BadRequestException('Unsupported listing action');
    if (action === 'reactivate') return this.withListingSlot(userId, async client => {
      const result = await client.query(`UPDATE properties SET status='pending_review',updated_at=NOW() WHERE id=$1 AND created_by=$2 AND origin='platform' AND status='paused' RETURNING id,status,title,type`,[id,userId]);
      if (!result.rows.length) throw new BadRequestException('Listing not found or not paused');
      return result.rows[0];
    });
    const {rows} = await this.db.query(`UPDATE properties SET status=$3,updated_at=NOW()
      WHERE id=$1 AND created_by=$2 AND origin='platform' AND status = ANY($4::text[])
      RETURNING id,status,title,type`, [id,userId,transition.to,transition.from]);
    if (!rows.length) throw new BadRequestException('Listing not found, not owned by you, or action not allowed for its current status');
    return rows[0];
  }

}
