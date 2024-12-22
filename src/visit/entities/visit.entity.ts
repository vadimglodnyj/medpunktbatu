import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { MedicationUsage } from '../../medication/entities/medication-usage.entity';
import { MediaFile } from '../../media/entities/media-file.entity';
import { VisitStatus } from '../enums/visit-status.enum';
import { Facility } from '../../facilities/entities/facility.entity';

@Entity()
export class Visit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date', nullable: false })
  startDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  @Index()
  preliminaryDiagnosis!: string | null;

  @Column({ nullable: true, type: 'text' })
  @Index()
  finalDiagnosis!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  circumstances!: string | null;

  @Column({ type: 'date', nullable: true })
  callDate!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  callNotes!: string | null;

  @Column({
    type: 'enum',
    enum: ['Pending', 'MissingDocs', 'Approved', 'Paid'],
    default: 'Pending',
  })
  compensationStatus!: 'Pending' | 'MissingDocs' | 'Approved' | 'Paid';

  @Column({ type: 'boolean', default: false })
  hasAppendix21!: boolean;

  @Column({ type: 'text', nullable: true })
  compensationDetails!: string | null;

  @Column({ type: 'text', nullable: true })
  vklConclusion!: string | null;

  @ManyToOne(() => Facility, { eager: false, nullable: false })
  facility!: Facility;

  @Column({
    type: 'enum',
    enum: [
      'Стаціонар',
      'Амбулаторно',
      'Лазарет',
      'Реабілітація',
      'Протезування',
      'ВЛК',
      'Відпустка',
      'Стабілізаційний пункт',
      'По догляду',
      'Лікування за кордоном',
    ],
    default: 'Стаціонар',
  })
  treatmentType!: string;

  @Column({
    type: 'enum',
    enum: ['Бойова', 'Не бойова'],
    default: 'Не бойова',
  })
  injuryType!: 'Бойова' | 'Не бойова';

  @Index()
  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.IN_PROGRESS,
  })
  status!: VisitStatus;

  @ManyToOne(() => Patient, (patient) => patient.visits, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  patient!: Patient;

  @OneToMany(
    () => MedicationUsage,
    (medicationUsage) => medicationUsage.visit,
    {
      cascade: true,
    },
  )
  medications!: MedicationUsage[];

  @OneToMany(() => MediaFile, (mediaFile) => mediaFile.visit, {
    cascade: true,
  })
  mediaFiles!: MediaFile[];

  @OneToMany(() => MediaFile, (mediaFile) => mediaFile.visit, {
    cascade: true,
  })
  compensationFiles!: MediaFile[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
