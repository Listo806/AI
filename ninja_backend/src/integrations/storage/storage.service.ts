import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface UploadFileDto {
  file: Express.Multer.File;
  folder?: string;
  userId: string;
  teamId?: string;
}

// Identity of whoever is asking to read a file. Required by getFile/getSignedUrl
// so a file can only be reached by its uploader, a member of the team it was
// uploaded under, or platform support.
export interface FileRequester {
  userId: string;
  teamId?: string | null;
  role?: string | null;
}

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Documents (e.g. policy PDFs) allow more types and a larger cap than the
// image-only uploadFile path. Kept separate so the existing image upload behavior
// is unchanged.
const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];
const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export interface StoredFile {
  id: string;
  originalName: string;
  fileName: string;
  url: string;
  key: string;
  mimeType: string;
  size: number;
  folder?: string;
  userId: string;
  teamId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: Date;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    this.region = this.configService.get('AWS_REGION') || 'us-east-1';
    // Support both AWS_S3_BUCKET and AWS_S3_BUCKET_NAME for compatibility
    this.bucketName = this.configService.get('AWS_S3_BUCKET') || 
                      this.configService.get('AWS_S3_BUCKET_NAME') || 
                      '';

    // Debug logging to help identify missing variables
    if (!accessKeyId) {
      this.logger.warn('AWS_ACCESS_KEY_ID is missing');
    }
    if (!secretAccessKey) {
      this.logger.warn('AWS_SECRET_ACCESS_KEY is missing');
    }
    if (!this.bucketName) {
      this.logger.warn('AWS_S3_BUCKET or AWS_S3_BUCKET_NAME is missing');
    }

    if (accessKeyId && secretAccessKey && this.bucketName) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
      this.logger.log(`AWS S3 storage configured - Bucket: ${this.bucketName}, Region: ${this.region}`);
    } else {
      this.logger.warn(
        'AWS S3 not configured. Storage features will be disabled. ' +
        'Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET (or AWS_S3_BUCKET_NAME)'
      );
      this.isConfigured = false;
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(uploadDto: UploadFileDto): Promise<StoredFile> {
    if (!this.isConfigured || !this.s3Client) {
      throw new BadRequestException('Storage service is not configured');
    }

    const { file, folder, userId, teamId } = uploadDto;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate MIME type (jpg, png, webp only)
    const mimeType = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: JPEG, PNG, WebP. Got: ${file.mimetype || 'unknown'}`,
      );
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large. Maximum size: 5MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    // Generate unique file name
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = folder ? `${folder}/${fileName}` : fileName;

    try {
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          userId,
          ...(teamId && { teamId }),
        },
      });

      await this.s3Client.send(command);

      // Generate public URL
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      // Store file metadata in database
      const { rows } = await this.db.query(
        `INSERT INTO stored_files (
          id, original_name, file_name, url, s3_key, mime_type, size, folder, user_id, team_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id, original_name as "originalName", file_name as "fileName", url, s3_key as "key",
                  mime_type as "mimeType", size, folder, user_id as "userId", team_id as "teamId", created_at as "createdAt"`,
        [
          uuidv4(),
          file.originalname,
          fileName,
          url,
          key,
          file.mimetype,
          file.size,
          folder || null,
          userId,
          teamId || null,
        ],
      );

      this.logger.log(`File uploaded: ${key}`);
      return rows[0];
    } catch (error: any) {
      this.logger.error('S3 upload failed', error.message);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload a document (PDF / office file / image) to S3 and record it in
   * stored_files with its owning user + team. Same private-storage model as
   * uploadFile, but with the document mime allowlist and a larger size cap. The
   * returned `url` is the object path only; documents must be served through
   * getSignedUrl (a signed, temporary link), never this raw URL, so a private
   * bucket keeps them inaccessible without a signature.
   */
  async uploadDocument(uploadDto: UploadFileDto): Promise<StoredFile> {
    if (!this.isConfigured || !this.s3Client) {
      throw new BadRequestException('Storage service is not configured');
    }

    const { file, folder, userId, teamId } = uploadDto;
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const mimeType = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: PDF, Word, Excel, CSV, text, and images. Got: ${file.mimetype || 'unknown'}`,
      );
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large. Maximum size: 20MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = folder ? `${folder}/${fileName}` : fileName;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalName: file.originalname,
            userId,
            ...(teamId && { teamId }),
          },
        }),
      );

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      const { rows } = await this.db.query(
        `INSERT INTO stored_files (
          id, original_name, file_name, url, s3_key, mime_type, size, folder, user_id, team_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id, original_name as "originalName", file_name as "fileName", url, s3_key as "key",
                  mime_type as "mimeType", size, folder, user_id as "userId", team_id as "teamId", created_at as "createdAt"`,
        [
          uuidv4(),
          file.originalname,
          fileName,
          url,
          key,
          file.mimetype,
          file.size,
          folder || null,
          userId,
          teamId || null,
        ],
      );

      this.logger.log(`Document uploaded: ${key}`);
      return rows[0];
    } catch (error: any) {
      this.logger.error('S3 document upload failed', error.message);
      throw new BadRequestException(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Delete a stored file by its id WITHOUT a per-user ownership check. The caller
   * (e.g. the insurance module) must have already authorized the delete against
   * its own tenant rules. Removes the S3 object then the stored_files row; a
   * missing S3 object is treated as success. No-op if the id is unknown.
   */
  async deleteStoredFileById(fileId: string): Promise<void> {
    if (!fileId) return;
    const { rows } = await this.db.query(
      `SELECT s3_key FROM stored_files WHERE id = $1`,
      [fileId],
    );
    if (rows.length === 0) return;
    const key = rows[0].s3_key;
    if (this.isConfigured && this.s3Client) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
        );
      } catch (err: any) {
        if (err.name !== 'NoSuchKey' && err.$metadata?.httpStatusCode !== 404) {
          this.logger.warn(`S3 delete failed for ${key}: ${err.message}`);
        }
      }
    }
    await this.db.query(`DELETE FROM stored_files WHERE id = $1`, [fileId]);
  }

  // Enforce that `requester` is allowed to read a file owned by (ownerUserId,
  // ownerTeamId). Access is granted to the uploader, to any member of the team the
  // file was uploaded under, or to platform support (super_admin). A denial is
  // reported as 404 (not 403) so file ids cannot be enumerated by an attacker.
  private assertCanAccessFile(
    ownerUserId: string | null | undefined,
    ownerTeamId: string | null | undefined,
    requester: FileRequester | undefined,
  ): void {
    const role = String(requester?.role || '').toLowerCase();
    if (role === 'super_admin') return;
    if (ownerUserId && requester?.userId && ownerUserId === requester.userId) {
      return;
    }
    if (ownerTeamId && requester?.teamId && ownerTeamId === requester.teamId) {
      return;
    }
    throw new NotFoundException('File not found');
  }

  /**
   * Get a signed URL for temporary file access. The caller must own the file, be
   * on the file's team, or be platform support (enforced via `requester`).
   */
  async getSignedUrl(
    fileId: string,
    expiresIn: number = 3600,
    requester?: FileRequester,
  ): Promise<string> {
    if (!this.isConfigured || !this.s3Client) {
      throw new BadRequestException('Storage service is not configured');
    }

    // Get file from database
    const { rows } = await this.db.query(
      `SELECT s3_key, user_id, team_id FROM stored_files WHERE id = $1`,
      [fileId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('File not found');
    }

    this.assertCanAccessFile(rows[0].user_id, rows[0].team_id, requester);

    const key = rows[0].s3_key;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error: any) {
      this.logger.error('Failed to generate signed URL', error.message);
      throw new BadRequestException('Failed to generate file URL');
    }
  }

  /**
   * Delete S3 objects by URLs. Does NOT touch stored_files.
   * Throws on first S3 failure (for transaction safety in property delete).
   * 404/NoSuchKey is ignored (idempotent).
   */
  async deleteS3ObjectsByUrls(urls: string[]): Promise<void> {
    if (!this.isConfigured || !this.s3Client || urls.length === 0) {
      return;
    }
    const { rows } = await this.db.query(
      `SELECT id, s3_key FROM stored_files WHERE url = ANY($1::text[])`,
      [urls],
    );
    for (const row of rows) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({ Bucket: this.bucketName, Key: row.s3_key }),
        );
        this.logger.log(`S3 object deleted: ${row.s3_key}`);
      } catch (err: any) {
        // AWS returns NoSuchKey for missing objects - treat as success (idempotent)
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
          this.logger.debug(`S3 object already gone: ${row.s3_key}`);
          continue;
        }
        this.logger.error(`S3 delete failed for ${row.s3_key}: ${err.message}`);
        throw err;
      }
    }
  }

  /**
   * Delete file(s) by URL(s). Used when property/media is deleted to clean up S3 and stored_files.
   * No user check - caller (properties service) already validated permissions.
   * For single media delete: S3 failures are tolerated (log + remove stored_files).
   * For property delete: use deleteS3ObjectsByUrls first (throws), then transactional DB delete.
   */
  async deleteFilesByUrls(urls: string[]): Promise<void> {
    if (!this.isConfigured || !this.s3Client || urls.length === 0) {
      return;
    }
    const { rows } = await this.db.query(
      `SELECT id, s3_key FROM stored_files WHERE url = ANY($1::text[])`,
      [urls],
    );
    for (const row of rows) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({ Bucket: this.bucketName, Key: row.s3_key }),
        );
        this.logger.log(`File deleted (orphan cleanup): ${row.s3_key}`);
      } catch (err: any) {
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
          this.logger.debug(`S3 object already gone: ${row.s3_key}`);
        } else {
          this.logger.warn(`Failed to delete S3 object ${row.s3_key}: ${err.message}`);
        }
        // Still remove stored_files to avoid orphan records (resilient for single media delete)
      }
      await this.db.query(`DELETE FROM stored_files WHERE id = $1`, [row.id]);
    }
  }

  /**
   * Delete a single file by URL.
   */
  async deleteFileByUrl(url: string): Promise<void> {
    await this.deleteFilesByUrls([url]);
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    if (!this.isConfigured || !this.s3Client) {
      throw new BadRequestException('Storage service is not configured');
    }

    // Get file from database
    const { rows } = await this.db.query(
      `SELECT s3_key, user_id FROM stored_files WHERE id = $1`,
      [fileId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('File not found');
    }

    // Verify ownership (or admin check could be added)
    if (rows[0].user_id !== userId) {
      throw new BadRequestException('You do not have permission to delete this file');
    }

    const key = rows[0].s3_key;

    try {
      // Delete from S3
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      // Delete from database
      await this.db.query(`DELETE FROM stored_files WHERE id = $1`, [fileId]);

      this.logger.log(`File deleted: ${key}`);
    } catch (error: any) {
      this.logger.error('S3 delete failed', error.message);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List files for a user or team
   */
  async listFiles(userId: string, teamId?: string, folder?: string): Promise<StoredFile[]> {
    let query = `SELECT id, original_name as "originalName", file_name as "fileName", url, s3_key as "key",
                        mime_type as "mimeType", size, folder, user_id as "userId", team_id as "teamId", 
                        created_at as "createdAt"
                 FROM stored_files WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramCount = 2;

    if (teamId) {
      query += ` AND team_id = $${paramCount++}`;
      params.push(teamId);
    }

    if (folder) {
      query += ` AND folder = $${paramCount++}`;
      params.push(folder);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  /**
   * Get file metadata. The caller must own the file, be on the file's team, or be
   * platform support (enforced via `requester`).
   */
  async getFile(fileId: string, requester?: FileRequester): Promise<StoredFile> {
    const { rows } = await this.db.query(
      `SELECT id, original_name as "originalName", file_name as "fileName", url, s3_key as "key",
              mime_type as "mimeType", size, folder, user_id as "userId", team_id as "teamId",
              created_at as "createdAt"
       FROM stored_files WHERE id = $1`,
      [fileId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('File not found');
    }

    this.assertCanAccessFile(rows[0].userId, rows[0].teamId, requester);

    return rows[0];
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    if (!this.isConfigured || !this.s3Client) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }


  /* =========================================================
     TEAM WORKSPACE FILES
     ========================================================= */

  private async ensureCanAccessTeamWorkspaceFiles(
    teamId: string,
    requester: FileRequester,
  ): Promise<{ isOwner: boolean; isSuperAdmin: boolean }> {
    if (!teamId) {
      throw new BadRequestException('Team ID is required');
    }

    const role = String(requester?.role || '').trim().toLowerCase();
    const isSuperAdmin = role === 'super_admin';

    if (isSuperAdmin) {
      return { isOwner: false, isSuperAdmin: true };
    }

    const { rows: teamRows } = await this.db.query(
      `SELECT owner_id FROM teams WHERE id = $1 LIMIT 1`,
      [teamId],
    );

    if (!teamRows.length) {
      throw new NotFoundException('Team not found');
    }

    const isOwner = teamRows[0].owner_id === requester?.userId;

    if (isOwner) {
      return { isOwner: true, isSuperAdmin: false };
    }

    const { rows: memberRows } = await this.db.query(
      `SELECT 1
         FROM team_members
        WHERE team_id = $1
          AND user_id = $2
          AND status = 'active'
        LIMIT 1`,
      [teamId, requester?.userId],
    );

    if (!memberRows.length) {
      throw new NotFoundException('Team not found');
    }

    return { isOwner: false, isSuperAdmin: false };
  }

  private async validateTeamFileAssociation(
    teamId: string,
    projectId?: string | null,
    taskId?: string | null,
  ): Promise<void> {
    if (projectId) {
      const { rows } = await this.db.query(
        `SELECT id
           FROM projects
          WHERE id = $1
            AND team_id = $2
          LIMIT 1`,
        [projectId, teamId],
      );

      if (!rows.length) {
        throw new BadRequestException('Invalid project for this team');
      }
    }

    if (taskId) {
      const { rows } = await this.db.query(
        `SELECT id, project_id
           FROM team_tasks
          WHERE id = $1
            AND team_id = $2
          LIMIT 1`,
        [taskId, teamId],
      );

      if (!rows.length) {
        throw new BadRequestException('Invalid task for this team');
      }

      if (
        projectId &&
        rows[0].project_id &&
        String(rows[0].project_id) !== String(projectId)
      ) {
        throw new BadRequestException(
          'Selected task does not belong to the selected project',
        );
      }
    }
  }

  async uploadTeamWorkspaceFile({
    file,
    userId,
    teamId,
    role,
    projectId,
    taskId,
  }: {
    file: Express.Multer.File;
    userId: string;
    teamId: string;
    role?: string | null;
    projectId?: string | null;
    taskId?: string | null;
  }): Promise<StoredFile> {
    await this.ensureCanAccessTeamWorkspaceFiles(teamId, {
      userId,
      teamId,
      role,
    });

    await this.validateTeamFileAssociation(
      teamId,
      projectId || null,
      taskId || null,
    );

    const uploaded = await this.uploadDocument({
      file,
      folder: `team-workspace/${teamId}`,
      userId,
      teamId,
    });

    const { rows } = await this.db.query(
      `UPDATE stored_files
          SET project_id = $2,
              task_id = $3
        WHERE id = $1
        RETURNING
          id,
          original_name AS "originalName",
          file_name AS "fileName",
          url,
          s3_key AS "key",
          mime_type AS "mimeType",
          size,
          folder,
          user_id AS "userId",
          team_id AS "teamId",
          project_id AS "projectId",
          task_id AS "taskId",
          created_at AS "createdAt"`,
      [
        uploaded.id,
        projectId || null,
        taskId || null,
      ],
    );

    return rows[0] || {
      ...uploaded,
      projectId: projectId || null,
      taskId: taskId || null,
    };
  }

  async listTeamWorkspaceFiles(
    teamId: string,
    requester: FileRequester,
    filters: {
      q?: string;
      projectId?: string;
      taskId?: string;
    } = {},
  ): Promise<any[]> {
    await this.ensureCanAccessTeamWorkspaceFiles(teamId, {
      ...requester,
      teamId,
    });

    const conditions: string[] = ['sf.team_id = $1'];
    const values: any[] = [teamId];
    let i = 2;

    if (filters.q?.trim()) {
      conditions.push(`(
        sf.original_name ILIKE $${i}
        OR sf.file_name ILIKE $${i}
        OR COALESCE(p.name, '') ILIKE $${i}
        OR COALESCE(tt.title, '') ILIKE $${i}
        OR COALESCE(u.name, u.email, '') ILIKE $${i}
      )`);
      values.push(`%${filters.q.trim()}%`);
      i += 1;
    }

    if (filters.projectId) {
      conditions.push(`sf.project_id = $${i}`);
      values.push(filters.projectId);
      i += 1;
    }

    if (filters.taskId) {
      conditions.push(`sf.task_id = $${i}`);
      values.push(filters.taskId);
      i += 1;
    }

    const { rows } = await this.db.query(
      `SELECT
         sf.id,
         sf.original_name AS "originalName",
         sf.file_name AS "fileName",
         sf.url,
         sf.s3_key AS "key",
         sf.mime_type AS "mimeType",
         sf.size,
         sf.folder,
         sf.user_id AS "userId",
         sf.team_id AS "teamId",
         sf.project_id AS "projectId",
         sf.task_id AS "taskId",
         sf.created_at AS "createdAt",
         p.name AS "projectName",
         tt.title AS "taskName",
         COALESCE(u.name, u.email) AS "uploadedBy"
       FROM stored_files sf
       LEFT JOIN projects p
         ON p.id = sf.project_id
        AND p.team_id = sf.team_id
       LEFT JOIN team_tasks tt
         ON tt.id = sf.task_id
        AND tt.team_id = sf.team_id
       LEFT JOIN users u
         ON u.id = sf.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY sf.created_at DESC`,
      values,
    );

    return rows;
  }

  async getTeamWorkspaceFileUrl(
    fileId: string,
    teamId: string,
    requester: FileRequester,
    expiresIn: number = 3600,
  ): Promise<{ url: string; expiresIn: number }> {
    await this.ensureCanAccessTeamWorkspaceFiles(teamId, {
      ...requester,
      teamId,
    });

    const { rows } = await this.db.query(
      `SELECT id
         FROM stored_files
        WHERE id = $1
          AND team_id = $2
        LIMIT 1`,
      [fileId, teamId],
    );

    if (!rows.length) {
      throw new NotFoundException('File not found');
    }

    const url = await this.getSignedUrl(
      fileId,
      expiresIn,
      {
        ...requester,
        teamId,
      },
    );

    return { url, expiresIn };
  }

  async deleteTeamWorkspaceFile(
    fileId: string,
    teamId: string,
    requester: FileRequester,
  ): Promise<void> {
    const access = await this.ensureCanAccessTeamWorkspaceFiles(
      teamId,
      {
        ...requester,
        teamId,
      },
    );

    const { rows } = await this.db.query(
      `SELECT id, user_id
         FROM stored_files
        WHERE id = $1
          AND team_id = $2
        LIMIT 1`,
      [fileId, teamId],
    );

    if (!rows.length) {
      throw new NotFoundException('File not found');
    }

    const isUploader = rows[0].user_id === requester?.userId;

    if (
      !isUploader &&
      !access.isOwner &&
      !access.isSuperAdmin
    ) {
      throw new BadRequestException(
        'You do not have permission to delete this file',
      );
    }

    await this.deleteStoredFileById(fileId);
  }

  /**
   * Get configuration status (for debugging)
   */
  getConfigStatus() {
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get('AWS_REGION');
    const bucketName = this.configService.get('AWS_S3_BUCKET') || 
                       this.configService.get('AWS_S3_BUCKET_NAME');

    return {
      isConfigured: this.isConfigured,
      hasAccessKeyId: !!accessKeyId,
      hasSecretAccessKey: !!secretAccessKey,
      hasRegion: !!region,
      hasBucketName: !!bucketName,
      region: region || 'us-east-1 (default)',
      bucketName: bucketName || 'not set',
      // Don't expose actual keys, just show if they exist
      accessKeyIdPrefix: accessKeyId ? `${accessKeyId.substring(0, 4)}...` : 'not set',
      secretAccessKeyPrefix: secretAccessKey ? `${secretAccessKey.substring(0, 4)}...` : 'not set',
      envVariables: {
        AWS_ACCESS_KEY_ID: !!accessKeyId,
        AWS_SECRET_ACCESS_KEY: !!secretAccessKey,
        AWS_REGION: !!region,
        AWS_S3_BUCKET: !!this.configService.get('AWS_S3_BUCKET'),
        AWS_S3_BUCKET_NAME: !!this.configService.get('AWS_S3_BUCKET_NAME'),
      },
    };
  }
}