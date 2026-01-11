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
   * Get a signed URL for temporary file access
   */
  async getSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isConfigured || !this.s3Client) {
      throw new BadRequestException('Storage service is not configured');
    }

    // Get file from database
    const { rows } = await this.db.query(
      `SELECT s3_key FROM stored_files WHERE id = $1`,
      [fileId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('File not found');
    }

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
   * Get file metadata
   */
  async getFile(fileId: string): Promise<StoredFile> {
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

