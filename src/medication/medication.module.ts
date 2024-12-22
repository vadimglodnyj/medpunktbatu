import { Module ,forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medication } from './entities/medication.entity';
import { MedicationUsage } from './entities/medication-usage.entity';
import { MedicationService } from './medication.service';
import { MedicationController } from './medication.controller';
import { MedicationStockLogModule } from '../medication-stock-log/medication-stock-log.module'; // Імпортуємо журнал змін

@Module({
  imports: [
    TypeOrmModule.forFeature([Medication, MedicationUsage]),
    forwardRef(() => MedicationStockLogModule),  // Підключаємо модуль журналу змін
  ],
  controllers: [MedicationController],
  providers: [MedicationService],
  exports: [MedicationService, TypeOrmModule], // Експортуємо Service і TypeOrmModule для використання в інших модулях
})
export class MedicationModule {}
