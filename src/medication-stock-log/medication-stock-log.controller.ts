import {
  Controller,
  Get,
  Param,
  Body,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import { MedicationStockLogService } from './medication-stock-log.service';
import { CreateMedicationStockLogDto } from './dto/create-medication-stock-log.dto';
import { UpdateMedicationStockLogDto } from './dto/update-medication-stock-log.dto';

@Controller('medication-stock-log')
export class MedicationStockLogController {
  constructor(
    private readonly medicationStockLogService: MedicationStockLogService,
  ) {}

  @Get()
  findAll() {
    return this.medicationStockLogService.findAll(); // Викликає метод сервісу
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicationStockLogService.findOne(+id); // Отримати один запис за ID
  }

  @Post()
  create(@Body() createMedicationStockLogDto: CreateMedicationStockLogDto) {
    return this.medicationStockLogService.create(createMedicationStockLogDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMedicationStockLogDto: UpdateMedicationStockLogDto,
  ) {
    return this.medicationStockLogService.update(
      +id,
      updateMedicationStockLogDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicationStockLogService.remove(+id);
  }
}
