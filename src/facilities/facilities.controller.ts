import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Post()
  async create(@Body() createFacilityDto: CreateFacilityDto) {
    return this.facilitiesService.create(createFacilityDto);
  }

  @Get()
  async findAll() {
    return this.facilitiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.facilitiesService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFacilityDto: UpdateFacilityDto,
  ) {
    return this.facilitiesService.update(+id, updateFacilityDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.facilitiesService.remove(+id);
  }

  @Post('import')
  async importFacilities(): Promise<string> {
    await this.facilitiesService.importFacilities();
    return 'Медичні заклади успішно імпортовано';
  }
}
