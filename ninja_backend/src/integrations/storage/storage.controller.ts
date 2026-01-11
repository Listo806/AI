import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('integrations')
@ApiBearerAuth('JWT-auth')
@Controller('integrations/storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file to storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', description: 'Optional folder path' },
        teamId: { type: 'string', description: 'Optional team ID' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body('folder') folder?: string,
    @Body('teamId') teamId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.storageService.uploadFile({
      file,
      folder,
      userId: user.id,
      teamId: teamId || user.teamId,
    });
  }

  @Get('files')
  @ApiOperation({ summary: 'List files' })
  @ApiQuery({ name: 'teamId', required: false, description: 'Team ID filter' })
  @ApiQuery({ name: 'folder', required: false, description: 'Folder path filter' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  async listFiles(
    @CurrentUser() user: any,
    @Query('teamId') teamId?: string,
    @Query('folder') folder?: string,
  ) {
    return this.storageService.listFiles(user.id, teamId || user.teamId, folder);
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(@Param('id') id: string) {
    return this.storageService.getFile(id);
  }

  @Get('files/:id/url')
  @ApiOperation({ summary: 'Get signed URL for file access' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'URL expiration in seconds (default: 3600)' })
  @ApiResponse({ status: 200, description: 'Signed URL generated successfully' })
  async getSignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const expiresInSeconds = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const url = await this.storageService.getSignedUrl(id, expiresInSeconds);
    return { url, expiresIn: expiresInSeconds };
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(@Param('id') id: string, @CurrentUser() user: any) {
    await this.storageService.deleteFile(id, user.id);
    return { message: 'File deleted successfully' };
  }

  @Get('config/status')
  @ApiOperation({ summary: 'Get storage configuration status' })
  @ApiResponse({ status: 200, description: 'Configuration status retrieved successfully' })
  async getConfigStatus() {
    return this.storageService.getConfigStatus();
  }
}

