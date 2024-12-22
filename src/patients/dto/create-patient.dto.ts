import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  Matches,
  IsDateString,
} from 'class-validator';
import { RankEnum } from '../enums/rank.enum';
import { ServiceTypeEnum } from '../enums/service-type.enum';
import { UnitEnum } from '../enums/unit.enum';

export class CreatePatientDto {
  @IsNotEmpty({ message: 'Поле "name" є обов’язковим.' })
  @IsString()
  name!: string;

  @IsNotEmpty({ message: 'Поле "phone" є обов’язковим.' })
  @Matches(/^\+380\d{9}$/, {
    message: 'phone має бути у форматі +380XXXXXXXXX.',
  })
  phone!: string;

  @IsNotEmpty({ message: 'Поле "birthDate" є обов’язковим.' })
  @IsDateString({}, { message: 'birthDate має бути у форматі YYYY-MM-DD.' })
  birthDate!: string;

  @IsEnum(RankEnum, { message: 'Недопустиме значення для rank.' })
  rank!: RankEnum;

  @IsEnum(ServiceTypeEnum, { message: 'Недопустиме значення для serviceType.' })
  serviceType!: ServiceTypeEnum;

  @IsEnum(UnitEnum, { message: 'Недопустиме значення для unit.' })
  unit!: UnitEnum;

  @IsOptional()
  @IsString()
  additionalUnit?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  specificDiagnosis?: string;

  constructor(partial: Partial<CreatePatientDto>) {
    Object.assign(this, partial);
  }
}
