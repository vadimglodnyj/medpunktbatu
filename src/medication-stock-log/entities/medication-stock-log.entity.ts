import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Medication } from '../../medication/entities/medication.entity';
import { Visit } from '../../visit/entities/visit.entity';

@Entity()
export class MedicationStockLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Medication, (medication) => medication.usage, {
    eager: true,
  })
  medication!: Medication;

  @ManyToOne(() => Visit, (visit) => visit.medications, { eager: true })
  visit!: Visit;

  @Column()
  changeType!: 'INCREASE' | 'DECREASE';

  @Column()
  quantityChanged!: number;

  @Column()
  previousStock!: number;

  @Column()
  newStock!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;
}
