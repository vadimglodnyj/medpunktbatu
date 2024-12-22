import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MedicationUsage } from './medication-usage.entity';

@Entity()
export class Medication {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  shortName!: string;

  @Column()
  fullName!: string;

  @Column()
  unit!: string;

  @Column({ type: 'float' })
  pricePerUnit!: number;

  @Column({ type: 'float', default: 0 })
  stockQuantity!: number;

  @OneToMany(() => MedicationUsage, (usage) => usage.medication)
  usage!: MedicationUsage[];
}
