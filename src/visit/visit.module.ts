import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitService } from './visit.service';
import { VisitController } from './visit.controller';
import { Visit } from './entities/visit.entity';
import { MedicationUsage } from '../medication/entities/medication-usage.entity';
import { Medication } from '../medication/entities/medication.entity';
import { Patient } from '../patients/entities/patient.entity';
import { FacilitiesModule } from '../facilities/facilities.module';
import { PatientsModule } from '../patients/patients.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramService } from '../telegram/telegram.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, MedicationUsage, Medication, Patient]),
    FacilitiesModule, // Додаємо FacilitiesModule
    PatientsModule,
    ScheduleModule.forRoot(),
    CacheModule.register(), // Додаємо CacheModule
  ],
  controllers: [VisitController],
  providers: [VisitService,TelegramService],
})
export class VisitModule {}
