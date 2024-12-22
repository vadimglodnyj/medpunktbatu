import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationStockLog } from './entities/medication-stock-log.entity';
import { MedicationStockLogService } from './medication-stock-log.service';
import { MedicationModule } from '../medication/medication.module'; // Імпортуємо MedicationModule
import { MedicationStockLogController } from './medication-stock-log.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([MedicationStockLog]),
    forwardRef(() => MedicationModule), // Додаємо MedicationModule для доступу до MedicationRepository
  ],
  controllers: [MedicationStockLogController],
  providers: [MedicationStockLogService],
  exports: [MedicationStockLogService, TypeOrmModule], // Експортуємо для використання в інших модулях
})
export class MedicationStockLogModule {}
