import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Matches,
  IsDateString,
} from 'class-validator';
import { RankEnum } from '../enums/rank.enum';
import { ServiceTypeEnum } from '../enums/service-type.enum';
import { UnitEnum } from '../enums/unit.enum';

export class PatientQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], {
    message: 'order має бути або "ASC", або "DESC".',
  })
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsEnum(RankEnum, { message: 'Недопустиме значення для rank.' })
  rank?: RankEnum;

  @IsOptional()
  @IsEnum(ServiceTypeEnum, {
    message: 'Недопустиме значення для serviceType.',
  })
  serviceType?: ServiceTypeEnum;

  @IsOptional()
  @IsEnum(UnitEnum, { message: 'Недопустиме значення для unit.' })
  unit?: UnitEnum;

  @IsOptional()
  @IsString()
  additionalUnit?: string;

  @IsOptional()
  @Matches(/^\+380\d{9}$/, {
    message: 'phone має бути у форматі +380XXXXXXXXX.',
  })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'birthDate має бути у форматі YYYY-MM-DD.' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
