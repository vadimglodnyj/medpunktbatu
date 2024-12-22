import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicationStockLogDto } from './create-medication-stock-log.dto';

export class UpdateMedicationStockLogDto extends PartialType(CreateMedicationStockLogDto) {}
