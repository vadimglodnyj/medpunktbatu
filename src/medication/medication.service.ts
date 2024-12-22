import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Medication } from './entities/medication.entity';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { MedicationStockLog } from '../medication-stock-log/entities/medication-stock-log.entity';
import { Visit } from '../visit/entities/visit.entity';

@Injectable()
export class MedicationService {
  constructor(
    @InjectRepository(Medication)
    private readonly medicationRepository: Repository<Medication>,
    @InjectRepository(MedicationStockLog)
    private readonly medicationStockLogRepository: Repository<MedicationStockLog>,
  ) {}

  async create(createMedicationDto: CreateMedicationDto): Promise<Medication> {
    const newMedication = this.medicationRepository.create(createMedicationDto);
    return this.medicationRepository.save(newMedication);
  }

  async update(
    id: number,
    updateMedicationDto: UpdateMedicationDto,
  ): Promise<Medication> {
    await this.medicationRepository.update(id, updateMedicationDto);
    const updatedMedication = await this.medicationRepository.findOne({
      where: { id },
    });
    if (!updatedMedication) {
      throw new NotFoundException(`Medication with ID ${id} not found.`);
    }
    return updatedMedication;
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.medicationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Medication with ID ${id} not found.`);
    }
    return { message: `Medication with ID ${id} successfully deleted.` };
  }

  findAll(): Promise<Medication[]> {
    return this.medicationRepository.find();
  }

  async findOne(id: number): Promise<Medication> {
    const medication = await this.medicationRepository.findOne({
      where: { id },
    });
    if (!medication) {
      throw new NotFoundException(`Medication with ID ${id} not found.`);
    }
    return medication;
  }

  async updateStock(
    medicationId: number,
    visit: Visit,
    quantity: number,
    changeType: 'INCREASE' | 'DECREASE',
    manager: EntityManager,
  ): Promise<Medication> {
    const medication = await manager.findOne(Medication, {
      where: { id: medicationId },
    });

    if (!medication) {
      throw new BadRequestException(
        `Medication with ID ${medicationId} not found.`,
      );
    }

    if (changeType === 'DECREASE' && medication.stockQuantity < quantity) {
      throw new BadRequestException(
        `Not enough stock for medication ${medication.shortName}.`,
      );
    }

    medication.stockQuantity +=
      changeType === 'INCREASE' ? quantity : -quantity;
    await manager.save(medication);

    const log = manager.create(MedicationStockLog, {
      medication,
      visit,
      changeType,
      quantityChanged: quantity,
      previousStock:
        medication.stockQuantity +
        (changeType === 'DECREASE' ? quantity : -quantity),
      newStock: medication.stockQuantity,
    });
    await manager.save(log);

    return medication;
  }
}
