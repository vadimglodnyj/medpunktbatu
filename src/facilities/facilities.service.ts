import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from './entities/facility.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { Like } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
  ) {}

  async create(createFacilityDto: CreateFacilityDto): Promise<Facility> {
    const facility = this.facilityRepository.create(createFacilityDto);
    return this.facilityRepository.save(facility);
  }

  async findAll(): Promise<Facility[]> {
    return this.facilityRepository.find();
  }

  async findOne(id: number): Promise<Facility> {
    const facility = await this.facilityRepository.findOne({
      where: { id }, // Задаємо умови для пошуку
    });
    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found.`);
    }
    return facility;
  }

  async update(
    id: number,
    updateFacilityDto: UpdateFacilityDto,
  ): Promise<Facility> {
    const facility = await this.findOne(id);
    Object.assign(facility, updateFacilityDto);
    return this.facilityRepository.save(facility);
  }

  async remove(id: number): Promise<void> {
    const result = await this.facilityRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Facility with ID ${id} not found.`);
    }
  }

  async importFacilities(): Promise<void> {
    const filePath = path.resolve(__dirname, 'facilities_DB.json');

    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл не знайдено за шляхом: ${filePath}`);
    }

    const facilitiesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!Array.isArray(facilitiesData)) {
      throw new Error('Невірний формат даних у JSON-файлі');
    }

    // Відфільтровуємо тільки потрібні властивості (name)
    const facilities: Facility[] = facilitiesData.map((data) => {
      return this.facilityRepository.create({
        name: data.name, // Використовуємо тільки поле name
      });
    });

    console.log('Імпортовані дані:', facilities);

    await this.facilityRepository.save(facilities);
  }

  async getFacilityAutocomplete(query: string): Promise<Facility[]> {
    return this.facilityRepository.find({
      where: { name: Like(`%${query}%`) },
      take: 10, // Повернути не більше 10 результатів
    });
  }
}
