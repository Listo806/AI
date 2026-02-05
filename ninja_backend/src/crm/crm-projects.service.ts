import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface ProjectProgress {
  total_units: number;
  sold_units: number;
  sold_percent: number;
}

@Injectable()
export class CrmProjectsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Project progress: total units, sold units, sold_percent. Scoped by teamId.
   */
  async projectProgress(
    projectId: string,
    userId: string,
    teamId: string | null,
  ): Promise<ProjectProgress> {
    const project = await this.getProjectIfAllowed(projectId, teamId);
    if (!project) throw new NotFoundException('Project not found');

    const teamFilter = teamId ? 'AND p.team_id = $2' : 'AND p.created_by = $2';
    const params = teamId ? [projectId, teamId] : [projectId, userId];

    const totalResult = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM properties p
       WHERE p.project_id = $1 ${teamFilter}`,
      params,
    );
    const soldResult = await this.db.query(
      `SELECT COUNT(*)::int AS sold FROM properties p
       WHERE p.project_id = $1 AND p.status = 'sold' ${teamFilter}`,
      params,
    );

    const total = totalResult.rows[0]?.total ?? 0;
    const sold = soldResult.rows[0]?.sold ?? 0;
    const sold_percent = total ? Math.round((sold / total) * 100) : 0;

    return { total_units: total, sold_units: sold, sold_percent };
  }

  private async getProjectIfAllowed(
    projectId: string,
    teamId: string | null,
  ): Promise<{ id: string } | null> {
    if (!teamId) return null;
    const { rows } = await this.db.query(
      `SELECT id FROM projects WHERE id = $1 AND team_id = $2`,
      [projectId, teamId],
    );
    return rows[0] || null;
  }
}
