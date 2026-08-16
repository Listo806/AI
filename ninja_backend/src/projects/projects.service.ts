import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const OWNER_ROLE = 'owner';
const NUL = String.fromCharCode(0);

/**
 * Projects / Client Delivery Workspace service.
 *
 * Design rule: REUSE, do not duplicate. Projects, tasks, time entries and files
 * are the SAME shared Cortexa records used by the Team Workspace
 * (`projects`, `team_tasks`, `team_time_entries`, `stored_files`). This service
 * only *extends* the `projects` table with delivery columns (client, manager,
 * budget) and adds three genuinely new tables — milestones, deliverables and
 * expenses. Clients come from the shared `contacts` table; managers/assignees
 * from `team_members` + `users`; activity from the shared `events` table.
 *
 * Tenancy boundary is the team. Reads use `team_id = ANY(accessible)`; writes
 * resolve to a single team the caller can access (same pattern as the Sales /
 * Financial / Marketing workspaces).
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly db: DatabaseService) {}

  private schemaReady = false;
  private schemaInit: Promise<void> | null = null;

  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private readonly PROJECT_STATUSES = [
    'planning',
    'in_progress',
    'in_review',
    'on_hold',
    'completed',
    'cancelled',
  ];
  private readonly TASK_STATUSES = [
    'pending',
    'in_progress',
    'review',
    'on_hold',
    'completed',
    'cancelled',
  ];
  private readonly PRIORITIES = ['low', 'medium', 'high', 'urgent'];
  private readonly MILESTONE_STATUSES = ['pending', 'in_progress', 'completed'];
  private readonly DELIVERABLE_STATUSES = [
    'pending',
    'in_review',
    'approved',
    'delivered',
    'rejected',
  ];

  /* ============================================================= *
   *  SCHEMA (lazy, idempotent)                                     *
   * ============================================================= */

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    // Serialize within this instance so concurrent requests share one init.
    if (!this.schemaInit) {
      this.schemaInit = this.initSchema().then(
        () => {
          this.schemaReady = true;
        },
        (e) => {
          this.schemaInit = null; // let a later call retry if init failed
          throw e;
        },
      );
    }
    await this.schemaInit;
  }

  // One-time DDL, serialized cluster-wide by a Postgres advisory lock so the
  // first requests on a fresh account/deploy cannot race on concurrent
  // "CREATE TABLE IF NOT EXISTS" (which Postgres can reject) and 500.
  private async initSchema(): Promise<void> {
    const lock = await this.db.getClient();
    try {
      await lock.query('SELECT pg_advisory_lock($1)', [792113]);

    // Base project workspace tables. These are the SAME tables the Team
    // Workspace uses. CREATE ... IF NOT EXISTS keeps this safe even if the Team
    // Workspace never ran; ALTER ... IF NOT EXISTS makes column adds idempotent.
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id)`);
    await this.db.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'planning',
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        ADD COLUMN IF NOT EXISTS owner_id UUID,
        ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS progress INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS code TEXT,
        ADD COLUMN IF NOT EXISTS contact_id UUID,
        ADD COLUMN IF NOT EXISTS manager_id UUID,
        ADD COLUMN IF NOT EXISTS budget NUMERIC(14,2),
        ADD COLUMN IF NOT EXISTS currency VARCHAR(8) NOT NULL DEFAULT 'USD'
    `);

    // Shared task + time tables (identical definition to the Team Workspace).
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS team_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        task_type VARCHAR(50) NOT NULL DEFAULT 'task',
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        due_date TIMESTAMPTZ,
        progress INT NOT NULL DEFAULT 0,
        estimated_minutes INT NOT NULL DEFAULT 0,
        labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT team_tasks_status_check
          CHECK (status IN ('pending','in_progress','review','on_hold','completed','cancelled')),
        CONSTRAINT team_tasks_priority_check
          CHECK (priority IN ('low','medium','high','urgent')),
        CONSTRAINT team_tasks_progress_check
          CHECK (progress >= 0 AND progress <= 100)
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_team_tasks_team ON team_tasks(team_id, updated_at DESC)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_team_tasks_project ON team_tasks(team_id, project_id)`);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS team_time_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        task_id UUID REFERENCES team_tasks(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        minutes INT NOT NULL CHECK (minutes > 0),
        note TEXT,
        started_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_team ON team_time_entries(team_id, created_at DESC)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_project ON team_time_entries(team_id, project_id)`);

    // File attachment columns (shared stored_files table). Guarded: on a DB
    // where the storage migration has not run yet, skip rather than wedge the
    // whole lazy-schema init (the Files tab has its own storage bootstrap).
    try {
      await this.db.query(`
        ALTER TABLE stored_files
          ADD COLUMN IF NOT EXISTS project_id UUID,
          ADD COLUMN IF NOT EXISTS task_id UUID
      `);
    } catch {
      // stored_files not present yet — safe to ignore.
    }

    // ---- NEW delivery tables (greenfield) ----
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS project_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        due_date TIMESTAMPTZ,
        sort_order INT NOT NULL DEFAULT 0,
        completed_at TIMESTAMPTZ,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT project_milestones_status_check
          CHECK (status IN ('pending','in_progress','completed'))
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_milestones_team ON project_milestones(team_id)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(team_id, project_id)`);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS project_deliverables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        due_date TIMESTAMPTZ,
        file_id UUID,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMPTZ,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT project_deliverables_status_check
          CHECK (status IN ('pending','in_review','approved','delivered','rejected'))
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_deliverables_team ON project_deliverables(team_id)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_deliverables_project ON project_deliverables(team_id, project_id)`);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS project_expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        category VARCHAR(80),
        description TEXT,
        amount NUMERIC(14,2) NOT NULL DEFAULT 0,
        expense_date DATE,
        billable BOOLEAN NOT NULL DEFAULT true,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_expenses_team ON project_expenses(team_id)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_expenses_project ON project_expenses(team_id, project_id)`);
    } finally {
      try {
        await lock.query('SELECT pg_advisory_unlock($1)', [792113]);
      } catch {
        // ignore unlock errors
      }
      lock.release();
    }
  }

  /* ============================================================= *
   *  TENANCY                                                       *
   * ============================================================= */

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
    // Last resort: any team the user owns (covers admins without a set team_id).
    const { rows } = await this.db.query(
      `SELECT id FROM teams WHERE owner_id = $1`,
      [userId],
    );
    return rows.map((r: { id: string }) => r.id);
  }

  private async resolveReadTeams(user: any): Promise<string[]> {
    const accessible = await this.getAccessibleTeamIds(
      user?.id,
      user?.teamId ?? null,
      user?.role ?? OWNER_ROLE,
    );
    return accessible;
  }

  private async resolveWriteTeam(user: any, dtoTeamId?: string): Promise<string> {
    const accessible = await this.getAccessibleTeamIds(
      user?.id,
      user?.teamId ?? null,
      user?.role ?? OWNER_ROLE,
    );
    if (!accessible.length) {
      throw new ForbiddenException('You do not have access to a team');
    }
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

  /** Confirm a team member (or owner) exists so assignee/manager refs are valid. */
  private async isTeamMember(teamId: string, userId?: string | null): Promise<boolean> {
    if (!userId || !this.isUuid(userId)) return false;
    const { rows } = await this.db.query(
      `SELECT 1
         FROM (
           SELECT owner_id AS uid FROM teams WHERE id = $1
           UNION
           SELECT user_id AS uid FROM team_members WHERE team_id = $1 AND status = 'active'
           UNION
           SELECT id AS uid FROM users WHERE team_id = $1
         ) m
        WHERE m.uid = $2
        LIMIT 1`,
      [teamId, userId],
    );
    return rows.length > 0;
  }

  /** Ensure a referenced stored_file belongs to the caller's team (no cross-team ref). */
  private async assertFileInTeam(teamId: string, fileId: string): Promise<void> {
    try {
      const { rows } = await this.db.query(
        `SELECT 1 FROM stored_files WHERE id = $1 AND team_id = $2 LIMIT 1`,
        [fileId, teamId],
      );
      if (!rows.length) throw new BadRequestException('File is not in this team');
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid file reference');
    }
  }

  private async assertProjectInTeam(teamId: string, projectId: string): Promise<any> {
    if (!this.isUuid(projectId)) throw new BadRequestException('Invalid project id');
    const { rows } = await this.db.query(
      `SELECT * FROM projects WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [projectId, teamId],
    );
    if (!rows.length) throw new NotFoundException('Project not found');
    return rows[0];
  }

  /* ============================================================= *
   *  SANITIZERS / COERCION                                         *
   * ============================================================= */

  private isUuid(v: any): boolean {
    return typeof v === 'string' && ProjectsService.UUID_RE.test(v);
  }

  private assertUuidOrBlank(value: any, label: string): void {
    if (value !== undefined && value !== null && value !== '' && !this.isUuid(value)) {
      throw new BadRequestException(`Invalid ${label} reference`);
    }
  }

  private uuidOrNull(v: any): string | null {
    return this.isUuid(v) ? v : null;
  }

  // Strip NUL (0x00) which Postgres rejects in text/jsonb, trim, length-bound.
  private sanitizeText(v: any, max: number): string | null {
    if (typeof v !== 'string') return null;
    const t = v.split(NUL).join('').trim();
    if (!t) return null;
    return t.length > max ? t.slice(0, max) : t;
  }

  private sanitizeJson(value: any, depth = 0): any {
    if (depth > 6) return null;
    if (typeof value === 'string') return value.split(NUL).join('').slice(0, 5000);
    if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
    if (Array.isArray(value)) return value.slice(0, 200).map((v) => this.sanitizeJson(v, depth + 1));
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {};
      let n = 0;
      for (const [k, v] of Object.entries(value)) {
        if (n++ >= 100) break;
        out[k.split(NUL).join('').slice(0, 200)] = this.sanitizeJson(v, depth + 1);
      }
      return out;
    }
    return null;
  }

  private jsonb(v: any): string | null {
    if (v === undefined || v === null) return null;
    return JSON.stringify(this.sanitizeJson(v));
  }

  private cleanTags(v: any): string[] {
    if (!Array.isArray(v)) return [];
    return v
      .filter((x) => typeof x === 'string')
      .map((x) => this.sanitizeText(x, 200))
      .filter((x): x is string => !!x)
      .slice(0, 40);
  }

  private num(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  // NUMERIC(14,2) tops out at 999,999,999,999.99 — clamp so an oversized amount
  // becomes a bounded value instead of a Postgres overflow (22003 -> 500).
  private static readonly MONEY_MAX = 999999999999.99;
  private money(v: any): number | null {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    const capped = Math.min(n, ProjectsService.MONEY_MAX);
    return Math.round(capped * 100) / 100;
  }

  // Bound an integer input to a non-negative value that fits INT4 (max
  // 2,147,483,647) so oversized minutes/estimates/order can't overflow -> 500.
  private clampInt(v: any, max = 2000000000): number {
    const n = Math.round(this.num(v));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, n));
  }

  private round1(n: number): number {
    return Math.round(n * 10) / 10;
  }

  private clampProgress(v: any): number {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  /** Accept ISO datetime or date-only; return null if not a real calendar date. */
  private parseTimestamp(v: any): string | null {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  /** For DATE columns: validate YYYY-MM-DD (or leading portion of ISO). */
  private parseDateOnly(v: any): string | null {
    if (typeof v !== 'string') return null;
    const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
      return null;
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  private normEnum(v: any, allowed: string[], fallback: string): string {
    if (typeof v !== 'string') return fallback;
    const raw = v.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (allowed.includes(raw)) return raw;
    const synonyms: Record<string, string> = {
      active: 'in_progress',
      inprogress: 'in_progress',
      progress: 'in_progress',
      review: this.MILESTONE_STATUSES === allowed ? 'in_progress' : 'in_review',
      inreview: 'in_review',
      hold: 'on_hold',
      onhold: 'on_hold',
      done: 'completed',
      complete: 'completed',
      finished: 'completed',
      todo: 'pending',
      open: 'pending',
      cancel: 'cancelled',
      canceled: 'cancelled',
      delivered: 'delivered',
      approved: 'approved',
      rejected: 'rejected',
    };
    const mapped = synonyms[raw];
    if (mapped && allowed.includes(mapped)) return mapped;
    return fallback;
  }

  private normProjectStatus(v: any): string {
    return this.normEnum(v, this.PROJECT_STATUSES, 'planning');
  }
  private normTaskStatus(v: any): string {
    return this.normEnum(v, this.TASK_STATUSES, 'pending');
  }
  private normPriority(v: any): string {
    return this.normEnum(v, this.PRIORITIES, 'medium');
  }
  private normMilestoneStatus(v: any): string {
    return this.normEnum(v, this.MILESTONE_STATUSES, 'pending');
  }
  private normDeliverableStatus(v: any): string {
    return this.normEnum(v, this.DELIVERABLE_STATUSES, 'pending');
  }

  /* ============================================================= *
   *  ACTIVITY (shared events table)                               *
   * ============================================================= */

  private async logActivity(
    teamId: string,
    userId: string | null,
    eventType: string,
    entityType: string,
    entityId: string | null,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO events (event_type, entity_type, entity_id, user_id, team_id, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb, NOW())`,
        [
          eventType,
          entityType,
          this.uuidOrNull(entityId),
          this.uuidOrNull(userId),
          teamId,
          this.jsonb(metadata || {}),
        ],
      );
    } catch {
      // Activity logging must never break a core write.
    }
  }

  /* ============================================================= *
   *  MAPPERS                                                       *
   * ============================================================= */

  private mapProject(row: any): any {
    const taskTotal = this.num(row.taskTotal);
    const taskDone = this.num(row.taskDone);
    const stored = this.num(row.progress);
    const progress = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : stored;
    const budget = row.budget === null || row.budget === undefined ? null : this.num(row.budget);
    const spent = this.num(row.spent);
    return {
      id: row.id,
      teamId: row.teamId,
      code: row.code || null,
      name: row.name,
      description: row.description || null,
      status: row.status,
      statusLabel: this.labelFor(row.status),
      priority: row.priority,
      progress,
      storedProgress: stored,
      budget,
      spent,
      currency: row.currency || 'USD',
      budgetUtilization: budget && budget > 0 ? this.round1((spent / budget) * 100) : null,
      contactId: row.contactId || null,
      clientName: row.clientName || null,
      managerId: row.managerId || null,
      managerName: row.managerName || null,
      ownerId: row.ownerId || null,
      startDate: row.startDate || null,
      dueDate: row.dueDate || null,
      completedAt: row.completedAt || null,
      taskTotal,
      taskDone,
      milestoneTotal: this.num(row.milestoneTotal),
      milestoneDone: this.num(row.milestoneDone),
      loggedMinutes: this.num(row.loggedMinutes),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private labelFor(status: string): string {
    const map: Record<string, string> = {
      planning: 'Planning',
      in_progress: 'In Progress',
      in_review: 'In Review',
      on_hold: 'On Hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return map[status] || status;
  }

  /* ============================================================= *
   *  CONTEXT (pickers + resolved team for file uploads)           *
   * ============================================================= */

  async getContext(user: any): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const [members, clients] = await Promise.all([
      this.listMembers(teamId),
      this.listClientOptions([teamId]),
    ]);
    return {
      teamId,
      currency: 'USD',
      isSupport: String(user?.role || '').toLowerCase() === 'super_admin',
      members,
      clients,
    };
  }

  private async listMembers(teamId: string): Promise<any[]> {
    const { rows } = await this.db.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.avatar_url AS "avatarUrl", u.job_title AS "jobTitle"
         FROM (
           SELECT owner_id AS uid FROM teams WHERE id = $1
           UNION
           SELECT user_id AS uid FROM team_members WHERE team_id = $1 AND status = 'active'
           UNION
           SELECT id AS uid FROM users WHERE team_id = $1
         ) m
         JOIN users u ON u.id = m.uid
        WHERE u.id IS NOT NULL
        ORDER BY u.name NULLS LAST
        LIMIT 200`,
      [teamId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.email || 'Member',
      email: r.email || null,
      avatarUrl: r.avatarUrl || null,
      jobTitle: r.jobTitle || null,
    }));
  }

  private async listClientOptions(teams: string[]): Promise<any[]> {
    const { rows } = await this.db.query(
      `SELECT id, name, email FROM contacts
        WHERE team_id = ANY($1)
        ORDER BY name NULLS LAST
        LIMIT 500`,
      [teams],
    );
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.email || 'Client',
      email: r.email || null,
    }));
  }

  /* ============================================================= *
   *  PROJECTS CRUD                                                 *
   * ============================================================= */

  private projectSelect(): string {
    return `
      SELECT
        p.id, p.team_id AS "teamId", p.code, p.name, p.description,
        p.status, p.priority, p.progress, p.budget, p.currency,
        p.contact_id AS "contactId", p.manager_id AS "managerId", p.owner_id AS "ownerId",
        p.start_date AS "startDate", p.due_date AS "dueDate",
        p.completed_at AS "completedAt", p.created_at AS "createdAt", p.updated_at AS "updatedAt",
        c.name AS "clientName",
        COALESCE(mgr.name, own.name) AS "managerName",
        (SELECT COUNT(*) FROM team_tasks t WHERE t.project_id = p.id) AS "taskTotal",
        (SELECT COUNT(*) FROM team_tasks t WHERE t.project_id = p.id AND t.status = 'completed') AS "taskDone",
        (SELECT COUNT(*) FROM project_milestones m WHERE m.project_id = p.id) AS "milestoneTotal",
        (SELECT COUNT(*) FROM project_milestones m WHERE m.project_id = p.id AND m.status = 'completed') AS "milestoneDone",
        (SELECT COALESCE(SUM(e.amount),0) FROM project_expenses e WHERE e.project_id = p.id) AS "spent",
        (SELECT COALESCE(SUM(te.minutes),0) FROM team_time_entries te WHERE te.project_id = p.id) AS "loggedMinutes"
      FROM projects p
      LEFT JOIN contacts c ON c.id = p.contact_id
      LEFT JOIN users mgr ON mgr.id = p.manager_id
      LEFT JOIN users own ON own.id = p.owner_id
    `;
  }

  async listProjects(user: any, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) return { data: [], total: 0, page: 1, limit: 20 };

    const conditions: string[] = ['p.team_id = ANY($1)'];
    const values: any[] = [teams];
    let i = 2;
    const add = (sql: string, value: any) => {
      conditions.push(sql.replace('?', `$${i}`));
      values.push(value);
      i += 1;
    };

    const q = this.sanitizeText(query.search || query.q, 200);
    if (q) {
      conditions.push(
        `(p.name ILIKE $${i} OR p.code ILIKE $${i} OR c.name ILIKE $${i} OR COALESCE(mgr.name, own.name) ILIKE $${i})`,
      );
      values.push(`%${q}%`);
      i += 1;
    }
    if (query.status && query.status !== 'all') add('p.status = ?', this.normProjectStatus(query.status));
    if (query.priority && query.priority !== 'all') add('p.priority = ?', this.normPriority(query.priority));
    if (query.clientId && this.isUuid(query.clientId)) add('p.contact_id = ?', query.clientId);
    if (query.managerId && this.isUuid(query.managerId)) add('p.manager_id = ?', query.managerId);
    if (this.parseDateOnly(query.dateFrom)) add('p.due_date >= ?', this.parseDateOnly(query.dateFrom));
    if (this.parseDateOnly(query.dateTo)) {
      add("p.due_date < (?::date + INTERVAL '1 day')", this.parseDateOnly(query.dateTo));
    }
    if (query.overdue === 'true' || query.overdue === true) {
      conditions.push("p.due_date < NOW() AND p.status NOT IN ('completed','cancelled')");
    }
    if (query.hasBudget === 'true' || query.hasBudget === true) {
      conditions.push('p.budget IS NOT NULL');
    }

    const where = conditions.join(' AND ');
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM projects p
         LEFT JOIN contacts c ON c.id = p.contact_id
         LEFT JOIN users mgr ON mgr.id = p.manager_id
         LEFT JOIN users own ON own.id = p.owner_id
        WHERE ${where}`,
      values,
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await this.db.query(
      `${this.projectSelect()} WHERE ${where}
        ORDER BY p.updated_at DESC
        LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset],
    );

    return {
      data: dataRes.rows.map((r) => this.mapProject(r)),
      total,
      page,
      limit,
    };
  }

  async getProject(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) throw new NotFoundException('Project not found');
    const { rows } = await this.db.query(
      `${this.projectSelect()} WHERE p.id = $${2} AND p.team_id = ANY($1) LIMIT 1`,
      [teams, id],
    );
    if (!rows.length) throw new NotFoundException('Project not found');
    return this.mapProject(rows[0]);
  }

  async createProject(user: any, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user, body.teamId);

    const name = this.sanitizeText(body.name, 255);
    if (!name) throw new BadRequestException('Project name is required');

    this.assertUuidOrBlank(body.contactId, 'client');
    this.assertUuidOrBlank(body.managerId, 'manager');
    const contactId = this.uuidOrNull(body.contactId);
    const managerId = this.uuidOrNull(body.managerId);
    if (contactId) {
      const { rows } = await this.db.query(
        `SELECT 1 FROM contacts WHERE id = $1 AND team_id = $2 LIMIT 1`,
        [contactId, teamId],
      );
      if (!rows.length) throw new BadRequestException('Client not in this team');
    }
    if (managerId && !(await this.isTeamMember(teamId, managerId))) {
      throw new BadRequestException('Manager is not a member of this team');
    }

    const status = this.normProjectStatus(body.status);
    const code = await this.nextProjectCode(teamId);

    const { rows } = await this.db.query(
      `INSERT INTO projects
        (team_id, code, name, description, status, priority, owner_id, manager_id, contact_id,
         budget, currency, start_date, due_date, progress, completed_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, NOW(), NOW())
       RETURNING id`,
      [
        teamId,
        code,
        name,
        this.sanitizeText(body.description, 5000),
        status,
        this.normPriority(body.priority),
        user?.id || null,
        managerId,
        contactId,
        this.money(body.budget),
        this.sanitizeText(body.currency, 8) || 'USD',
        this.parseTimestamp(body.startDate),
        this.parseTimestamp(body.dueDate),
        this.clampProgress(body.progress),
        status === 'completed' ? new Date().toISOString() : null,
      ],
    );
    const id = rows[0].id;
    await this.logActivity(teamId, user?.id, 'project.created', 'project', id, { name, code });
    return this.getProject(user, id);
  }

  private async nextProjectCode(teamId: string): Promise<string> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM projects WHERE team_id = $1`,
      [teamId],
    );
    const n = (rows[0]?.n || 0) + 1;
    return `PRJ-${String(n).padStart(4, '0')}`;
  }

  async updateProject(user: any, id: string, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const existing = await this.assertProjectInTeam(teamId, id);

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    const set = (col: string, value: any) => {
      sets.push(`${col} = $${i}`);
      values.push(value);
      i += 1;
    };

    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      const name = this.sanitizeText(body.name, 255);
      if (!name) throw new BadRequestException('Project name cannot be empty');
      set('name', name);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      set('description', this.sanitizeText(body.description, 5000));
    }
    let newStatus: string | null = null;
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      newStatus = this.normProjectStatus(body.status);
      set('status', newStatus);
      // manage completed_at
      if (newStatus === 'completed' && existing.status !== 'completed') {
        set('completed_at', new Date().toISOString());
      } else if (newStatus !== 'completed' && existing.status === 'completed') {
        set('completed_at', null);
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'priority')) {
      set('priority', this.normPriority(body.priority));
    }
    if (Object.prototype.hasOwnProperty.call(body, 'progress')) {
      set('progress', this.clampProgress(body.progress));
    }
    if (Object.prototype.hasOwnProperty.call(body, 'budget')) {
      set('budget', this.money(body.budget));
    }
    if (Object.prototype.hasOwnProperty.call(body, 'currency')) {
      set('currency', this.sanitizeText(body.currency, 8) || 'USD');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'startDate')) {
      set('start_date', this.parseTimestamp(body.startDate));
    }
    if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
      set('due_date', this.parseTimestamp(body.dueDate));
    }
    if (Object.prototype.hasOwnProperty.call(body, 'contactId')) {
      this.assertUuidOrBlank(body.contactId, 'client');
      const contactId = this.uuidOrNull(body.contactId);
      if (contactId) {
        const { rows } = await this.db.query(
          `SELECT 1 FROM contacts WHERE id = $1 AND team_id = $2 LIMIT 1`,
          [contactId, teamId],
        );
        if (!rows.length) throw new BadRequestException('Client not in this team');
      }
      set('contact_id', contactId);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'managerId')) {
      this.assertUuidOrBlank(body.managerId, 'manager');
      const managerId = this.uuidOrNull(body.managerId);
      if (managerId && !(await this.isTeamMember(teamId, managerId))) {
        throw new BadRequestException('Manager is not a member of this team');
      }
      set('manager_id', managerId);
    }

    if (!sets.length) return this.getProject(user, id);

    set('updated_at', new Date().toISOString());
    values.push(id, teamId);
    await this.db.query(
      `UPDATE projects SET ${sets.join(', ')} WHERE id = $${i} AND team_id = $${i + 1}`,
      values,
    );
    await this.logActivity(teamId, user?.id, 'project.updated', 'project', id, {
      name: existing.name,
      ...(newStatus ? { status: newStatus } : {}),
    });
    return this.getProject(user, id);
  }

  async duplicateProject(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const existing = await this.assertProjectInTeam(teamId, id);
    const code = await this.nextProjectCode(teamId);
    const { rows } = await this.db.query(
      `INSERT INTO projects
        (team_id, code, name, description, status, priority, owner_id, manager_id, contact_id,
         budget, currency, start_date, due_date, progress, completed_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'planning',$5,$6,$7,$8,$9,$10,$11,$12,0,NULL, NOW(), NOW())
       RETURNING id`,
      [
        teamId,
        code,
        this.sanitizeText(`${existing.name} (Copy)`, 255),
        existing.description || null,
        existing.priority || 'medium',
        user?.id || null,
        existing.manager_id || null,
        existing.contact_id || null,
        existing.budget ?? null,
        existing.currency || 'USD',
        existing.start_date || null,
        existing.due_date || null,
      ],
    );
    const newId = rows[0].id;
    await this.logActivity(teamId, user?.id, 'project.created', 'project', newId, {
      name: `${existing.name} (Copy)`,
      code,
      duplicatedFrom: id,
    });
    return this.getProject(user, newId);
  }

  async deleteProject(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const existing = await this.assertProjectInTeam(teamId, id);

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      // Detach shared task/time records (do NOT delete the shared tasks) and
      // remove project-owned delivery rows.
      await client.query(`UPDATE team_tasks SET project_id = NULL WHERE project_id = $1 AND team_id = $2`, [id, teamId]);
      await client.query(`UPDATE team_time_entries SET project_id = NULL WHERE project_id = $1 AND team_id = $2`, [id, teamId]);
      await client.query(`UPDATE stored_files SET project_id = NULL WHERE project_id = $1`, [id]);
      await client.query(`DELETE FROM project_deliverables WHERE project_id = $1 AND team_id = $2`, [id, teamId]);
      await client.query(`DELETE FROM project_milestones WHERE project_id = $1 AND team_id = $2`, [id, teamId]);
      await client.query(`DELETE FROM project_expenses WHERE project_id = $1 AND team_id = $2`, [id, teamId]);
      await client.query(`DELETE FROM projects WHERE id = $1 AND team_id = $2`, [id, teamId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    await this.logActivity(teamId, user?.id, 'project.deleted', 'project', id, { name: existing.name });
    return { success: true, id };
  }

  /* ============================================================= *
   *  OVERVIEW / DASHBOARD                                          *
   * ============================================================= */

  async getOverview(user: any): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) {
      return this.emptyOverview();
    }

    const [
      projAgg,
      statusRows,
      taskAgg,
      onTime,
      billable,
      budgetRows,
      activity,
      deadlines,
    ] = await Promise.all([
      this.db.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled'))::int AS active,
           COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= date_trunc('month', NOW()))::int AS completed_month,
           COALESCE(SUM(budget) FILTER (WHERE status NOT IN ('completed','cancelled')),0) AS active_budget
         FROM projects WHERE team_id = ANY($1)`,
        [teams],
      ),
      this.db.query(
        `SELECT status, COUNT(*)::int AS n FROM projects WHERE team_id = ANY($1) GROUP BY status`,
        [teams],
      ),
      this.db.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= date_trunc('month', NOW()))::int AS completed_month
         FROM team_tasks WHERE team_id = ANY($1)`,
        [teams],
      ),
      this.db.query(
        `SELECT
           COUNT(*)::int AS completed,
           COUNT(*) FILTER (WHERE due_date IS NULL OR completed_at <= due_date)::int AS on_time
         FROM project_milestones
          WHERE team_id = ANY($1) AND status = 'completed'`,
        [teams],
      ),
      this.db.query(
        `SELECT COALESCE(SUM(amount),0) AS billed
           FROM project_expenses
          WHERE team_id = ANY($1) AND billable = true
            AND expense_date >= date_trunc('month', NOW())::date`,
        [teams],
      ),
      this.db.query(
        `SELECT p.id, p.name,
                COALESCE(p.budget,0) AS budget,
                (SELECT COALESCE(SUM(e.amount),0) FROM project_expenses e WHERE e.project_id = p.id) AS spent
           FROM projects p
          WHERE p.team_id = ANY($1) AND p.status NOT IN ('cancelled')
          ORDER BY COALESCE(p.budget,0) DESC
          LIMIT 5`,
        [teams],
      ),
      this.db.query(
        `SELECT ev.event_type AS "eventType", ev.entity_type AS "entityType",
                ev.entity_id AS "entityId", ev.metadata, ev.created_at AS "createdAt",
                u.name AS "userName"
           FROM events ev
           LEFT JOIN users u ON u.id = ev.user_id
          WHERE ev.team_id = ANY($1)
            AND ev.event_type LIKE ANY(ARRAY['project.%','task.%','milestone.%','deliverable.%','time.%','expense.%'])
          ORDER BY ev.created_at DESC
          LIMIT 10`,
        [teams],
      ),
      this.db.query(
        `SELECT m.id, m.title, m.due_date AS "dueDate", p.name AS "projectName"
           FROM project_milestones m
           JOIN projects p ON p.id = m.project_id
          WHERE m.team_id = ANY($1) AND m.status <> 'completed' AND m.due_date IS NOT NULL
            AND m.due_date >= NOW()
          ORDER BY m.due_date ASC
          LIMIT 6`,
        [teams],
      ),
    ]);

    const pa = projAgg.rows[0] || {};
    const ta = taskAgg.rows[0] || {};
    const ot = onTime.rows[0] || {};
    const activeBudget = this.num(pa.active_budget);

    // portfolio spent (active projects) for utilization
    const spentRes = await this.db.query(
      `SELECT COALESCE(SUM(e.amount),0) AS spent
         FROM project_expenses e
         JOIN projects p ON p.id = e.project_id
        WHERE p.team_id = ANY($1) AND p.status NOT IN ('completed','cancelled')`,
      [teams],
    );
    const activeSpent = this.num(spentRes.rows[0]?.spent);

    const totalProjects = this.num(pa.total);
    const byStatus = this.PROJECT_STATUSES.map((s) => {
      const found = statusRows.rows.find((r: any) => r.status === s);
      const n = found ? this.num(found.n) : 0;
      return {
        status: s,
        label: this.labelFor(s),
        count: n,
        pct: totalProjects > 0 ? this.round1((n / totalProjects) * 100) : 0,
      };
    }).filter((r) => r.count > 0);

    const completedMilestones = this.num(ot.completed);
    const onTimeCount = this.num(ot.on_time);

    return {
      kpis: {
        activeProjects: this.num(pa.active),
        inProgressProjects: this.num(pa.in_progress),
        completedProjectsMonth: this.num(pa.completed_month),
        tasksInProgress: this.num(ta.in_progress),
        tasksTotal: this.num(ta.total),
        tasksCompletedMonth: this.num(ta.completed_month),
        onTimeDelivery:
          completedMilestones > 0 ? this.round1((onTimeCount / completedMilestones) * 100) : null,
        budgetUtilization: activeBudget > 0 ? this.round1((activeSpent / activeBudget) * 100) : null,
        billableAmountMonth: this.num(billable.rows[0]?.billed),
        totalProjects,
      },
      projectsByStatus: byStatus,
      budgetVsSpent: budgetRows.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        budget: this.num(r.budget),
        spent: this.num(r.spent),
      })),
      recentActivity: activity.rows.map((r: any) => this.describeActivity(r)),
      upcomingDeadlines: deadlines.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        projectName: r.projectName,
        dueDate: r.dueDate,
      })),
    };
  }

  private emptyOverview(): any {
    return {
      kpis: {
        activeProjects: 0,
        inProgressProjects: 0,
        completedProjectsMonth: 0,
        tasksInProgress: 0,
        tasksTotal: 0,
        tasksCompletedMonth: 0,
        onTimeDelivery: null,
        budgetUtilization: null,
        billableAmountMonth: 0,
        totalProjects: 0,
      },
      projectsByStatus: [],
      budgetVsSpent: [],
      recentActivity: [],
      upcomingDeadlines: [],
    };
  }

  private describeActivity(r: any): any {
    const meta = r.metadata || {};
    const titles: Record<string, string> = {
      'project.created': 'Project created',
      'project.updated': 'Project updated',
      'project.deleted': 'Project deleted',
      'task.created': 'Task created',
      'task.updated': 'Task updated',
      'task.completed': 'Task completed',
      'task.deleted': 'Task deleted',
      'milestone.created': 'Milestone created',
      'milestone.completed': 'Milestone achieved',
      'milestone.updated': 'Milestone updated',
      'milestone.deleted': 'Milestone deleted',
      'deliverable.created': 'Deliverable added',
      'deliverable.updated': 'Deliverable updated',
      'deliverable.deleted': 'Deliverable deleted',
      'time.logged': 'Time logged',
      'expense.created': 'Expense recorded',
      'expense.updated': 'Expense updated',
      'expense.deleted': 'Expense deleted',
    };
    return {
      eventType: r.eventType,
      title: titles[r.eventType] || r.eventType,
      subject: meta.title || meta.name || meta.note || null,
      userName: r.userName || null,
      createdAt: r.createdAt,
    };
  }

  /* ============================================================= *
   *  TASKS (shared team_tasks records)                            *
   * ============================================================= */

  private mapTask(row: any): any {
    return {
      id: row.id,
      teamId: row.teamId,
      projectId: row.projectId || null,
      projectName: row.projectName || null,
      name: row.title,
      title: row.title,
      description: row.description || null,
      status: row.status,
      statusLabel: this.taskStatusLabel(row.status),
      priority: row.priority,
      taskType: row.taskType || 'task',
      assignedTo: row.assignedTo || null,
      assignee: row.assigneeName || null,
      assigneeName: row.assigneeName || null,
      assigneeAvatar: row.assigneeAvatar || null,
      dueDate: row.dueDate || null,
      progress: this.num(row.progress),
      estimatedMinutes: this.num(row.estimatedMinutes),
      loggedMinutes: this.num(row.loggedMinutes),
      labels: Array.isArray(row.labels) ? row.labels : [],
      completedAt: row.completedAt || null,
      createdBy: row.createdBy || null,
      createdByName: row.createdByName || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private taskStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      review: 'In Review',
      on_hold: 'On Hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return map[status] || status;
  }

  private taskSelect(): string {
    return `
      SELECT
        tt.id, tt.team_id AS "teamId", tt.project_id AS "projectId",
        tt.title, tt.description, tt.status, tt.priority, tt.task_type AS "taskType",
        tt.assigned_to AS "assignedTo", tt.created_by AS "createdBy",
        tt.due_date AS "dueDate", tt.progress, tt.estimated_minutes AS "estimatedMinutes",
        tt.labels, tt.completed_at AS "completedAt",
        tt.created_at AS "createdAt", tt.updated_at AS "updatedAt",
        p.name AS "projectName",
        au.name AS "assigneeName", au.avatar_url AS "assigneeAvatar",
        cu.name AS "createdByName",
        (SELECT COALESCE(SUM(te.minutes),0) FROM team_time_entries te WHERE te.task_id = tt.id) AS "loggedMinutes"
      FROM team_tasks tt
      LEFT JOIN projects p ON p.id = tt.project_id
      LEFT JOIN users au ON au.id = tt.assigned_to
      LEFT JOIN users cu ON cu.id = tt.created_by
    `;
  }

  async listTasks(user: any, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) return { data: [], total: 0, page: 1, limit: 50 };

    const conditions: string[] = ['tt.team_id = ANY($1)'];
    const values: any[] = [teams];
    let i = 2;
    const add = (sql: string, value: any) => {
      conditions.push(sql.replace('?', `$${i}`));
      values.push(value);
      i += 1;
    };

    if (query.my === 'true' || query.my === true) add('tt.assigned_to = ?', user?.id);
    const q = this.sanitizeText(query.search || query.q, 200);
    if (q) {
      conditions.push(`(tt.title ILIKE $${i} OR tt.description ILIKE $${i})`);
      values.push(`%${q}%`);
      i += 1;
    }
    if (query.status && query.status !== 'all') add('tt.status = ?', this.normTaskStatus(query.status));
    if (query.priority && query.priority !== 'all') add('tt.priority = ?', this.normPriority(query.priority));
    if (query.assignee && this.isUuid(query.assignee)) add('tt.assigned_to = ?', query.assignee);
    if (query.project && query.project !== 'all' && this.isUuid(query.project)) {
      add('tt.project_id = ?', query.project);
    }
    if (query.taskType && query.taskType !== 'all') {
      add('tt.task_type = ?', this.sanitizeText(query.taskType, 50));
    }

    const where = conditions.join(' AND ');
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM team_tasks tt WHERE ${where}`,
      values,
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await this.db.query(
      `${this.taskSelect()} WHERE ${where}
        ORDER BY (tt.status = 'completed'), tt.due_date ASC NULLS LAST, tt.updated_at DESC
        LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset],
    );

    return {
      data: dataRes.rows.map((r) => this.mapTask(r)),
      total,
      page,
      limit,
    };
  }

  async getTask(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) throw new NotFoundException('Task not found');
    const { rows } = await this.db.query(
      `${this.taskSelect()} WHERE tt.id = $2 AND tt.team_id = ANY($1) LIMIT 1`,
      [teams, id],
    );
    if (!rows.length) throw new NotFoundException('Task not found');
    return this.mapTask(rows[0]);
  }

  async createTask(user: any, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user, body.teamId);

    const title = this.sanitizeText(body.title || body.name, 255);
    if (!title) throw new BadRequestException('Task title is required');

    this.assertUuidOrBlank(body.projectId, 'project');
    this.assertUuidOrBlank(body.assignedTo, 'assignee');
    const projectId = this.uuidOrNull(body.projectId);
    if (projectId) await this.assertProjectInTeam(teamId, projectId);
    const assignedTo = this.uuidOrNull(body.assignedTo);
    if (assignedTo && !(await this.isTeamMember(teamId, assignedTo))) {
      throw new BadRequestException('Assignee is not a member of this team');
    }

    const status = this.normTaskStatus(body.status);
    const { rows } = await this.db.query(
      `INSERT INTO team_tasks
        (team_id, project_id, title, description, status, priority, task_type,
         assigned_to, created_by, due_date, progress, estimated_minutes, labels, completed_at,
         created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
         CASE WHEN $5 = 'completed' THEN NOW() ELSE NULL END, NOW(), NOW())
       RETURNING id`,
      [
        teamId,
        projectId,
        title,
        this.sanitizeText(body.description, 5000),
        status,
        this.normPriority(body.priority),
        this.sanitizeText(body.taskType, 50) || 'task',
        assignedTo,
        user?.id,
        this.parseTimestamp(body.dueDate),
        this.clampProgress(body.progress),
        this.clampInt(body.estimatedMinutes),
        this.cleanTags(body.labels),
      ],
    );
    const id = rows[0].id;
    await this.logActivity(teamId, user?.id, 'task.created', 'team_task', id, { title });
    return this.getTask(user, id);
  }

  async updateTask(user: any, id: string, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const { rows: existRows } = await this.db.query(
      `SELECT * FROM team_tasks WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [id, teamId],
    );
    if (!existRows.length) throw new NotFoundException('Task not found');
    const existing = existRows[0];

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    const set = (col: string, value: any) => {
      sets.push(`${col} = $${i}`);
      values.push(value);
      i += 1;
    };

    if (Object.prototype.hasOwnProperty.call(body, 'title') || Object.prototype.hasOwnProperty.call(body, 'name')) {
      const title = this.sanitizeText(body.title ?? body.name, 255);
      if (!title) throw new BadRequestException('Task title cannot be empty');
      set('title', title);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      set('description', this.sanitizeText(body.description, 5000));
    }
    let newStatus: string | null = null;
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      newStatus = this.normTaskStatus(body.status);
      set('status', newStatus);
      if (newStatus === 'completed' && existing.status !== 'completed') {
        set('completed_at', new Date().toISOString());
      } else if (newStatus !== 'completed' && existing.status === 'completed') {
        set('completed_at', null);
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'priority')) set('priority', this.normPriority(body.priority));
    if (Object.prototype.hasOwnProperty.call(body, 'taskType')) {
      set('task_type', this.sanitizeText(body.taskType, 50) || 'task');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'progress')) set('progress', this.clampProgress(body.progress));
    if (Object.prototype.hasOwnProperty.call(body, 'estimatedMinutes')) {
      set('estimated_minutes', this.clampInt(body.estimatedMinutes));
    }
    if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) set('due_date', this.parseTimestamp(body.dueDate));
    if (Object.prototype.hasOwnProperty.call(body, 'labels')) set('labels', this.cleanTags(body.labels));
    if (Object.prototype.hasOwnProperty.call(body, 'projectId')) {
      this.assertUuidOrBlank(body.projectId, 'project');
      const projectId = this.uuidOrNull(body.projectId);
      if (projectId) await this.assertProjectInTeam(teamId, projectId);
      set('project_id', projectId);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'assignedTo')) {
      this.assertUuidOrBlank(body.assignedTo, 'assignee');
      const assignedTo = this.uuidOrNull(body.assignedTo);
      if (assignedTo && !(await this.isTeamMember(teamId, assignedTo))) {
        throw new BadRequestException('Assignee is not a member of this team');
      }
      set('assigned_to', assignedTo);
    }

    if (!sets.length) return this.getTask(user, id);

    set('updated_at', new Date().toISOString());
    values.push(id, teamId);
    await this.db.query(
      `UPDATE team_tasks SET ${sets.join(', ')} WHERE id = $${i} AND team_id = $${i + 1}`,
      values,
    );
    const eventType =
      newStatus === 'completed' && existing.status !== 'completed' ? 'task.completed' : 'task.updated';
    await this.logActivity(teamId, user?.id, eventType, 'team_task', id, { title: existing.title });
    return this.getTask(user, id);
  }

  async deleteTask(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const { rows } = await this.db.query(
      `DELETE FROM team_tasks WHERE id = $1 AND team_id = $2 RETURNING id, title`,
      [id, teamId],
    );
    if (!rows.length) throw new NotFoundException('Task not found');
    await this.logActivity(teamId, user?.id, 'task.deleted', 'team_task', id, { title: rows[0].title });
    return { success: true, id };
  }

  async logTime(user: any, taskId: string, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const minutes = this.clampInt(body.minutes);
    if (!(minutes > 0)) throw new BadRequestException('Minutes must be greater than zero');

    const { rows: taskRows } = await this.db.query(
      `SELECT id, project_id, title FROM team_tasks WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [taskId, teamId],
    );
    if (!taskRows.length) throw new NotFoundException('Task not found');
    const task = taskRows[0];

    await this.db.query(
      `INSERT INTO team_time_entries (team_id, task_id, project_id, user_id, minutes, note, started_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())`,
      [
        teamId,
        taskId,
        task.project_id || null,
        user?.id,
        minutes,
        this.sanitizeText(body.note, 2000),
        this.parseTimestamp(body.startedAt),
      ],
    );
    await this.logActivity(teamId, user?.id, 'time.logged', 'team_task', taskId, {
      title: task.title,
      minutes,
    });
    return { success: true, minutes };
  }

  /* ============================================================= *
   *  MILESTONES                                                    *
   * ============================================================= */

  private mapMilestone(row: any): any {
    return {
      id: row.id,
      teamId: row.teamId,
      projectId: row.projectId,
      projectName: row.projectName || null,
      title: row.title,
      description: row.description || null,
      status: row.status,
      dueDate: row.dueDate || null,
      sortOrder: this.num(row.sortOrder),
      completedAt: row.completedAt || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listMilestones(user: any, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) return { data: [] };

    const conditions: string[] = ['m.team_id = ANY($1)'];
    const values: any[] = [teams];
    let i = 2;
    if (query.project && this.isUuid(query.project)) {
      conditions.push(`m.project_id = $${i}`);
      values.push(query.project);
      i += 1;
    }
    if (query.status && query.status !== 'all') {
      conditions.push(`m.status = $${i}`);
      values.push(this.normMilestoneStatus(query.status));
      i += 1;
    }

    const { rows } = await this.db.query(
      `SELECT m.id, m.team_id AS "teamId", m.project_id AS "projectId", m.title, m.description,
              m.status, m.due_date AS "dueDate", m.sort_order AS "sortOrder",
              m.completed_at AS "completedAt", m.created_at AS "createdAt", m.updated_at AS "updatedAt",
              p.name AS "projectName"
         FROM project_milestones m
         JOIN projects p ON p.id = m.project_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY m.due_date ASC NULLS LAST, m.sort_order ASC, m.created_at ASC`,
      values,
    );
    return { data: rows.map((r) => this.mapMilestone(r)) };
  }

  async createMilestone(user: any, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user, body.teamId);
    this.assertUuidOrBlank(body.projectId, 'project');
    const projectId = this.uuidOrNull(body.projectId);
    if (!projectId) throw new BadRequestException('Milestone requires a project');
    await this.assertProjectInTeam(teamId, projectId);

    const title = this.sanitizeText(body.title, 255);
    if (!title) throw new BadRequestException('Milestone title is required');

    const status = this.normMilestoneStatus(body.status);
    const { rows } = await this.db.query(
      `INSERT INTO project_milestones
        (team_id, project_id, title, description, status, due_date, sort_order, completed_at, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, CASE WHEN $5 = 'completed' THEN NOW() ELSE NULL END, $8, NOW(), NOW())
       RETURNING id`,
      [
        teamId,
        projectId,
        title,
        this.sanitizeText(body.description, 5000),
        status,
        this.parseTimestamp(body.dueDate),
        this.clampInt(body.sortOrder),
        user?.id || null,
      ],
    );
    const id = rows[0].id;
    await this.logActivity(teamId, user?.id, 'milestone.created', 'milestone', id, { title });
    return this.getMilestone(user, id);
  }

  async getMilestone(user: any, id: string): Promise<any> {
    const teams = await this.resolveReadTeams(user);
    const { rows } = await this.db.query(
      `SELECT m.id, m.team_id AS "teamId", m.project_id AS "projectId", m.title, m.description,
              m.status, m.due_date AS "dueDate", m.sort_order AS "sortOrder",
              m.completed_at AS "completedAt", m.created_at AS "createdAt", m.updated_at AS "updatedAt",
              p.name AS "projectName"
         FROM project_milestones m
         JOIN projects p ON p.id = m.project_id
        WHERE m.id = $2 AND m.team_id = ANY($1) LIMIT 1`,
      [teams, id],
    );
    if (!rows.length) throw new NotFoundException('Milestone not found');
    return this.mapMilestone(rows[0]);
  }

  async updateMilestone(user: any, id: string, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const { rows: existRows } = await this.db.query(
      `SELECT * FROM project_milestones WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [id, teamId],
    );
    if (!existRows.length) throw new NotFoundException('Milestone not found');
    const existing = existRows[0];

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    const set = (col: string, value: any) => {
      sets.push(`${col} = $${i}`);
      values.push(value);
      i += 1;
    };

    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      const title = this.sanitizeText(body.title, 255);
      if (!title) throw new BadRequestException('Milestone title cannot be empty');
      set('title', title);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      set('description', this.sanitizeText(body.description, 5000));
    }
    let newStatus: string | null = null;
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      newStatus = this.normMilestoneStatus(body.status);
      set('status', newStatus);
      if (newStatus === 'completed' && existing.status !== 'completed') {
        set('completed_at', new Date().toISOString());
      } else if (newStatus !== 'completed' && existing.status === 'completed') {
        set('completed_at', null);
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) set('due_date', this.parseTimestamp(body.dueDate));
    if (Object.prototype.hasOwnProperty.call(body, 'sortOrder')) {
      set('sort_order', this.clampInt(body.sortOrder));
    }

    if (!sets.length) return this.getMilestone(user, id);
    set('updated_at', new Date().toISOString());
    values.push(id, teamId);
    await this.db.query(
      `UPDATE project_milestones SET ${sets.join(', ')} WHERE id = $${i} AND team_id = $${i + 1}`,
      values,
    );
    const eventType =
      newStatus === 'completed' && existing.status !== 'completed' ? 'milestone.completed' : 'milestone.updated';
    await this.logActivity(teamId, user?.id, eventType, 'milestone', id, { title: existing.title });
    return this.getMilestone(user, id);
  }

  async deleteMilestone(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const { rows } = await this.db.query(
      `DELETE FROM project_milestones WHERE id = $1 AND team_id = $2 RETURNING id, title`,
      [id, teamId],
    );
    if (!rows.length) throw new NotFoundException('Milestone not found');
    await this.logActivity(teamId, user?.id, 'milestone.deleted', 'milestone', id, { title: rows[0].title });
    return { success: true, id };
  }

  /* ============================================================= *
   *  DELIVERABLES                                                  *
   * ============================================================= */

  private mapDeliverable(row: any): any {
    return {
      id: row.id,
      teamId: row.teamId,
      projectId: row.projectId,
      projectName: row.projectName || null,
      milestoneId: row.milestoneId || null,
      milestoneTitle: row.milestoneTitle || null,
      title: row.title,
      description: row.description || null,
      status: row.status,
      dueDate: row.dueDate || null,
      fileId: row.fileId || null,
      fileName: row.fileName || null,
      approvedBy: row.approvedBy || null,
      approvedByName: row.approvedByName || null,
      approvedAt: row.approvedAt || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private deliverableSelect(): string {
    return `
      SELECT d.id, d.team_id AS "teamId", d.project_id AS "projectId", d.milestone_id AS "milestoneId",
             d.title, d.description, d.status, d.due_date AS "dueDate", d.file_id AS "fileId",
             d.approved_by AS "approvedBy", d.approved_at AS "approvedAt",
             d.created_at AS "createdAt", d.updated_at AS "updatedAt",
             p.name AS "projectName", m.title AS "milestoneTitle",
             ab.name AS "approvedByName", sf.original_name AS "fileName"
        FROM project_deliverables d
        JOIN projects p ON p.id = d.project_id
        LEFT JOIN project_milestones m ON m.id = d.milestone_id
        LEFT JOIN users ab ON ab.id = d.approved_by
        LEFT JOIN stored_files sf ON sf.id = d.file_id
    `;
  }

  async listDeliverables(user: any, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) return { data: [] };

    const conditions: string[] = ['d.team_id = ANY($1)'];
    const values: any[] = [teams];
    let i = 2;
    if (query.project && this.isUuid(query.project)) {
      conditions.push(`d.project_id = $${i}`);
      values.push(query.project);
      i += 1;
    }
    if (query.status && query.status !== 'all') {
      conditions.push(`d.status = $${i}`);
      values.push(this.normDeliverableStatus(query.status));
      i += 1;
    }

    const { rows } = await this.db.query(
      `${this.deliverableSelect()} WHERE ${conditions.join(' AND ')}
        ORDER BY d.due_date ASC NULLS LAST, d.created_at DESC`,
      values,
    );
    return { data: rows.map((r) => this.mapDeliverable(r)) };
  }

  async getDeliverable(user: any, id: string): Promise<any> {
    const teams = await this.resolveReadTeams(user);
    const { rows } = await this.db.query(
      `${this.deliverableSelect()} WHERE d.id = $2 AND d.team_id = ANY($1) LIMIT 1`,
      [teams, id],
    );
    if (!rows.length) throw new NotFoundException('Deliverable not found');
    return this.mapDeliverable(rows[0]);
  }

  async createDeliverable(user: any, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user, body.teamId);
    this.assertUuidOrBlank(body.projectId, 'project');
    const projectId = this.uuidOrNull(body.projectId);
    if (!projectId) throw new BadRequestException('Deliverable requires a project');
    await this.assertProjectInTeam(teamId, projectId);

    const title = this.sanitizeText(body.title, 255);
    if (!title) throw new BadRequestException('Deliverable title is required');

    this.assertUuidOrBlank(body.milestoneId, 'milestone');
    const milestoneId = this.uuidOrNull(body.milestoneId);
    if (milestoneId) {
      const { rows } = await this.db.query(
        `SELECT 1 FROM project_milestones WHERE id = $1 AND project_id = $2 AND team_id = $3 LIMIT 1`,
        [milestoneId, projectId, teamId],
      );
      if (!rows.length) throw new BadRequestException('Milestone not in this project');
    }
    this.assertUuidOrBlank(body.fileId, 'file');
    const fileId = this.uuidOrNull(body.fileId);
    if (fileId) await this.assertFileInTeam(teamId, fileId);

    const status = this.normDeliverableStatus(body.status);
    const approved = status === 'approved' || status === 'delivered';
    const { rows } = await this.db.query(
      `INSERT INTO project_deliverables
        (team_id, project_id, milestone_id, title, description, status, due_date, file_id,
         approved_by, approved_at, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW(), NOW())
       RETURNING id`,
      [
        teamId,
        projectId,
        milestoneId,
        title,
        this.sanitizeText(body.description, 5000),
        status,
        this.parseTimestamp(body.dueDate),
        fileId,
        approved ? user?.id || null : null,
        approved ? new Date().toISOString() : null,
        user?.id || null,
      ],
    );
    const id = rows[0].id;
    await this.logActivity(teamId, user?.id, 'deliverable.created', 'deliverable', id, { title });
    return this.getDeliverable(user, id);
  }

  async updateDeliverable(user: any, id: string, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const { rows: existRows } = await this.db.query(
      `SELECT * FROM project_deliverables WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [id, teamId],
    );
    if (!existRows.length) throw new NotFoundException('Deliverable not found');
    const existing = existRows[0];

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    const set = (col: string, value: any) => {
      sets.push(`${col} = $${i}`);
      values.push(value);
      i += 1;
    };

    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      const title = this.sanitizeText(body.title, 255);
      if (!title) throw new BadRequestException('Deliverable title cannot be empty');
      set('title', title);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      set('description', this.sanitizeText(body.description, 5000));
    }
    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      const newStatus = this.normDeliverableStatus(body.status);
      set('status', newStatus);
      const approved = newStatus === 'approved' || newStatus === 'delivered';
      const wasApproved = existing.status === 'approved' || existing.status === 'delivered';
      if (approved && !wasApproved) {
        set('approved_by', user?.id || null);
        set('approved_at', new Date().toISOString());
      } else if (!approved && wasApproved) {
        set('approved_by', null);
        set('approved_at', null);
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) set('due_date', this.parseTimestamp(body.dueDate));
    if (Object.prototype.hasOwnProperty.call(body, 'milestoneId')) {
      this.assertUuidOrBlank(body.milestoneId, 'milestone');
      const milestoneId = this.uuidOrNull(body.milestoneId);
      if (milestoneId) {
        const { rows } = await this.db.query(
          `SELECT 1 FROM project_milestones WHERE id = $1 AND project_id = $2 AND team_id = $3 LIMIT 1`,
          [milestoneId, existing.project_id, teamId],
        );
        if (!rows.length) throw new BadRequestException('Milestone not in this project');
      }
      set('milestone_id', milestoneId);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'fileId')) {
      this.assertUuidOrBlank(body.fileId, 'file');
      const fileId = this.uuidOrNull(body.fileId);
      if (fileId) await this.assertFileInTeam(teamId, fileId);
      set('file_id', fileId);
    }

    if (!sets.length) return this.getDeliverable(user, id);
    set('updated_at', new Date().toISOString());
    values.push(id, teamId);
    await this.db.query(
      `UPDATE project_deliverables SET ${sets.join(', ')} WHERE id = $${i} AND team_id = $${i + 1}`,
      values,
    );
    await this.logActivity(teamId, user?.id, 'deliverable.updated', 'deliverable', id, { title: existing.title });
    return this.getDeliverable(user, id);
  }

  async deleteDeliverable(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const { rows } = await this.db.query(
      `DELETE FROM project_deliverables WHERE id = $1 AND team_id = $2 RETURNING id, title`,
      [id, teamId],
    );
    if (!rows.length) throw new NotFoundException('Deliverable not found');
    await this.logActivity(teamId, user?.id, 'deliverable.deleted', 'deliverable', id, { title: rows[0].title });
    return { success: true, id };
  }

  /* ============================================================= *
   *  TIME & EXPENSES                                               *
   * ============================================================= */

  async getTimeAndExpenses(user: any, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) {
      return {
        time: { summary: { hoursLogged: 0, totalMinutes: 0, entryCount: 0, activeMembers: 0, projectsTracked: 0 }, byProject: [], byMember: [], entries: [] },
        expenses: { summary: { total: 0, billable: 0, nonBillable: 0, count: 0 }, byCategory: [], data: [] },
      };
    }

    // ---- time filters ----
    const tConds: string[] = ['te.team_id = ANY($1)'];
    const tVals: any[] = [teams];
    let ti = 2;
    if (query.project && this.isUuid(query.project)) {
      tConds.push(`te.project_id = $${ti}`);
      tVals.push(query.project);
      ti += 1;
    }
    if (query.member && this.isUuid(query.member)) {
      tConds.push(`te.user_id = $${ti}`);
      tVals.push(query.member);
      ti += 1;
    }
    if (this.parseDateOnly(query.dateFrom)) {
      tConds.push(`COALESCE(te.started_at, te.created_at) >= $${ti}::date`);
      tVals.push(this.parseDateOnly(query.dateFrom));
      ti += 1;
    }
    if (this.parseDateOnly(query.dateTo)) {
      tConds.push(`COALESCE(te.started_at, te.created_at) < ($${ti}::date + INTERVAL '1 day')`);
      tVals.push(this.parseDateOnly(query.dateTo));
      ti += 1;
    }
    const tWhere = tConds.join(' AND ');

    const [summary, byProject, byMember, entries] = await Promise.all([
      this.db.query(
        `SELECT COALESCE(SUM(te.minutes),0)::int AS minutes, COUNT(*)::int AS entries,
                COUNT(DISTINCT te.user_id)::int AS members, COUNT(DISTINCT te.project_id)::int AS projects
           FROM team_time_entries te WHERE ${tWhere}`,
        tVals,
      ),
      this.db.query(
        `SELECT te.project_id AS "projectId", COALESCE(p.name,'Unassigned') AS "projectName",
                COALESCE(SUM(te.minutes),0)::int AS minutes
           FROM team_time_entries te
           LEFT JOIN projects p ON p.id = te.project_id
          WHERE ${tWhere}
          GROUP BY te.project_id, p.name
          ORDER BY minutes DESC LIMIT 20`,
        tVals,
      ),
      this.db.query(
        `SELECT te.user_id AS "userId", COALESCE(u.name, u.email, 'Member') AS "userName",
                COALESCE(SUM(te.minutes),0)::int AS minutes
           FROM team_time_entries te
           LEFT JOIN users u ON u.id = te.user_id
          WHERE ${tWhere}
          GROUP BY te.user_id, u.name, u.email
          ORDER BY minutes DESC LIMIT 20`,
        tVals,
      ),
      this.db.query(
        `SELECT te.id, te.team_id AS "teamId", te.task_id AS "taskId", te.project_id AS "projectId",
                te.user_id AS "userId", te.minutes, te.note, te.started_at AS "startedAt",
                te.created_at AS "createdAt",
                tt.title AS "taskTitle", p.name AS "projectName", COALESCE(u.name,u.email) AS "userName"
           FROM team_time_entries te
           LEFT JOIN team_tasks tt ON tt.id = te.task_id
           LEFT JOIN projects p ON p.id = te.project_id
           LEFT JOIN users u ON u.id = te.user_id
          WHERE ${tWhere}
          ORDER BY COALESCE(te.started_at, te.created_at) DESC
          LIMIT 100`,
        tVals,
      ),
    ]);

    const s = summary.rows[0] || {};
    const totalMinutes = this.num(s.minutes);

    // ---- expense filters ----
    const eConds: string[] = ['e.team_id = ANY($1)'];
    const eVals: any[] = [teams];
    let ei = 2;
    if (query.project && this.isUuid(query.project)) {
      eConds.push(`e.project_id = $${ei}`);
      eVals.push(query.project);
      ei += 1;
    }
    if (query.category) {
      eConds.push(`e.category = $${ei}`);
      eVals.push(this.sanitizeText(query.category, 80));
      ei += 1;
    }
    if (this.parseDateOnly(query.dateFrom)) {
      eConds.push(`e.expense_date >= $${ei}::date`);
      eVals.push(this.parseDateOnly(query.dateFrom));
      ei += 1;
    }
    if (this.parseDateOnly(query.dateTo)) {
      eConds.push(`e.expense_date <= $${ei}::date`);
      eVals.push(this.parseDateOnly(query.dateTo));
      ei += 1;
    }
    const eWhere = eConds.join(' AND ');

    const [expSummary, byCategory, expData] = await Promise.all([
      this.db.query(
        `SELECT COALESCE(SUM(amount),0) AS total,
                COALESCE(SUM(amount) FILTER (WHERE billable),0) AS billable,
                COALESCE(SUM(amount) FILTER (WHERE NOT billable),0) AS non_billable,
                COUNT(*)::int AS count
           FROM project_expenses e WHERE ${eWhere}`,
        eVals,
      ),
      this.db.query(
        `SELECT COALESCE(NULLIF(e.category,''),'Uncategorized') AS category,
                COALESCE(SUM(e.amount),0) AS amount
           FROM project_expenses e WHERE ${eWhere}
          GROUP BY 1 ORDER BY amount DESC LIMIT 20`,
        eVals,
      ),
      this.db.query(
        `SELECT e.id, e.team_id AS "teamId", e.project_id AS "projectId", e.category, e.description,
                e.amount, e.expense_date AS "expenseDate", e.billable, e.created_at AS "createdAt",
                p.name AS "projectName"
           FROM project_expenses e
           LEFT JOIN projects p ON p.id = e.project_id
          WHERE ${eWhere}
          ORDER BY e.expense_date DESC NULLS LAST, e.created_at DESC
          LIMIT 200`,
        eVals,
      ),
    ]);

    const es = expSummary.rows[0] || {};

    return {
      time: {
        summary: {
          totalMinutes,
          hoursLogged: this.round1(totalMinutes / 60),
          entryCount: this.num(s.entries),
          activeMembers: this.num(s.members),
          projectsTracked: this.num(s.projects),
        },
        byProject: byProject.rows.map((r: any) => ({
          projectId: r.projectId,
          projectName: r.projectName,
          minutes: this.num(r.minutes),
          hours: this.round1(this.num(r.minutes) / 60),
        })),
        byMember: byMember.rows.map((r: any) => ({
          userId: r.userId,
          userName: r.userName,
          minutes: this.num(r.minutes),
          hours: this.round1(this.num(r.minutes) / 60),
        })),
        entries: entries.rows.map((r: any) => ({
          id: r.id,
          taskId: r.taskId,
          taskTitle: r.taskTitle || null,
          projectId: r.projectId,
          projectName: r.projectName || null,
          userId: r.userId,
          userName: r.userName || null,
          minutes: this.num(r.minutes),
          note: r.note || null,
          startedAt: r.startedAt || null,
          createdAt: r.createdAt,
        })),
      },
      expenses: {
        summary: {
          total: this.num(es.total),
          billable: this.num(es.billable),
          nonBillable: this.num(es.non_billable),
          count: this.num(es.count),
        },
        byCategory: byCategory.rows.map((r: any) => ({
          category: r.category,
          amount: this.num(r.amount),
        })),
        data: expData.rows.map((r: any) => this.mapExpense(r)),
      },
    };
  }

  private mapExpense(row: any): any {
    return {
      id: row.id,
      teamId: row.teamId,
      projectId: row.projectId || null,
      projectName: row.projectName || null,
      category: row.category || null,
      description: row.description || null,
      amount: this.num(row.amount),
      expenseDate: row.expenseDate || null,
      billable: !!row.billable,
      createdAt: row.createdAt,
    };
  }

  async createExpense(user: any, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user, body.teamId);
    this.assertUuidOrBlank(body.projectId, 'project');
    const projectId = this.uuidOrNull(body.projectId);
    if (!projectId) throw new BadRequestException('Expense requires a project');
    await this.assertProjectInTeam(teamId, projectId);

    const amount = this.money(body.amount);
    if (amount === null) throw new BadRequestException('A valid amount is required');

    const { rows } = await this.db.query(
      `INSERT INTO project_expenses
        (team_id, project_id, category, description, amount, expense_date, billable, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), NOW())
       RETURNING id`,
      [
        teamId,
        projectId,
        this.sanitizeText(body.category, 80),
        this.sanitizeText(body.description, 2000),
        amount,
        this.parseDateOnly(body.expenseDate),
        body.billable === false || body.billable === 'false' ? false : true,
        user?.id || null,
      ],
    );
    const id = rows[0].id;
    await this.logActivity(teamId, user?.id, 'expense.created', 'expense', id, {
      amount,
      category: this.sanitizeText(body.category, 80),
    });
    return this.getExpense(user, id);
  }

  async getExpense(user: any, id: string): Promise<any> {
    const teams = await this.resolveReadTeams(user);
    const { rows } = await this.db.query(
      `SELECT e.id, e.team_id AS "teamId", e.project_id AS "projectId", e.category, e.description,
              e.amount, e.expense_date AS "expenseDate", e.billable, e.created_at AS "createdAt",
              p.name AS "projectName"
         FROM project_expenses e
         LEFT JOIN projects p ON p.id = e.project_id
        WHERE e.id = $2 AND e.team_id = ANY($1) LIMIT 1`,
      [teams, id],
    );
    if (!rows.length) throw new NotFoundException('Expense not found');
    return this.mapExpense(rows[0]);
  }

  async updateExpense(user: any, id: string, body: any = {}): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const { rows: existRows } = await this.db.query(
      `SELECT id FROM project_expenses WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [id, teamId],
    );
    if (!existRows.length) throw new NotFoundException('Expense not found');

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    const set = (col: string, value: any) => {
      sets.push(`${col} = $${i}`);
      values.push(value);
      i += 1;
    };
    if (Object.prototype.hasOwnProperty.call(body, 'category')) set('category', this.sanitizeText(body.category, 80));
    if (Object.prototype.hasOwnProperty.call(body, 'description')) set('description', this.sanitizeText(body.description, 2000));
    if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
      const amount = this.money(body.amount);
      if (amount === null) throw new BadRequestException('A valid amount is required');
      set('amount', amount);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'expenseDate')) set('expense_date', this.parseDateOnly(body.expenseDate));
    if (Object.prototype.hasOwnProperty.call(body, 'billable')) {
      set('billable', body.billable === false || body.billable === 'false' ? false : true);
    }
    if (!sets.length) return this.getExpense(user, id);
    set('updated_at', new Date().toISOString());
    values.push(id, teamId);
    await this.db.query(
      `UPDATE project_expenses SET ${sets.join(', ')} WHERE id = $${i} AND team_id = $${i + 1}`,
      values,
    );
    await this.logActivity(teamId, user?.id, 'expense.updated', 'expense', id, {});
    return this.getExpense(user, id);
  }

  async deleteExpense(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveWriteTeam(user);
    const { rows } = await this.db.query(
      `DELETE FROM project_expenses WHERE id = $1 AND team_id = $2 RETURNING id`,
      [id, teamId],
    );
    if (!rows.length) throw new NotFoundException('Expense not found');
    await this.logActivity(teamId, user?.id, 'expense.deleted', 'expense', id, {});
    return { success: true, id };
  }

  /* ============================================================= *
   *  CLIENTS (shared contacts)                                    *
   * ============================================================= */

  async listClients(user: any, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) return { data: [] };

    const conditions: string[] = ['c.team_id = ANY($1)'];
    const values: any[] = [teams];
    let i = 2;
    const q = this.sanitizeText(query.search || query.q, 200);
    if (q) {
      conditions.push(`(c.name ILIKE $${i} OR c.email ILIKE $${i})`);
      values.push(`%${q}%`);
      i += 1;
    }
    if (query.withProjects === 'true' || query.withProjects === true) {
      conditions.push(`EXISTS (SELECT 1 FROM projects p WHERE p.contact_id = c.id)`);
    }

    const { rows } = await this.db.query(
      `SELECT c.id, c.name, c.email, c.phone, c.status, c.type, c.created_at AS "createdAt",
              (SELECT COUNT(*) FROM projects p WHERE p.contact_id = c.id)::int AS "projectCount",
              (SELECT COUNT(*) FROM projects p WHERE p.contact_id = c.id AND p.status NOT IN ('completed','cancelled'))::int AS "activeCount",
              (SELECT COALESCE(SUM(p.budget),0) FROM projects p WHERE p.contact_id = c.id) AS "totalBudget",
              (SELECT COALESCE(SUM(e.amount),0) FROM project_expenses e
                 JOIN projects p ON p.id = e.project_id WHERE p.contact_id = c.id) AS "totalSpent"
         FROM contacts c
        WHERE ${conditions.join(' AND ')}
        ORDER BY "projectCount" DESC, c.name ASC NULLS LAST
        LIMIT 500`,
      values,
    );
    return {
      data: rows.map((r: any) => ({
        id: r.id,
        name: r.name || r.email || 'Client',
        email: r.email || null,
        phone: r.phone || null,
        status: r.status || null,
        type: r.type || null,
        projectCount: this.num(r.projectCount),
        activeCount: this.num(r.activeCount),
        totalBudget: this.num(r.totalBudget),
        totalSpent: this.num(r.totalSpent),
        createdAt: r.createdAt,
      })),
    };
  }

  async getClientDetail(user: any, id: string): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) throw new NotFoundException('Client not found');
    const { rows } = await this.db.query(
      `SELECT id, name, email, phone, status, type FROM contacts WHERE id = $2 AND team_id = ANY($1) LIMIT 1`,
      [teams, id],
    );
    if (!rows.length) throw new NotFoundException('Client not found');
    const client = rows[0];
    const projRes = await this.db.query(
      `${this.projectSelect()} WHERE p.contact_id = $2 AND p.team_id = ANY($1) ORDER BY p.updated_at DESC LIMIT 100`,
      [teams, id],
    );
    return {
      id: client.id,
      name: client.name || client.email || 'Client',
      email: client.email || null,
      phone: client.phone || null,
      status: client.status || null,
      type: client.type || null,
      projects: projRes.rows.map((r) => this.mapProject(r)),
    };
  }

  /* ============================================================= *
   *  REPORTS                                                       *
   * ============================================================= */

  async getReports(user: any, query: any = {}): Promise<any> {
    await this.ensureSchema();
    const teams = await this.resolveReadTeams(user);
    if (!teams.length) {
      return {
        projectStatus: [],
        taskStatus: [],
        timeByProject: [],
        timeByMember: [],
        expensesByCategory: [],
        budgetByProject: [],
        onTimeRate: null,
        topClients: [],
      };
    }

    const [projStatus, taskStatus, timeByProject, timeByMember, expByCat, budgetByProject, onTime, topClients] =
      await Promise.all([
        this.db.query(
          `SELECT status, COUNT(*)::int AS n FROM projects WHERE team_id = ANY($1) GROUP BY status ORDER BY n DESC`,
          [teams],
        ),
        this.db.query(
          `SELECT status, COUNT(*)::int AS n FROM team_tasks WHERE team_id = ANY($1) GROUP BY status ORDER BY n DESC`,
          [teams],
        ),
        this.db.query(
          `SELECT COALESCE(MAX(p.name),'Unassigned') AS name, COALESCE(SUM(te.minutes),0)::int AS minutes
             FROM team_time_entries te LEFT JOIN projects p ON p.id = te.project_id
            WHERE te.team_id = ANY($1) GROUP BY te.project_id ORDER BY minutes DESC LIMIT 10`,
          [teams],
        ),
        this.db.query(
          `SELECT COALESCE(MAX(u.name),MAX(u.email),'Member') AS name, COALESCE(SUM(te.minutes),0)::int AS minutes
             FROM team_time_entries te LEFT JOIN users u ON u.id = te.user_id
            WHERE te.team_id = ANY($1) GROUP BY te.user_id ORDER BY minutes DESC LIMIT 10`,
          [teams],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(category,''),'Uncategorized') AS category, COALESCE(SUM(amount),0) AS amount
             FROM project_expenses WHERE team_id = ANY($1) GROUP BY 1 ORDER BY amount DESC LIMIT 10`,
          [teams],
        ),
        this.db.query(
          `SELECT p.name, COALESCE(p.budget,0) AS budget,
                  (SELECT COALESCE(SUM(e.amount),0) FROM project_expenses e WHERE e.project_id = p.id) AS spent
             FROM projects p WHERE p.team_id = ANY($1) AND p.status <> 'cancelled'
            ORDER BY COALESCE(p.budget,0) DESC LIMIT 10`,
          [teams],
        ),
        this.db.query(
          `SELECT COUNT(*)::int AS completed,
                  COUNT(*) FILTER (WHERE due_date IS NULL OR completed_at <= due_date)::int AS on_time
             FROM project_milestones WHERE team_id = ANY($1) AND status = 'completed'`,
          [teams],
        ),
        this.db.query(
          `SELECT c.name, COUNT(p.id)::int AS projects, COALESCE(SUM(p.budget),0) AS budget
             FROM contacts c JOIN projects p ON p.contact_id = c.id
            WHERE c.team_id = ANY($1)
            GROUP BY c.id, c.name ORDER BY projects DESC, budget DESC LIMIT 10`,
          [teams],
        ),
      ]);

    const ot = onTime.rows[0] || {};
    const completed = this.num(ot.completed);

    return {
      projectStatus: projStatus.rows.map((r: any) => ({
        status: r.status,
        label: this.labelFor(r.status),
        count: this.num(r.n),
      })),
      taskStatus: taskStatus.rows.map((r: any) => ({
        status: r.status,
        label: this.taskStatusLabel(r.status),
        count: this.num(r.n),
      })),
      timeByProject: timeByProject.rows.map((r: any) => ({
        name: r.name,
        minutes: this.num(r.minutes),
        hours: this.round1(this.num(r.minutes) / 60),
      })),
      timeByMember: timeByMember.rows.map((r: any) => ({
        name: r.name,
        minutes: this.num(r.minutes),
        hours: this.round1(this.num(r.minutes) / 60),
      })),
      expensesByCategory: expByCat.rows.map((r: any) => ({
        category: r.category,
        amount: this.num(r.amount),
      })),
      budgetByProject: budgetByProject.rows.map((r: any) => ({
        name: r.name,
        budget: this.num(r.budget),
        spent: this.num(r.spent),
      })),
      onTimeRate: completed > 0 ? this.round1((this.num(ot.on_time) / completed) * 100) : null,
      topClients: topClients.rows.map((r: any) => ({
        name: r.name,
        projects: this.num(r.projects),
        budget: this.num(r.budget),
      })),
    };
  }
}
