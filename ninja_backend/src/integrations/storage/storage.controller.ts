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
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('integrations/storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
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
  async listFiles(
    @CurrentUser() user: any,
    @Query('teamId') teamId?: string,
    @Query('folder') folder?: string,
  ) {
    return this.storageService.listFiles(user.id, teamId || user.teamId, folder);
  }

  @Get('files/:id')
  async getFile(@Param('id') id: string) {
    return this.storageService.getFile(id);
  }

  @Get('files/:id/url')
  async getSignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const expiresInSeconds = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const url = await this.storageService.getSignedUrl(id, expiresInSeconds);
    return { url, expiresIn: expiresInSeconds };
  }

  @Delete('files/:id')
  async deleteFile(@Param('id') id: string, @CurrentUser() user: any) {
    await this.storageService.deleteFile(id, user.id);
    return { message: 'File deleted successfully' };
  }

  @Get('config/status')
  async getConfigStatus() {
    return this.storageService.getConfigStatus();
  }
}

