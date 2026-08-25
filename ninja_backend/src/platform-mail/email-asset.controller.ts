import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { EmailAssetService } from './email-asset.service';

const ALLOWED = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

@ApiTags('admin')
@Controller('email/asset')
export class EmailAssetController {
  constructor(private readonly assets: EmailAssetService) {}

  // Admin uploads an image for a custom email. Returns a stable public URL to embed.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  @ApiOperation({ summary: 'Upload an image for a custom email (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file || !file.buffer) {
      return { ok: false, error: 'No image was provided.' };
    }
    const mime = String(file.mimetype || '').toLowerCase();
    if (!ALLOWED.has(mime)) {
      return {
        ok: false,
        error: 'Unsupported image type. Use PNG, JPG, GIF or WebP.',
      };
    }
    if (file.buffer.length > MAX_BYTES) {
      return { ok: false, error: 'Image is too large (max 5 MB).' };
    }
    const adminId = user?.id || user?.userId || user?.sub || null;
    try {
      const res = await this.assets.store({
        buffer: file.buffer,
        mime,
        filename: file.originalname || null,
        adminId,
      });
      return { ok: true, id: res.id, url: res.url, size: res.size };
    } catch (err: any) {
      return {
        ok: false,
        error: `Upload failed: ${String(err?.message || 'unknown').slice(0, 200)}`,
      };
    }
  }

  // PUBLIC: serve the image bytes so email clients can load it. Long-cached +
  // immutable (asset bytes never change for a given id).
  @Get(':id')
  @ApiOperation({ summary: 'Serve an uploaded email image (public)' })
  async serve(@Param('id') id: string, @Res() res: Response) {
    const asset = await this.assets.get(id);
    if (!asset) {
      res.status(404).send('Not found');
      return;
    }
    res.set('Content-Type', asset.mime);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Content-Length', String(asset.data.length));
    res.send(asset.data);
  }
}
