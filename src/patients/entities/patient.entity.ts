import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
  Check,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Visit } from '../../visit/entities/visit.entity';
import { RankEnum } from '../enums/rank.enum';
import { ServiceTypeEnum } from '../enums/service-type.enum';
import { UnitEnum } from '../enums/unit.enum';

@Entity()
@Unique(['name', 'birthDate'])
@Unique(['phone'])
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 15 }) // Додаємо тип і обмеження довжини
  @Check("phone ~ '^\\+380\\d{9}$'")
  phone!: string;

  @Column({ type: 'date' })
  birthDate!: Date;

  @Column({
    type: 'enum',
    enum: RankEnum,
    default: RankEnum.Солдат,
  })
  rank!: RankEnum;

  @Column({
    type: 'enum',
    enum: ServiceTypeEnum,
    default: ServiceTypeEnum.Контракт,
  })
  serviceType!: ServiceTypeEnum;

  @Column({
    type: 'enum',
    enum: UnitEnum,
    default: UnitEnum.РОП1,
  })
  unit!: UnitEnum;

  @Column({ type: 'text', nullable: true })
  additionalUnit: string | null = null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null = null;

  @Column({ type: 'text', nullable: true })
  specificDiagnosis: string | null = null;

  @OneToMany(() => Visit, (visit) => visit.patient, { cascade: true })
  visits!: Visit[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor() {
    this.additionalUnit = null;
    this.allergies = null;
    this.specificDiagnosis = null;
  }
}
