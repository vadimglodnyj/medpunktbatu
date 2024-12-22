import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MediaFile } from './entities/media-file.entity';
import { Visit } from '../visit/entities/visit.entity';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaFile, Visit]),
    MulterModule.register({
      dest: './uploads', // Директорія для збереження файлів
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
