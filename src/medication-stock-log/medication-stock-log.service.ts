import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicationStockLog } from './entities/medication-stock-log.entity';
import { Medication } from '../medication/entities/medication.entity';
import { Visit } from '../visit/entities/visit.entity';
import { CreateMedicationStockLogDto } from './dto/create-medication-stock-log.dto';
import { UpdateMedicationStockLogDto } from './dto/update-medication-stock-log.dto';

@Injectable()
export class MedicationStockLogService {
  constructor(
    @InjectRepository(Medication)
    private readonly medicationRepository: Repository<Medication>,
    @InjectRepository(MedicationStockLog)
    private readonly medicationStockLogRepository: Repository<MedicationStockLog>,
  ) {}

  async create(
    createMedicationStockLogDto: CreateMedicationStockLogDto,
  ): Promise<MedicationStockLog> {
    const log = this.medicationStockLogRepository.create(
      createMedicationStockLogDto,
    );
    return this.medicationStockLogRepository.save(log);
  }

  async update(
    id: number,
    updateMedicationStockLogDto: UpdateMedicationStockLogDto,
  ): Promise<MedicationStockLog> {
    const log = await this.medicationStockLogRepository.preload({
      id,
      ...updateMedicationStockLogDto,
    });
    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }
    return this.medicationStockLogRepository.save(log);
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.medicationStockLogRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }
    return { message: `Log with ID ${id} successfully deleted` };
  }

  async createLog(
    medication: Medication,
    visit: Visit,
    changeType: 'INCREASE' | 'DECREASE',
    quantityChanged: number,
  ): Promise<void> {
    const log = this.medicationStockLogRepository.create({
      medication,
      visit,
      changeType,
      quantityChanged,
      previousStock:
        medication.stockQuantity +
        (changeType === 'DECREASE' ? quantityChanged : -quantityChanged),
      newStock: medication.stockQuantity,
    });
    await this.medicationStockLogRepository.save(log);
  }

  async findAll(): Promise<MedicationStockLog[]> {
    return this.medicationStockLogRepository.find({
      relations: ['medication', 'visit'],
    });
  }

  async findOne(id: number): Promise<MedicationStockLog> {
    const log = await this.medicationStockLogRepository.findOne({
      where: { id },
      relations: ['medication', 'visit'],
    });
    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }
    return log;
  }
}
