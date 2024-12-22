import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RoleEnum {
  Admin = 'Admin',
  ChiefMedic = 'ChiefMedic',
  Medic = 'Medic',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string; // Хеш пароля

  @Column({ default: false })
  isConfirmed!: boolean;

  @Column({
    type: 'enum',
    enum: RoleEnum,
    default: RoleEnum.Medic,
  })
  role!: RoleEnum;

  @Column({ nullable: true, type: 'varchar' })
  refreshToken!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
