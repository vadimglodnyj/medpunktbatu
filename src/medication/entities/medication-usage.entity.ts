import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Medication } from './medication.entity';
import { Visit } from '../../visit/entities/visit.entity';

@Entity()
export class MedicationUsage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Visit, (visit) => visit.medications, { onDelete: 'CASCADE' })
  visit!: Visit;

  @ManyToOne(() => Medication, (medication) => medication.usage, {
    eager: true,
  })
  medication!: Medication;

  @Column()
  quantity!: number;
}
