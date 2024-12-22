import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { MedicationService } from './medication.service';
import { Medication } from './entities/medication.entity';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';

@Controller('medications')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Get()
  findAll(): Promise<Medication[]> {
    return this.medicationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Medication> {
    return this.medicationService.findOne(id);
  }

  @Post()
  create(@Body() createMedicationDto: CreateMedicationDto): Promise<Medication> {
    return this.medicationService.create(createMedicationDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMedicationDto: UpdateMedicationDto,
  ): Promise<Medication> {
    return this.medicationService.update(id, updateMedicationDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.medicationService.remove(id);
  }
}
