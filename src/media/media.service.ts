import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaFile } from './entities/media-file.entity';
import { Visit } from '../visit/entities/visit.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaFile)
    private readonly mediaRepository: Repository<MediaFile>,
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
  ) {}

  async uploadFileToVisit(
    visitId: number,
    file: any, // Замість Express.Multer.File
    description?: string,
  ): Promise<MediaFile> {
    const visit = await this.visitRepository.findOne({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${visitId} not found`);
    }

    const filePath = path.join('uploads', file.filename);
    fs.writeFileSync(filePath, file.buffer); // Збереження файлу локально

    const mediaFile = this.mediaRepository.create({
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath,
      description,
      visit,
    });

    return this.mediaRepository.save(mediaFile);
  }

  async getFilesByVisit(visitId: number): Promise<MediaFile[]> {
    const visit = await this.visitRepository.findOne({
      where: { id: visitId },
      relations: ['mediaFiles'],
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${visitId} not found`);
    }

    return visit.mediaFiles;
  }

  async deleteFile(id: number): Promise<boolean> {
    const mediaFile = await this.mediaRepository.findOne({ where: { id } });

    if (!mediaFile) {
      return false;
    }

    if (fs.existsSync(mediaFile.filePath)) {
      fs.unlinkSync(mediaFile.filePath); // Видалення локального файлу
    }

    await this.mediaRepository.delete(id);

    return true;
  }
}
