import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Visit } from './entities/visit.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { MedicationUsage } from '../medication/entities/medication-usage.entity';
import { Medication } from '../medication/entities/medication.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { VisitStatus } from './enums/visit-status.enum';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as moment from 'moment';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class VisitService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    private readonly telegramService: TelegramService,

    @InjectRepository(MedicationUsage)
    private readonly medicationUsageRepository: Repository<MedicationUsage>,

    @InjectRepository(Medication)
    private readonly medicationRepository: Repository<Medication>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache, // Додаємо кеш
  ) {}

  async updateVisit(
    id: number,
    updateVisitDto: Partial<CreateVisitDto>,
  ): Promise<Visit> {
    const visit = await this.visitRepository.findOne({ where: { id } });

    if (!visit) {
      throw new NotFoundException(`Візит із ID ${id} не знайдений`);
    }

    if (visit.status === VisitStatus.COMPLETED) {
      throw new BadRequestException(
        'Редагування завершених візитів заборонено.',
      );
    }

    Object.assign(visit, updateVisitDto);
    return this.visitRepository.save(visit);
  }

  async deleteVisit(id: number): Promise<void> {
    const result = await this.visitRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Візит із ID ${id} не знайдений`);
    }
  }

  async createVisitWithOptionalMedications(
    createVisitDto: CreateVisitDto,
  ): Promise<Visit> {
    const patient = await this.patientRepository.findOne({
      where: { id: createVisitDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Пацієнт із ID ${createVisitDto.patientId} не знайдений`,
      );
    }

    const facility = await this.facilityRepository.findOne({
      where: { id: createVisitDto.facilityId },
    });

    if (!facility) {
      throw new NotFoundException(
        `Медичний заклад із ID ${createVisitDto.facilityId} не знайдено`,
      );
    }

    // Генерація дати для callDate
    const calculatedCallDate = moment(createVisitDto.startDate)
      .add(5, 'days')
      .toDate();

    const visit = this.visitRepository.create({
      ...createVisitDto,
      patient,
      facility,
      callDate: calculatedCallDate, // Вказуємо явно
    });

    const savedVisit = await this.visitRepository.save(visit);

    if (createVisitDto.medications?.length) {
      await this.addMedications(savedVisit.id, createVisitDto.medications);
    }

    // Очищення кешу після створення
    await this.cacheManager.del('visits');

    return savedVisit;
  }

  async createBulkVisits(
    visitsData: {
      patientId: number;
      visits: Omit<CreateVisitDto, 'patientId'>[];
    }[],
  ): Promise<void> {
    for (const { patientId, visits } of visitsData) {
      const patient = await this.patientRepository.findOne({
        where: { id: patientId },
      });

      if (!patient) {
        throw new NotFoundException(`Пацієнт із ID ${patientId} не знайдений`);
      }

      for (const visitData of visits) {
        const facility = await this.facilityRepository.findOne({
          where: { id: visitData.facilityId },
        });

        if (!facility) {
          throw new NotFoundException(
            `Медичний заклад із ID ${visitData.facilityId} не знайдено`,
          );
        }

        const visit = this.visitRepository.create({
          ...visitData,
          patient,
          facility,
        });

        const savedVisit = await this.visitRepository.save(visit);

        if (visitData.medications?.length) {
          await this.addMedications(savedVisit.id, visitData.medications);
        }
      }
    }

    // Очищення кешу після масового створення
    await this.cacheManager.del('visits');
  }

  async addMedications(
    visitId: number,
    medications: { medicationId: number; quantity: number }[],
  ): Promise<MedicationUsage[]> {
    const visit = await this.visitRepository.findOne({
      where: { id: visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Візит із ID ${visitId} не знайдений`);
    }

    const usages: MedicationUsage[] = [];

    for (const { medicationId, quantity } of medications) {
      const medication = await this.medicationRepository.findOne({
        where: { id: medicationId },
      });

      if (!medication) {
        throw new NotFoundException(
          `Медикамент із ID ${medicationId} не знайдений`,
        );
      }

      if (quantity > medication.stockQuantity) {
        throw new BadRequestException(
          `Недостатньо залишків для медикаменту з ID ${medicationId}`,
        );
      }

      medication.stockQuantity -= quantity;
      await this.medicationRepository.save(medication);

      const usage = this.medicationUsageRepository.create({
        visit,
        medication,
        quantity,
      });

      usages.push(await this.medicationUsageRepository.save(usage));
    }

    return usages;
  }

  async getVisitById(id: number): Promise<Visit> {
    const visit = await this.visitRepository.findOne({
      where: { id },
      relations: [
        'patient',
        'medications',
        'medications.medication',
        'mediaFiles',
        'facility',
      ],
    });

    if (!visit) {
      throw new NotFoundException(`Візит із ID ${id} не знайдений`);
    }

    return visit;
  }

  async getFilteredVisits(filters: {
    startDate?: string;
    endDate?: string;
    treatmentType?: string;
    facilityId?: number;
  }): Promise<Visit[]> {
    // Створення унікального ключа для кешу на основі фільтрів
    const cacheKey = `getFilteredVisits_${JSON.stringify(filters)}`;

    // Перевірка, чи є дані в кеші
    const cachedVisits = await this.cacheManager.get<Visit[]>(cacheKey);
    if (cachedVisits) {
      console.log('Дані взято з кешу:', cachedVisits);
      return cachedVisits;
    }

    // Формування умов для запиту до бази даних
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.startDate = Between(
        new Date(filters.startDate),
        new Date(filters.endDate),
      );
    }

    if (filters.treatmentType) {
      where.treatmentType = filters.treatmentType;
    }

    if (filters.facilityId) {
      where.facility = { id: filters.facilityId };
    }

    // Запит до бази даних
    const visits = await this.visitRepository.find({
      where,
      relations: ['patient', 'facility'],
    });

    // Збереження результатів у кеш із часом життя 300 секунд (5 хвилин)
    await this.cacheManager.set(cacheKey, visits, 300); // TTL як окремий параметр

    console.log('Дані збережено в кеші:', visits);
    return visits;
  }

  async generatePayoutReport(month: number, year: number): Promise<string> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const visits = await this.visitRepository.find({
      where: {
        startDate: Between(startDate, endDate),
        injuryType: 'Бойова',
        treatmentType: In(['Стаціонар', 'Відпустка']),
      },
      relations: ['patient', 'mediaFiles'],
    });

    const groupedByPatient = visits.reduce(
      (acc, visit) => {
        const patientName = visit.patient.name;
        if (!acc[patientName]) acc[patientName] = [];
        acc[patientName].push(visit);
        return acc;
      },
      {} as Record<string, Visit[]>,
    );

    const folderName = `Payouts_${this.getUkrainianMonth(month)}_${year}`;
    const localPath = path.resolve(
      __dirname,
      '../../dist/generated',
      folderName,
    );

    if (!fs.existsSync(localPath)) fs.mkdirSync(localPath, { recursive: true });

    for (const [patientName, patientVisits] of Object.entries(
      groupedByPatient,
    )) {
      const patientFolder = path.join(localPath, patientName);
      if (!fs.existsSync(patientFolder)) fs.mkdirSync(patientFolder);

      patientVisits.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime(),
      );

      for (const visit of patientVisits) {
        visit.mediaFiles.forEach((file, index) => {
          const filePath = path.join(
            patientFolder,
            `${visit.startDate.toISOString().split('T')[0]}_${index}_${file.fileName}`,
          );
          fs.writeFileSync(filePath, fs.readFileSync(file.filePath));
        });

        if (!visit.hasAppendix21) {
          const placeholderPath = path.join(
            patientFolder,
            `Missing_Appendix_21.txt`,
          );
          fs.writeFileSync(
            placeholderPath,
            'Appendix 21 is missing for this visit.',
          );
        }
      }
    }

    const zipFilePath = path.join(localPath, `${folderName}.zip`);
    await this.generateZip(localPath, zipFilePath);

    return zipFilePath;
  }

  private async generateZip(
    folderPath: string,
    outputZipPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputZipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(folderPath, false);
      archive.finalize();
    });
  }

  private getUkrainianMonth(month: number): string {
    const months = [
      'Січень',
      'Лютий',
      'Березень',
      'Квітень',
      'Травень',
      'Червень',
      'Липень',
      'Серпень',
      'Вересень',
      'Жовтень',
      'Листопад',
      'Грудень',
    ];
    return months[month - 1];
  }

  async getPatientsForCall(): Promise<Visit[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Початок дня
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Кінець дня

    const visits = await this.visitRepository.find({
      where: {
        callDate: Between(startOfDay, endOfDay), // Фільтруємо візити на сьогодні
      },
      relations: ['patient', 'facility'], // Завантажуємо пов'язані дані пацієнтів і закладів
    });

    console.log('Візити для дзвінків:', visits); // Логування знайдених візитів
    return visits;
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendCallListToTelegram(): Promise<void> {
    // Отримуємо візити для дзвінків
    const visits = await this.getPatientsForCall();

    if (visits.length === 0) {
      console.log('Список для дзвінків порожній.');
      return;
    }

    const messages = visits.map((visit) => {
      const patient = visit.patient;
      const facility = visit.facility;
      return `
        👤 *Пацієнт*: ${patient.name}
        📞 *Телефон*: ${patient.phone}
        🏥 *Лікарня*: ${facility.name}
        🔗 [Оновити дані візиту](http://localhost:3000/visit/${visit.id})
      `;
    });

    try {
      for (const message of messages) {
        await this.telegramService.sendMessage(
          `📝 *Пацієнти для обзвону*\n\n${message}`,
        );
      }
      console.log('Список пацієнтів для дзвінків надіслано до Telegram.');

      // Оновлюємо callDate для кожного візиту
      for (const visit of visits) {
        visit.callDate = moment(visit.callDate).add(5, 'days').toDate(); // Додаємо 5 днів
        await this.visitRepository.save(visit); // Зберігаємо зміни в базі даних
      }
      console.log('Дати наступного дзвінка оновлено.');
    } catch (error) {
      console.error(
        'Помилка під час відправки повідомлень до Telegram:',
        error,
      );
      throw new Error('Помилка під час відправки повідомлень до Telegram.');
    }
  }

  async findVisitsMissingAppendix21(): Promise<Visit[]> {
    return this.visitRepository.find({
      where: {
        injuryType: 'Бойова',
        hasAppendix21: false,
      },
      relations: ['patient', 'facility'],
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyMissingAppendix21(): Promise<void> {
    const visits = await this.findVisitsMissingAppendix21();

    if (visits.length === 0) {
      console.log('Немає візитів з бойовим пораненням без додатку 21.');
      return;
    }

    // Формуємо повідомлення
    let message = '❗ Список візитів із бойовою травмою без додатку 21:\n\n';
    for (const visit of visits) {
      const link = `http://myFrontendSite.com/visit/${visit.id}`;
      message += `- Пацієнт: ${visit.patient.name} (ID=${visit.id})\n`;
      // Додаємо клікабельне посилання на візит (Markdown-варіант)
      message += `[Перейти до візиту](${link})\n\n`;
    }

    // Надсилаємо повідомлення у Telegram (через ваш telegramService)
    try {
      await this.telegramService.sendMessage(message, 'Markdown');
      console.log('Повідомлення про відсутні додатки 21 надіслано в Telegram.');
    } catch (error) {
      console.error('Помилка відправки Telegram:', error);
    }
  }
}
