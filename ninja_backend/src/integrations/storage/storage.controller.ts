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
  async getFile(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storageService.getFile(id, {
      userId: user.id,
      teamId: user.teamId,
      role: user.role,
    });
  }

  @Get('files/:id/url')
  @ApiOperation({ summary: 'Get signed URL for file access' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'URL expiration in seconds (default: 3600)' })
  @ApiResponse({ status: 200, description: 'Signed URL generated successfully' })
  async getSignedUrl(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const expiresInSeconds = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const url = await this.storageService.getSignedUrl(id, expiresInSeconds, {
      userId: user.id,
      teamId: user.teamId,
      role: user.role,
    });
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


  /* =========================================================
     TEAM WORKSPACE FILES
     ========================================================= */

  @Post('team-files/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a Team Workspace file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        teamId: { type: 'string' },
        projectId: { type: 'string', nullable: true },
        taskId: { type: 'string', nullable: true },
      },
      required: ['file', 'teamId'],
    },
  })
  async uploadTeamWorkspaceFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body('teamId') teamId?: string,
    @Body('projectId') projectId?: string,
    @Body('taskId') taskId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!teamId) {
      throw new BadRequestException('Team ID is required');
    }

    return this.storageService.uploadTeamWorkspaceFile({
      file,
      userId: user.id,
      teamId,
      role: user.role,
      projectId: projectId || null,
      taskId: taskId || null,
    });
  }

  @Get('team-files')
  @ApiOperation({ summary: 'List Team Workspace files' })
  @ApiQuery({ name: 'teamId', required: true })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'taskId', required: false })
  async listTeamWorkspaceFiles(
    @CurrentUser() user: any,
    @Query('teamId') teamId?: string,
    @Query('q') q?: string,
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('Team ID is required');
    }

    return this.storageService.listTeamWorkspaceFiles(
      teamId,
      {
        userId: user.id,
        teamId,
        role: user.role,
      },
      {
        q,
        projectId,
        taskId,
      },
    );
  }

  @Get('team-files/:id/url')
  @ApiOperation({ summary: 'Get signed URL for Team Workspace file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiQuery({ name: 'teamId', required: true })
  @ApiQuery({ name: 'expiresIn', required: false })
  async getTeamWorkspaceFileUrl(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('teamId') teamId?: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('Team ID is required');
    }

    const seconds = expiresIn
      ? parseInt(expiresIn, 10)
      : 3600;

    return this.storageService.getTeamWorkspaceFileUrl(
      id,
      teamId,
      {
        userId: user.id,
        teamId,
        role: user.role,
      },
      Number.isFinite(seconds) && seconds > 0
        ? seconds
        : 3600,
    );
  }

  @Delete('team-files/:id')
  @ApiOperation({ summary: 'Delete Team Workspace file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiQuery({ name: 'teamId', required: true })
  async deleteTeamWorkspaceFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('teamId') teamId?: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('Team ID is required');
    }

    await this.storageService.deleteTeamWorkspaceFile(
      id,
      teamId,
      {
        userId: user.id,
        teamId,
        role: user.role,
      },
    );

    return { message: 'File deleted successfully' };
  }

  @Get('config/status')
  @ApiOperation({ summary: 'Get storage configuration status' })
  @ApiResponse({ status: 200, description: 'Configuration status retrieved successfully' })
  async getConfigStatus() {
    return this.storageService.getConfigStatus();
  }
}