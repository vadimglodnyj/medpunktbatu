import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Visit } from '../../visit/entities/visit.entity';

@Entity()
export class MediaFile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fileName!: string; // Назва файлу

  @Column()
  fileType!: string; // Тип файлу (наприклад, 'image/jpeg', 'application/pdf')

  @Column()
  filePath!: string; // Шлях до файлу на сервері

  @Column({ type: 'text', nullable: true })
  description: string | null = null; // Опис файлу (опціонально)

  @CreateDateColumn()
  uploadedAt!: Date; // Дата завантаження

  @ManyToOne(() => Visit, (visit) => visit.mediaFiles, {
    onDelete: 'CASCADE',
  })
  visit!: Visit; // Зв’язок з візитом
}
