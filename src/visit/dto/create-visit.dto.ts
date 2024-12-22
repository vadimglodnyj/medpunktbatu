import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TreatmentTypeEnum } from '../enums/treatment-type.enum';
import { VisitStatus } from '../enums/visit-status.enum';

class MedicationDto {
  @IsNotEmpty({ message: 'Поле "medicationId" є обов’язковим.' })
  medicationId!: number;

  @IsNotEmpty({ message: 'Поле "quantity" є обов’язковим.' })
  quantity!: number;
}

export class CreateVisitDto {
  @IsDateString(
    {},
    { message: 'Поле "startDate" має бути датою у форматі ISO.' },
  )
  @IsNotEmpty({ message: 'Поле "startDate" є обов’язковим.' })
  startDate!: string;

  @IsOptional()
  @IsDateString({}, { message: 'Поле "endDate" має бути датою у форматі ISO.' })
  endDate!: string;

  @IsNotEmpty({ message: 'Поле "diagnosis" є обов’язковим.' })
  @IsString()
  diagnosis!: string;

  @IsNotEmpty({ message: 'Поле "facilityId" є обов’язковим.' })
  @IsInt({ message: 'Поле "facilityId" має бути цілим числом.' })
  facilityId!: number;

  @IsEnum(TreatmentTypeEnum, {
    message: 'Недопустиме значення для treatmentType.',
  })
  @IsNotEmpty({ message: 'Поле "treatmentType" є обов’язковим.' })
  treatmentType!: TreatmentTypeEnum;

  @IsNotEmpty({ message: 'Поле "patientId" є обов’язковим.' })
  patientId!: number;

  @IsEnum(VisitStatus, {
    message: 'Недопустиме значення для статусу візиту.',
  })
  @IsOptional()
  status?: VisitStatus; // Необов’язкове, але можна встановити вручну

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications?: MedicationDto[];
}
