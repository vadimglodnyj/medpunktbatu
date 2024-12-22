import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { VisitService } from './visit.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { FacilitiesService } from '../facilities/facilities.service';
import { Facility } from '../facilities/entities/facility.entity';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleEnum } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visit')
export class VisitController {
  constructor(
    private readonly visitService: VisitService,
    private readonly FacilitiesService: FacilitiesService,
  ) {}

  // Створення одного візиту (медикаменти та медіафайли необов'язкові)
  @Post()
  async createVisit(@Body() createVisitDto: CreateVisitDto) {
    return this.visitService.createVisitWithOptionalMedications(createVisitDto);
  }

  // Створення кількох візитів разом із медикаментами
  @Post('bulk-with-medications')
  async addVisitsWithMedications(
    @Body()
    visitData: {
      patientId: number;
      visits: Omit<CreateVisitDto, 'patientId'>[];
    }[],
  ): Promise<void> {
    await this.visitService.createBulkVisits(visitData);
  }

  // Отримання списку візитів із фільтрами
  @Get()
  async getAllVisits(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('treatmentType') treatmentType?: string,
    @Query('facilityId') facilityId?: number,
  ) {
    return this.visitService.getFilteredVisits({
      startDate,
      endDate,
      treatmentType,
      facilityId, // Передаємо facilityId
    });
  }

  @Get('/autocomplete')
  async getFacilityAutocomplete(
    @Query('query') query: string,
  ): Promise<Facility[]> {
    return this.FacilitiesService.getFacilityAutocomplete(query);
  }

  // Отримання візиту за ID
  @Get(':id')
  async getVisitById(@Param('id') id: number) {
    return this.visitService.getVisitById(id);
  }

  // Оновлення візиту
  @Put(':id')
  async updateVisit(
    @Param('id') id: number,
    @Body() updateVisitDto: Partial<CreateVisitDto>,
  ) {
    return this.visitService.updateVisit(id, updateVisitDto);
  }

  // Видалення візиту
  @Delete(':id')
  @Roles(RoleEnum.Admin, RoleEnum.ChiefMedic)
  async deleteVisit(@Param('id') id: number) {
    return this.visitService.deleteVisit(id);
  }
}
