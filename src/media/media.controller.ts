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
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { RoleEnum } from '../users/entities/user.entity';
import { Roles } from '../auth/roles/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload/:visitId')
  @Roles(RoleEnum.Medic, RoleEnum.ChiefMedic, RoleEnum.Admin)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('visitId') visitId: number,
    @UploadedFile() file: any, // Замість Express.Multer.File
    @Body('description') description?: string,
  ): Promise<MediaFile> {
    return this.mediaService.uploadFileToVisit(visitId, file, description);
  }

  @Get('visit/:visitId')
  @Roles(RoleEnum.Medic, RoleEnum.ChiefMedic, RoleEnum.Admin)
  async getFilesByVisit(
    @Param('visitId') visitId: number,
  ): Promise<MediaFile[]> {
    return this.mediaService.getFilesByVisit(visitId);
  }

  @Delete(':id')
  @Roles(RoleEnum.Admin, RoleEnum.ChiefMedic)
  async deleteFile(@Param('id') id: number): Promise<boolean> {
    return this.mediaService.deleteFile(id);
  }
}
