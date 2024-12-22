import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { PatientQueryDto } from './dto/patient-query.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async findAll(
    query: PatientQueryDto,
  ): Promise<{ data: Patient[]; total: number }> {
    const {
      rank,
      serviceType,
      unit,
      additionalUnit,
      page = 1,
      limit = 10,
      orderBy = 'id',
      order = 'ASC',
    } = query;

    // Безпечні значення для limit і page
    const safeLimit = Math.min(Math.max(limit, 1), 100); // Максимум 100 записів
    const safePage = Math.max(page, 1);

    const allowedOrderByFields = ['id', 'name', 'birthDate', 'rank'];
    if (orderBy && !allowedOrderByFields.includes(orderBy)) {
      throw new BadRequestException(
        `Поле orderBy повинно бути одним із: ${allowedOrderByFields.join(', ')}`,
      );
    }

    const where: FindOptionsWhere<Patient> = {};
    if (rank) where.rank = rank;
    if (serviceType) where.serviceType = serviceType;
    if (unit) where.unit = unit;
    if (additionalUnit) where.additionalUnit = additionalUnit;

    const [data, total] = await this.patientsRepository.findAndCount({
      where,
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
      order: { [orderBy]: order },
    });

    return { data, total };
  }

  async findOne(id: number): Promise<Patient> {
    try {
      const patient = await this.patientsRepository.findOne({ where: { id } });
      if (!patient) {
        this.logger.error(`Пацієнт з ID ${id} не знайдений.`);
        throw new NotFoundException(`Пацієнт з ID ${id} не знайдений.`);
      }
      return patient;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Помилка при отриманні пацієнта з ID ${id}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Невідома помилка при отриманні пацієнта з ID ${id}`);
      }
      throw error;
    }
  }

  async create(patientData: CreatePatientDto): Promise<Patient> {
    this.logger.log(`Створення пацієнта: ${JSON.stringify(patientData)}`);

    // Перевірка унікальності телефону
    const existingPatient = await this.patientsRepository.findOne({
      where: { phone: patientData.phone },
    });
    if (existingPatient) {
      throw new BadRequestException(
        `Пацієнт із телефоном ${patientData.phone} вже існує.`,
      );
    }

    const newPatient = this.patientsRepository.create(patientData);
    return this.patientsRepository.save(newPatient);
  }

  async createPatientsBulk(
    createPatientsDto: CreatePatientDto[],
  ): Promise<Patient[]> {
    const patients = createPatientsDto.map((dto) =>
      this.patientsRepository.create(dto),
    );
    return this.patientsRepository.save(patients);
  }

  async createMany(dtos: CreatePatientDto[]): Promise<Patient[]> {
    const patients = dtos.map((dto) => this.patientsRepository.create(dto));
    return this.patientsRepository.save(patients);
  }

  async update(id: number, patientData: UpdatePatientDto): Promise<Patient> {
    this.logger.log(
      `Оновлення пацієнта ID ${id}: ${JSON.stringify(patientData)}`,
    );
    const result = await this.patientsRepository.update(id, patientData);
    if (result.affected === 0) {
      throw new NotFoundException(`Пацієнт з ID ${id} не знайдений.`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Видалення пацієнта ID ${id}`);
    const result = await this.patientsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Пацієнт з ID ${id} не знайдений.`);
    }
  }
}
