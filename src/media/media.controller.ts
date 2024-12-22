import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaFile } from './entities/media-file.entity';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload/:visitId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('visitId') visitId: number,
    @UploadedFile() file: any, // Замість Express.Multer.File
    @Body('description') description?: string,
  ): Promise<MediaFile> {
    return this.mediaService.uploadFileToVisit(visitId, file, description);
  }

  @Get('visit/:visitId')
  async getFilesByVisit(
    @Param('visitId') visitId: number,
  ): Promise<MediaFile[]> {
    return this.mediaService.getFilesByVisit(visitId);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: number): Promise<boolean> {
    return this.mediaService.deleteFile(id);
  }
}
