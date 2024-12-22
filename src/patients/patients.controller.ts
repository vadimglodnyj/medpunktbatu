import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientQueryDto } from './dto/patient-query.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleEnum } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати список пацієнтів' })
  @ApiResponse({
    status: 200,
    description: 'Список пацієнтів успішно отримано.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Некоректний запит. Можливі причини: неправильні параметри фільтрації, пагінації або сортування.',
  })
  async findAll(
    @Query() query: PatientQueryDto,
  ): Promise<{ data: Patient[]; total: number; totalPages: number }> {
    const { data, total } = await this.patientsService.findAll(query);
    return {
      data,
      total,
      totalPages: Math.ceil(total / (query.limit || 10)),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати пацієнта за ID' })
  @ApiResponse({ status: 200, description: 'Пацієнт успішно знайдений.' })
  @ApiResponse({
    status: 404,
    description:
      'Пацієнт із вказаним ID не знайдений у базі даних. Перевірте правильність ID і спробуйте ще раз.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Patient> {
    return this.patientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Створити нового пацієнта' })
  @ApiResponse({ status: 201, description: 'Пацієнт успішно створений.' })
  @ApiResponse({
    status: 400,
    description: `
      Некоректні дані для створення пацієнта. 
      Переконайтеся, що:
      - Поле "name" є обов'язковим і має тип рядка.
      - Поле "phone" має формат +380XXXXXXXXX.
      - Поле "birthDate" має формат YYYY-MM-DD.
    `,
  })
  async create(
    @Body() patientData: Partial<CreatePatientDto>,
  ): Promise<Patient> {
    const dto = new CreatePatientDto(patientData);
    return this.patientsService.create(dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Створити кількох пацієнтів' })
  @ApiResponse({ status: 201, description: 'Пацієнти успішно створені.' })
  @ApiResponse({
    status: 400,
    description: 'Некоректні дані для створення пацієнтів.',
  })
  async createPatients(
    @Body() patients: CreatePatientDto[],
  ): Promise<Patient[]> {
    const dtos = patients.map((data) => new CreatePatientDto(data));
    return this.patientsService.createMany(dtos);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Оновити дані пацієнта' })
  @ApiResponse({ status: 200, description: 'Дані пацієнта успішно оновлено.' })
  @ApiResponse({
    status: 404,
    description: 'Пацієнт із вказаним ID не знайдений. Оновлення неможливе.',
  })
  @ApiResponse({
    status: 400,
    description: `
      Некоректні дані для оновлення пацієнта. 
      Перевірте правильність введених значень і повторіть запит. 
      Наприклад:
      - Поле "phone" має формат +380XXXXXXXXX.
      - Поле "birthDate" має формат YYYY-MM-DD.
    `,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() patientData: Partial<UpdatePatientDto>,
  ): Promise<Patient> {
    const dto = new UpdatePatientDto(patientData);
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleEnum.Admin, RoleEnum.ChiefMedic)
  @ApiOperation({ summary: 'Видалити пацієнта' })
  @ApiResponse({ status: 200, description: 'Пацієнт успішно видалений.' })
  @ApiResponse({ status: 404, description: 'Пацієнт не знайдений.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.patientsService.remove(id);
  }
}
