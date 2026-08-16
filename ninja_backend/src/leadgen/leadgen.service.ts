import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  LAUNCH_COUNTRIES,
  sourcesStatus,
  connectedByKind,
  anyConnected,
} from './leadgen-sources';
import {
  discoverBusinesses,
  findEmailForDomain,
  verifyEmail,
  scoreLead,
  dedupeKey,
  MAX_LEADS,
  NormalizedLead,
} from './leadgen-connectors';

const OWNER_ROLE = 'owner';
const NUL = String.fromCharCode(0);

/** Job lifecycle states. Terminal states: completed | ready | failed | cancelled. */
const TERMINAL = ['completed', 'ready', 'failed', 'cancelled'];
const TERMINAL_SQL = `('completed','ready','failed','cancelled')`;

/**
 * Provider dispatch tables. The pipeline iterates the CONNECTED sources of each
 * kind (in registry order) and stops at the first that returns data, so adding
 * a provider is just a new entry here — no source becomes a single point of
 * failure. Discovery providers are merged; enrichment providers fall back.
 */
const DISCOVERY_FNS: Record<string, (criteria: any) => Promise<NormalizedLead[]>> = {
  dataforseo: discoverBusinesses,
};
const ENRICH_FNS: Record<
  string,
  (lead: NormalizedLead) => Promise<{ email: string; confidence: number | null; sourceUrl: string | null } | null>
> = {
  hunter: (lead) => (lead.domain ? findEmailForDomain(lead.domain) : Promise.resolve(null)),
};

