import { IsNotEmpty, IsString, IsNumber, Min, IsIn } from 'class-validator';

export class CreateMedicationDto {
  @IsNotEmpty({ message: 'Поле "shortName" не може бути порожнім' })
  @IsString({ message: 'Поле "shortName" повинно бути рядком' })
  shortName!: string;

  @IsNotEmpty({ message: 'Поле "fullName" не може бути порожнім' })
  @IsString({ message: 'Поле "fullName" повинно бути рядком' })
  fullName!: string;

  @IsNotEmpty({ message: 'Поле "unit" не може бути порожнім' })
  @IsString({ message: 'Поле "unit" повинно бути рядком' })
  unit!: string;

  @IsNotEmpty({ message: 'Поле "pricePerUnit" не може бути порожнім' })
  @IsNumber({}, { message: 'Поле "pricePerUnit" повинно бути числом' })
  @Min(0, { message: 'Поле "pricePerUnit" не може бути від’ємним' })
  pricePerUnit!: number;

  @IsNotEmpty({ message: 'Поле "stockQuantity" не може бути порожнім' })
  @IsNumber({}, { message: 'Поле "stockQuantity" повинно бути числом' })
  @Min(0, { message: 'Поле "stockQuantity" не може бути від’ємним' })
  stockQuantity!: number;

  @IsNotEmpty({ message: 'Поле "usageType" не може бути порожнім' })
  @IsIn(['once', 'daily'], {
    message: 'Поле "usageType" повинно бути "once" або "daily"',
  })
  usageType!: 'once' | 'daily';
}