@Injectable()
export class LeadgenService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  private schemaReady = false;
  private schemaInit: Promise<void> | null = null;

  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Reconcile jobs stranded in a non-terminal state by a prior crash or deploy,
   * so KPIs and the UI never show a search stuck "in progress" forever. The
   * 15-minute floor leaves genuinely in-flight jobs on other instances alone.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.ensureSchema();
      await this.db.query(
        `UPDATE leadgen_searches
           SET status = 'failed', error = 'Interrupted by a server restart',
               completed_at = NOW(), updated_at = NOW()
         WHERE status NOT IN ${TERMINAL_SQL}
           AND updated_at < NOW() - INTERVAL '15 minutes'`,
      );
    } catch {
      /* best-effort; live requests still work once the DB is reachable */
    }
  }

  // ---------------------------------------------------------------------------
  // Schema (serialized init + cluster-wide advisory lock, per the Projects
  // pattern, so concurrent first-hits cannot race the DDL).
  // ---------------------------------------------------------------------------
  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    if (!this.schemaInit) {
      this.schemaInit = this.initSchema().then(
        () => {
          this.schemaReady = true;
        },
        (e) => {
          this.schemaInit = null;
          throw e;
        },
      );
    }
    await this.schemaInit;
  }

  private async initSchema(): Promise<void> {
    const lock = await this.db.getClient();
    try {
      await lock.query('SELECT pg_advisory_lock($1)', [792131]);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS leadgen_searches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          mode VARCHAR(16) NOT NULL DEFAULT 'advanced',
          prompt TEXT,
          criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
          status VARCHAR(24) NOT NULL DEFAULT 'created',
          status_detail TEXT,
          error TEXT,
          progress INT NOT NULL DEFAULT 0,
          sources_requested JSONB NOT NULL DEFAULT '[]'::jsonb,
          sources_used JSONB NOT NULL DEFAULT '[]'::jsonb,
          counts JSONB NOT NULL DEFAULT '{}'::jsonb,
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_leadgen_searches_team ON leadgen_searches(team_id)`,
      );
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_leadgen_searches_team_created ON leadgen_searches(team_id, created_at DESC)`,
      );

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS leadgen_leads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          search_id UUID NOT NULL REFERENCES leadgen_searches(id) ON DELETE CASCADE,
          business_name TEXT,
          contact_name TEXT,
          title TEXT,
          email TEXT,
          phone TEXT,
          website TEXT,
          address TEXT,
          city TEXT,
          region TEXT,
          country VARCHAR(4),
          social JSONB NOT NULL DEFAULT '{}'::jsonb,
          source VARCHAR(64),
          source_url TEXT,
          source_provider VARCHAR(64),
          ai_score INT,
          ai_band VARCHAR(8),
          ai_summary TEXT,
          enrichment JSONB NOT NULL DEFAULT '{}'::jsonb,
          provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
          dedupe_key TEXT,
          status VARCHAR(24) NOT NULL DEFAULT 'new',
          crm_contact_id UUID,
          crm_lead_id UUID,
          imported_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_leadgen_leads_team ON leadgen_leads(team_id)`,
      );
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_leadgen_leads_search ON leadgen_leads(search_id)`,
      );

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS leadgen_saved_searches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          name TEXT NOT NULL,
          mode VARCHAR(16) NOT NULL DEFAULT 'advanced',
          prompt TEXT,
          criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_leadgen_saved_team ON leadgen_saved_searches(team_id)`,
      );
    } finally {
      try {
        await lock.query('SELECT pg_advisory_unlock($1)', [792131]);
      } catch {
        /* ignore unlock errors */
      }
      lock.release();
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers (copied from the Projects service; NUL-strip + clamps guard against
  // Postgres text/int overflow and formula-injection seeds in lead names).
  // ---------------------------------------------------------------------------
  private sanitizeText(v: any, max: number): string | null {
    if (typeof v !== 'string') return null;
    const t = v.split(NUL).join('').trim();
    if (!t) return null;
    return t.length > max ? t.slice(0, max) : t;
  }

  private num(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private clampInt(v: any, max = 2000000000): number {
    const n = Math.round(this.num(v));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, n));
  }

  private isUuid(v: any): boolean {
    return typeof v === 'string' && LeadgenService.UUID_RE.test(v);
  }

  /** Recursively strip NUL from strings, cap depth/size, then it is safe as jsonb. */
  private sanitizeJson(v: any, depth = 0): any {
    if (depth > 6) return null;
    if (typeof v === 'string') return v.split(NUL).join('').slice(0, 4000);
    if (typeof v === 'number' || typeof v === 'boolean' || v === null) return v;
    if (Array.isArray(v)) return v.slice(0, 200).map((x) => this.sanitizeJson(x, depth + 1));
    if (typeof v === 'object') {
      const out: any = {};
      let n = 0;
      for (const k of Object.keys(v)) {
        if (n >= 100) break;
        out[String(k).slice(0, 120)] = this.sanitizeJson(v[k], depth + 1);
        n += 1;
      }
      return out;
    }
    return null;
  }

  private normalizeCountries(input: any): string[] {
    let list: string[] = [];
    if (Array.isArray(input)) list = input.map((x) => String(x));
    else if (typeof input === 'string') list = input.split(',');
    const upper = list.map((c) => c.trim().toUpperCase()).filter(Boolean);
    // Accept 'UK' as an alias for the ISO 'GB'.
    const mapped = upper.map((c) => (c === 'UK' ? 'GB' : c));
    const allowed = mapped.filter((c) => LAUNCH_COUNTRIES.includes(c));
    // De-dupe while preserving order.
    const seen = new Set<string>();
    const result: string[] = [];
    for (const c of allowed) {
      if (!seen.has(c)) {
        seen.add(c);
        result.push(c);
      }
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Tenant isolation (private, per the Projects pattern).
  // ---------------------------------------------------------------------------
  private async getAccessibleTeamIds(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<string[]> {
    if (role === OWNER_ROLE) {
      const { rows } = await this.db.query(
        `SELECT t.id FROM teams t
          WHERE t.owner_id = $1
             OR t.id = (SELECT team_id FROM users WHERE id = $1 AND team_id IS NOT NULL LIMIT 1)`,
        [userId],
      );
      const ids = rows.map((r: { id: string }) => r.id);
      if (ids.length) return ids;
    }
    if (userTeamId) return [userTeamId];
    const { rows } = await this.db.query(`SELECT id FROM teams WHERE owner_id = $1`, [userId]);
    return rows.map((r: { id: string }) => r.id);
  }

  private async resolveReadTeams(user: any): Promise<string[]> {
    return this.getAccessibleTeamIds(user?.id, user?.teamId ?? null, user?.role ?? OWNER_ROLE);
  }

  private async resolveWriteTeam(user: any, dtoTeamId?: string): Promise<string> {
    const accessible = await this.getAccessibleTeamIds(
      user?.id,
      user?.teamId ?? null,
      user?.role ?? OWNER_ROLE,
    );
    if (!accessible.length) throw new ForbiddenException('You do not have access to a team');
    const candidate =
      dtoTeamId && accessible.includes(dtoTeamId)
        ? dtoTeamId
        : user?.teamId && accessible.includes(user.teamId)
          ? user.teamId
          : accessible[0];
    if (!candidate || !accessible.includes(candidate)) {
      throw new ForbiddenException('You do not have access to this team');
    }
    return candidate;
  }

  // ---------------------------------------------------------------------------
  // Context + KPIs (computed from real records; zeros when empty, never faked).
  // ---------------------------------------------------------------------------
  async getContext(user: any): Promise<any> {
    await this.ensureSchema();
    const sources = sourcesStatus();
    return {
      entitled: true, // enforcement handled by WorkspaceLockGuard; open until locked
      role: user?.role ?? OWNER_ROLE,
      launchCountries: LAUNCH_COUNTRIES,
      sources,
      discoveryConnected: anyConnected('discovery'),
      enrichmentConnected: anyConnected('enrichment'),
      verificationConnected: anyConnected('verification'),
      // Honest capability signal for the UI to render "not connected" states.
      canGenerate: anyConnected('discovery'),
      providerNotice: anyConnected('discovery')
        ? null
        : 'No data provider is connected yet. Lead generation returns no results until a discovery provider (such as DataForSEO) is configured. No sample or placeholder leads are shown.',
    };
  }

  async getOverview(user: any): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    const empty = {
      searchesTotal: 0,
      searchesActive: 0,
      leadsTotal: 0,
      leadsQualified: 0,
      leadsImported: 0,
      leadsEnriched: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      avgScore: null,
      lastRunAt: null,
    };
    if (!teams.length) return { kpis: empty, discoveryConnected: anyConnected('discovery') };

    const searchAgg = await this.db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status NOT IN ('completed','ready','failed','cancelled'))::int AS active,
         MAX(created_at) AS last_run
       FROM leadgen_searches WHERE team_id = ANY($1)`,
      [teams],
    );

    const leadAgg = await this.db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'qualified')::int AS qualified,
         COUNT(*) FILTER (WHERE status = 'imported')::int AS imported,
         COUNT(*) FILTER (WHERE email IS NOT NULL)::int AS enriched,
         COUNT(*) FILTER (WHERE ai_band = 'hot')::int AS hot,
         COUNT(*) FILTER (WHERE ai_band = 'warm')::int AS warm,
         COUNT(*) FILTER (WHERE ai_band = 'cold')::int AS cold,
         AVG(ai_score) FILTER (WHERE ai_score IS NOT NULL) AS avg_score
       FROM leadgen_leads WHERE team_id = ANY($1)`,
      [teams],
    );

    const s = searchAgg.rows[0] || {};
    const l = leadAgg.rows[0] || {};
    return {
      kpis: {
        searchesTotal: s.total || 0,
        searchesActive: s.active || 0,
        leadsTotal: l.total || 0,
        leadsQualified: l.qualified || 0,
        leadsImported: l.imported || 0,
        leadsEnriched: l.enriched || 0,
        hot: l.hot || 0,
        warm: l.warm || 0,
        cold: l.cold || 0,
        avgScore: l.avg_score !== null && l.avg_score !== undefined ? Math.round(Number(l.avg_score)) : null,
        lastRunAt: s.last_run || null,
      },
      discoveryConnected: anyConnected('discovery'),
    };
  }

  async getSources(): Promise<any> {
    return { sources: sourcesStatus(), launchCountries: LAUNCH_COUNTRIES };
  }

  // ---------------------------------------------------------------------------
  // Searches (the job engine).
  // ---------------------------------------------------------------------------
  private buildCriteria(body: any): any {
    const criteria: any = {
      keywords: this.sanitizeText(body?.keywords ?? body?.query ?? body?.industry, 300),
      industry: this.sanitizeText(body?.industry, 120),
      location: this.sanitizeText(body?.location ?? body?.city, 200),
      titles: Array.isArray(body?.titles)
        ? body.titles.map((t: any) => this.sanitizeText(t, 120)).filter(Boolean).slice(0, 20)
        : [],
      companySize: this.sanitizeText(body?.companySize, 60),
      countries: this.normalizeCountries(body?.countries),
      limit: this.clampInt(body?.limit ?? 50, 500) || 50,
    };
    if (!criteria.countries.length) criteria.countries = [...LAUNCH_COUNTRIES];
    return this.sanitizeJson(criteria);
  }

  async createSearch(user: any, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user, body?.teamId);

    const mode = body?.mode === 'ai' ? 'ai' : 'advanced';
    const prompt = this.sanitizeText(body?.prompt, 2000);
    if (mode === 'ai' && !prompt) {
      throw new BadRequestException('A search prompt is required for AI discovery.');
    }

    const criteria = this.buildCriteria(body);
    if (mode === 'advanced' && !criteria.keywords && !criteria.industry && !criteria.location) {
      throw new BadRequestException(
        'Provide at least a keyword, industry, or location to search.',
      );
    }

    // Sources actually CONNECTED (configured) at creation time — honest
    // provenance. Empty when no provider is connected yet; it never lists the
    // static catalog as if it were configured.
    const requested = (['discovery', 'enrichment', 'verification'] as const)
      .flatMap((k) => connectedByKind(k))
      .map((s) => s.key);

    const { rows } = await this.db.query(
      `INSERT INTO leadgen_searches
         (team_id, created_by, mode, prompt, criteria, status, sources_requested, started_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, 'created', $6::jsonb, NOW())
       RETURNING *`,
      [
        teamId,
        this.isUuid(user?.id) ? user.id : null,
        mode,
        prompt,
        JSON.stringify(criteria),
        JSON.stringify(requested),
      ],
    );
    const search = rows[0];

    // Kick off the async job. Fire-and-forget: the HTTP response returns the
    // 'created' record immediately and the client polls for status.
    this.runSearch(search.id, teamId).catch(() => {
      /* runSearch persists its own failure state; nothing to do here */
    });

    return this.shapeSearch(search);
  }

  /**
   * The persisted job lifecycle. Every transition is written to the row so the
   * client can poll real status. When no discovery provider is connected the
   * job finishes honestly with zero results and an explanatory note — it never
   * invents leads.
   */
  private async runSearch(searchId: string, teamId: string): Promise<void> {
    try {
      const discovery = connectedByKind('discovery');
      if (!discovery.length) {
        // Honest terminal state: nothing is fabricated when no provider is live.
        await this.setStatus(searchId, teamId, 'completed', 100, {
          detail:
            'No data provider is connected. Configure a discovery provider (DataForSEO) to generate real leads. No placeholder leads were created.',
          counts: { found: 0, deduped: 0, enriched: 0, scored: 0, qualified: 0 },
          sourcesUsed: [],
        });
        return;
      }

      const { rows } = await this.db.query(
        `SELECT criteria FROM leadgen_searches WHERE id = $1 AND team_id = $2`,
        [searchId, teamId],
      );
      const criteria = rows[0]?.criteria || {};
      const used = new Set<string>();

      // 1. DISCOVERY — iterate every connected discovery provider and merge
      // results (fallback: if one errors or is unconfigured, the next runs).
      await this.setStatus(searchId, teamId, 'searching', 15);
      let leads: NormalizedLead[] = [];
      for (const src of connectedByKind('discovery')) {
        if (leads.length >= MAX_LEADS) break;
        const fn = DISCOVERY_FNS[src.key];
        if (!fn) continue;
        try {
          const found = await fn(criteria);
          used.add(src.key);
          leads.push(...found);
        } catch {
          /* provider failed — fall through to the next discovery source */
        }
      }
      const foundCount = leads.length;
      if (await this.isCancelled(searchId, teamId)) return;

      // 2. DEDUP (within batch + against this team's prior generated leads).
      await this.setStatus(searchId, teamId, 'dedup', 40, { counts: { found: foundCount } });
      leads = leads.slice(0, MAX_LEADS);
      leads = await this.dedupeBusinesses(teamId, leads);
      const dedupedRemoved = foundCount - leads.length;
      if (await this.isCancelled(searchId, teamId)) return;

      // 3 & 4. ENRICH (email finding, provider fallback) + VERIFY (ZeroBounce).
      const enrichSources = connectedByKind('enrichment');
      const verifyOn = anyConnected('verification');
      if ((enrichSources.length || verifyOn) && leads.length) {
        await this.setStatus(searchId, teamId, 'enriching', 65);
        for (const b of leads) {
          if (!b.email && b.domain) {
            // Try each connected enrichment provider in turn; stop at first hit.
            for (const src of enrichSources) {
              const fn = ENRICH_FNS[src.key];
              if (!fn) continue;
              try {
                const found = await fn(b);
                if (found && found.email) {
                  b.email = found.email;
                  b.sourceUrl = b.sourceUrl || found.sourceUrl;
                  b.enrichment = {
                    ...b.enrichment,
                    emailConfidence: found.confidence ?? null,
                    emailProvider: src.key,
                  };
                  used.add(src.key);
                  break;
                }
              } catch {
                /* provider failed — fall through to the next enrichment source */
              }
            }
          }
          if (b.email && verifyOn) {
            const v = await verifyEmail(b.email);
            if (v) {
              b.emailVerified = v.valid;
              b.enrichment = { ...b.enrichment, verification: v.status };
              used.add('zerobounce');
            }
          }
        }
      }
      if (await this.isCancelled(searchId, teamId)) return;

      // 5 & 6. SCORE / BAND + QUALIFY (documented, computed from real signals).
      await this.setStatus(searchId, teamId, 'scoring', 85);
      let qualified = 0;
      let enrichedCount = 0;
      for (const b of leads) {
        const { score, band } = scoreLead(b);
        b.aiScore = score;
        b.aiBand = band;
        b.status = score >= 40 ? 'qualified' : 'new';
        if (b.status === 'qualified') qualified += 1;
        if (b.email) enrichedCount += 1;
      }
      if (await this.isCancelled(searchId, teamId)) return;

      // 7. PERSIST real leads.
      await this.persistLeads(searchId, teamId, leads);

      // 8. Terminal.
      await this.setStatus(searchId, teamId, 'completed', 100, {
        counts: {
          found: foundCount,
          deduped: dedupedRemoved,
          enriched: enrichedCount,
          scored: leads.length,
          qualified,
        },
        sourcesUsed: [...used],
        detail: leads.length ? null : 'No matching businesses were found for these criteria.',
      });
    } catch (e: any) {
      await this.setStatus(searchId, teamId, 'failed', null, {
        error: String(e?.message || e).slice(0, 2000),
      });
    }
  }

  private async isCancelled(searchId: string, teamId: string): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT status FROM leadgen_searches WHERE id = $1 AND team_id = $2`,
      [searchId, teamId],
    );
    return rows.length ? rows[0].status === 'cancelled' : true;
  }

  /** Drop duplicates within the batch and against this team's prior leads. */
  private async dedupeBusinesses(teamId: string, list: NormalizedLead[]): Promise<NormalizedLead[]> {
    const seen = new Set<string>();
    const unique: NormalizedLead[] = [];
    for (const b of list) {
      const k = dedupeKey(b);
      if (seen.has(k)) continue;
      seen.add(k);
      b.dedupeKey = k;
      unique.push(b);
    }
    if (!unique.length) return unique;
    const keys = unique.map((b) => b.dedupeKey as string);
    const { rows } = await this.db.query(
      `SELECT dedupe_key FROM leadgen_leads WHERE team_id = $1 AND dedupe_key = ANY($2)`,
      [teamId, keys],
    );
    const existing = new Set(rows.map((r: any) => r.dedupe_key));
    return unique.filter((b) => !existing.has(b.dedupeKey));
  }

  /** Insert generated leads (real data only) in a single transaction. */
  private async persistLeads(searchId: string, teamId: string, list: NormalizedLead[]): Promise<void> {
    if (!list.length) return;
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      for (const b of list) {
        await client.query(
          `INSERT INTO leadgen_leads
             (team_id, search_id, business_name, contact_name, title, email, phone, website,
              address, city, region, country, social, source, source_url, source_provider,
              ai_score, ai_band, enrichment, provenance, dedupe_key, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15,$16,$17,$18,$19::jsonb,$20::jsonb,$21,$22)`,
          [
            teamId,
            searchId,
            this.sanitizeText(b.businessName, 255),
            this.sanitizeText(b.contactName, 255),
            this.sanitizeText(b.title, 160),
            this.sanitizeText(b.email, 255),
            this.sanitizeText(b.phone, 64),
            this.sanitizeText(b.website, 500),
            this.sanitizeText(b.address, 500),
            this.sanitizeText(b.city, 160),
            this.sanitizeText(b.region, 160),
            b.country ? String(b.country).slice(0, 4) : null,
            JSON.stringify(this.sanitizeJson(b.social || {})),
            this.sanitizeText(b.source, 64),
            this.sanitizeText(b.sourceUrl, 1000),
            this.sanitizeText(b.sourceProvider, 64),
            b.aiScore == null ? null : this.clampInt(b.aiScore, 100),
            b.aiBand ? String(b.aiBand).slice(0, 8) : null,
            JSON.stringify(this.sanitizeJson(b.enrichment || {})),
            JSON.stringify({ emailVerified: !!b.emailVerified }),
            this.sanitizeText(b.dedupeKey, 255),
            b.status || 'new',
          ],
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  private async setStatus(
    searchId: string,
    teamId: string,
    status: string,
    progress: number | null,
    extra?: { detail?: string; error?: string; counts?: any; sourcesUsed?: any },
  ): Promise<void> {
    const sets = ['status = $3', 'updated_at = NOW()'];
    const vals: any[] = [searchId, teamId, status];
    let i = 4;
    if (progress !== null && progress !== undefined) {
      sets.push(`progress = $${i}`);
      vals.push(this.clampInt(progress, 100));
      i += 1;
    }
    if (extra?.detail !== undefined) {
      sets.push(`status_detail = $${i}`);
      vals.push(this.sanitizeText(extra.detail, 1000));
      i += 1;
    }
    if (extra?.error !== undefined) {
      sets.push(`error = $${i}`);
      vals.push(this.sanitizeText(extra.error, 2000));
      i += 1;
    }
    if (extra?.counts !== undefined) {
      sets.push(`counts = $${i}::jsonb`);
      vals.push(JSON.stringify(this.sanitizeJson(extra.counts)));
      i += 1;
    }
    if (extra?.sourcesUsed !== undefined) {
      sets.push(`sources_used = $${i}::jsonb`);
      vals.push(JSON.stringify(this.sanitizeJson(extra.sourcesUsed)));
      i += 1;
    }
    if (TERMINAL.includes(status)) {
      sets.push('completed_at = NOW()');
    }
    // Never resurrect a terminal job: a cancel that landed first must win over a
    // late writer from the async runner (the status guard makes this atomic).
    await this.db.query(
      `UPDATE leadgen_searches SET ${sets.join(', ')}
         WHERE id = $1 AND team_id = $2 AND status NOT IN ${TERMINAL_SQL}`,
      vals,
    );
  }

  private shapeSearch(row: any): any {
    if (!row) return null;
    return {
      id: row.id,
      mode: row.mode,
      prompt: row.prompt,
      criteria: row.criteria,
      status: row.status,
      statusDetail: row.status_detail,
      error: row.error,
      progress: row.progress,
      sourcesRequested: row.sources_requested,
      sourcesUsed: row.sources_used,
      counts: row.counts,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listSearches(user: any, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) return { data: [], total: 0, page: 1, limit: 20 };

    const page = Math.max(1, this.clampInt(query?.page, 100000) || 1);
    const limit = Math.min(100, Math.max(1, this.clampInt(query?.limit, 100) || 20));
    const offset = (page - 1) * limit;

    const conditions = ['team_id = ANY($1)'];
    const values: any[] = [teams];
    let i = 2;
    if (query?.status && query.status !== 'all') {
      conditions.push(`status = $${i}`);
      values.push(this.sanitizeText(query.status, 24));
      i += 1;
    }
    const where = conditions.join(' AND ');

    const totalRes = await this.db.query(
      `SELECT COUNT(*)::int AS c FROM leadgen_searches WHERE ${where}`,
      values,
    );
    const { rows } = await this.db.query(
      `SELECT * FROM leadgen_searches WHERE ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset],
    );

    return {
      data: rows.map((r) => this.shapeSearch(r)),
      total: totalRes.rows[0]?.c || 0,
      page,
      limit,
    };
  }

  async getSearch(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) throw new NotFoundException('Search not found');
    const { rows } = await this.db.query(
      `SELECT * FROM leadgen_searches WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, teams],
    );
    if (!rows.length) throw new NotFoundException('Search not found');
    return this.shapeSearch(rows[0]);
  }

  async cancelSearch(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    // Scope to ALL accessible teams (matching the read paths) so a multi-team
    // owner can cancel a search owned by any of their teams, not just the default.
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) throw new NotFoundException('Search not found');
    const { rows } = await this.db.query(
      `UPDATE leadgen_searches
         SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND team_id = ANY($2) AND status NOT IN ${TERMINAL_SQL}
       RETURNING *`,
      [id, teams],
    );
    if (!rows.length) {
      // Either not found in an accessible team, or already terminal.
      const existing = await this.db.query(
        `SELECT status FROM leadgen_searches WHERE id = $1 AND team_id = ANY($2)`,
        [id, teams],
      );
      if (!existing.rows.length) throw new NotFoundException('Search not found');
      throw new BadRequestException('Search has already finished and cannot be cancelled.');
    }
    return this.shapeSearch(rows[0]);
  }

  private shapeLead(row: any): any {
    if (!row) return null;
    return {
      id: row.id,
      searchId: row.search_id,
      businessName: row.business_name,
      contactName: row.contact_name,
      title: row.title,
      email: row.email,
      phone: row.phone,
      website: row.website,
      address: row.address,
      city: row.city,
      region: row.region,
      country: row.country,
      social: row.social,
      source: row.source,
      sourceUrl: row.source_url,
      sourceProvider: row.source_provider,
      aiScore: row.ai_score,
      aiBand: row.ai_band,
      aiSummary: row.ai_summary,
      enrichment: row.enrichment,
      provenance: row.provenance,
      status: row.status,
      crmContactId: row.crm_contact_id,
      crmLeadId: row.crm_lead_id,
      importedAt: row.imported_at,
      createdAt: row.created_at,
    };
  }

  async listLeads(user: any, searchId: string, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) return { data: [], total: 0, page: 1, limit: 25 };

    // Verify the search belongs to an accessible team first.
    const owns = await this.db.query(
      `SELECT 1 FROM leadgen_searches WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [searchId, teams],
    );
    if (!owns.rows.length) throw new NotFoundException('Search not found');

    const page = Math.max(1, this.clampInt(query?.page, 100000) || 1);
    const limit = Math.min(100, Math.max(1, this.clampInt(query?.limit, 100) || 25));
    const offset = (page - 1) * limit;

    const conditions = ['search_id = $1', 'team_id = ANY($2)'];
    const values: any[] = [searchId, teams];
    let i = 3;
    if (query?.band && query.band !== 'all') {
      conditions.push(`ai_band = $${i}`);
      values.push(this.sanitizeText(query.band, 8));
      i += 1;
    }
    if (query?.status && query.status !== 'all') {
      conditions.push(`status = $${i}`);
      values.push(this.sanitizeText(query.status, 24));
      i += 1;
    }
    const where = conditions.join(' AND ');

    const totalRes = await this.db.query(
      `SELECT COUNT(*)::int AS c FROM leadgen_leads WHERE ${where}`,
      values,
    );
    const { rows } = await this.db.query(
      `SELECT * FROM leadgen_leads WHERE ${where}
         ORDER BY ai_score DESC NULLS LAST, created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset],
    );

    return {
      data: rows.map((r) => this.shapeLead(r)),
      total: totalRes.rows[0]?.c || 0,
      page,
      limit,
    };
  }

  // ---------------------------------------------------------------------------
  // Saved searches.
  // ---------------------------------------------------------------------------
  async listSavedSearches(user: any): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) return { data: [] };
    const { rows } = await this.db.query(
      `SELECT * FROM leadgen_saved_searches WHERE team_id = ANY($1) ORDER BY created_at DESC LIMIT 200`,
      [teams],
    );
    return {
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        mode: r.mode,
        prompt: r.prompt,
        criteria: r.criteria,
        createdAt: r.created_at,
      })),
    };
  }

  async createSavedSearch(user: any, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user, body?.teamId);
    const name = this.sanitizeText(body?.name, 160);
    if (!name) throw new BadRequestException('A name is required to save a search.');
    const mode = body?.mode === 'ai' ? 'ai' : 'advanced';
    const prompt = this.sanitizeText(body?.prompt, 2000);
    const criteria = this.buildCriteria(body);
    const { rows } = await this.db.query(
      `INSERT INTO leadgen_saved_searches (team_id, created_by, name, mode, prompt, criteria)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *`,
      [teamId, this.isUuid(user?.id) ? user.id : null, name, mode, prompt, JSON.stringify(criteria)],
    );
    const r = rows[0];
    return { id: r.id, name: r.name, mode: r.mode, prompt: r.prompt, criteria: r.criteria, createdAt: r.created_at };
  }

  async deleteSavedSearch(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    // Scope to all accessible teams so multi-team owners can delete from any
    // of their teams (the id is still constrained to teams they own).
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) throw new NotFoundException('Saved search not found');
    const { rowCount } = await this.db.query(
      `DELETE FROM leadgen_saved_searches WHERE id = $1 AND team_id = ANY($2)`,
      [id, teams],
    );
    if (!rowCount) throw new NotFoundException('Saved search not found');
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // AI natural-language interpretation (rule-based for now; upgrades to the
  // central AiAssistantService in the AI-Discovery slice). It is labelled
  // truthfully so the UI never presents a rule parse as an AI inference.
  // ---------------------------------------------------------------------------
  async interpret(user: any, body: any = {}): Promise<any> {
    await this.ensureSchema();
    await this.resolveWriteTeam(user, body?.teamId); // authorize
    const prompt = this.sanitizeText(body?.prompt, 2000);
    if (!prompt) throw new BadRequestException('A prompt is required.');

    const lower = prompt.toLowerCase();
    const countryHints: Array<[RegExp, string]> = [
      [/\b(united states|u\.?s\.?a?|america)\b/, 'US'],
      [/\b(canada)\b/, 'CA'],
      [/\b(australia)\b/, 'AU'],
      [/\b(united kingdom|u\.?k\.?|england|britain)\b/, 'GB'],
      [/\b(spain|españa|espana)\b/, 'ES'],
      [/\b(mexico|méxico)\b/, 'MX'],
      [/\b(colombia)\b/, 'CO'],
      [/\b(brazil|brasil)\b/, 'BR'],
      [/\b(chile)\b/, 'CL'],
      [/\b(argentina)\b/, 'AR'],
      [/\b(ecuador)\b/, 'EC'],
    ];
    const countries: string[] = [];
    for (const [re, code] of countryHints) {
      if (re.test(lower) && !countries.includes(code)) countries.push(code);
    }

    const criteria = {
      keywords: prompt.slice(0, 300),
      industry: null,
      location: null,
      titles: [],
      companySize: null,
      countries: countries.length ? countries : [...LAUNCH_COUNTRIES],
      limit: 50,
    };

    return {
      method: 'rules',
      aiInterpreted: false,
      note: 'Interpreted from your prompt using keyword and country rules. AI-assisted interpretation activates once the AI Discovery add-on is enabled.',
      criteria: this.sanitizeJson(criteria),
    };
  }

  // ---------------------------------------------------------------------------
  // Import a reviewed lead into the existing CRM (contacts table), with
  // per-team dedupe and suppression honored. Reuses the real CRM + marketing
  // suppression tables — no duplicate systems.
  // ---------------------------------------------------------------------------
  async importLead(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    // Look the lead up across all accessible teams, then write into the lead's
    // OWN team — so a multi-team owner imports into the correct team and the
    // CRM contact is never created under the wrong tenant.
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) throw new NotFoundException('Lead not found');

    const { rows } = await this.db.query(
      `SELECT * FROM leadgen_leads WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, teams],
    );
    if (!rows.length) throw new NotFoundException('Lead not found');
    const lead = rows[0];
    const teamId: string = lead.team_id;

    if (lead.status === 'imported' && lead.crm_contact_id) {
      return { success: true, alreadyImported: true, contactId: lead.crm_contact_id };
    }

    const email = this.sanitizeText(lead.email, 255);
    const phone = this.sanitizeText(lead.phone, 64);
    const name =
      this.sanitizeText(lead.contact_name, 255) ||
      this.sanitizeText(lead.business_name, 255) ||
      'Unnamed lead';

    // Suppression gate, scoped to the team, honoring Marketing's suppression
    // list (any channel). A suppressed contact is not imported. The marketing
    // table is created lazily, so a missing table simply means no suppressions
    // exist yet — treat that as "not suppressed" rather than failing the import.
    if (email) {
      let suppressed = false;
      try {
        const sup = await this.db.query(
          `SELECT 1 FROM mkt_suppression WHERE team_id = $1 AND lower(address) = lower($2) LIMIT 1`,
          [teamId, email],
        );
        suppressed = sup.rows.length > 0;
      } catch {
        suppressed = false; // mkt_suppression not provisioned yet
      }
      if (suppressed) {
        await this.db.query(
          `UPDATE leadgen_leads SET status = 'disqualified', updated_at = NOW() WHERE id = $1 AND team_id = $2`,
          [id, teamId],
        );
        throw new BadRequestException('This contact is on the suppression list and was not imported.');
      }
    }

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Per-team dedupe against the existing CRM.
      let contactId: string | null = null;
      if (email || phone) {
        const dupe = await client.query(
          `SELECT id FROM contacts
             WHERE team_id = $1 AND (
               ($2::text IS NOT NULL AND lower(email) = lower($2)) OR
               ($3::text IS NOT NULL AND phone = $3)
             ) LIMIT 1`,
          [teamId, email, phone],
        );
        if (dupe.rows.length) contactId = dupe.rows[0].id;
      }

      let duplicate = false;
      if (contactId) {
        duplicate = true;
      } else {
        const ins = await client.query(
          `INSERT INTO contacts (team_id, created_by, name, email, phone, source, notes)
           VALUES ($1, $2, $3, $4, $5, 'lead_generator', $6)
           RETURNING id`,
          [
            teamId,
            this.isUuid(user?.id) ? user.id : null,
            name,
            email,
            phone,
            this.sanitizeText(lead.website ? `Website: ${lead.website}` : null, 1000),
          ],
        );
        contactId = ins.rows[0].id;
      }

      await client.query(
        `UPDATE leadgen_leads
           SET status = $3, crm_contact_id = $4, imported_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND team_id = $2`,
        [id, teamId, duplicate ? 'duplicate' : 'imported', contactId],
      );

      await client.query('COMMIT');
      return { success: true, duplicate, contactId };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
