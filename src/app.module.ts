import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from './patients/patients.module';
import { VisitModule } from './visit/visit.module';
import { MedicationModule } from './medication/medication.module';
import { MedicationStockLogModule } from './medication-stock-log/medication-stock-log.module';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsModule } from './reports/reports.module';
import { MediaModule } from './media/media.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { UsersModule } from './users/users.module';
import { RoleEnum } from './users/entities/user.entity';
import { UsersService } from './users/users.service';
import { AuthModule } from './auth/auth.module';
import { LogMiddleware } from './log.middleware';
import { TelegramService } from './telegram/telegram.service';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60 * 5, // Час життя кешу: 5 хвилин
      max: 100, // Максимальна кількість елементів у кеші
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'), // Шлях до вашої папки "static"
      serveRoot: '/static', // URL-префікс для обслуговування статичних файлів
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'glodny',
      database: 'medclinic_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PatientsModule,
    VisitModule,
    MedicationModule,
    MedicationStockLogModule,
    ReportsModule,
    MediaModule,
    FacilitiesModule,
    UsersModule,
    AuthModule,
    TelegramModule,
  ],
  controllers: [AppController, ReportsController],
  providers: [AppService, ReportsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes('*'); // Застосовуємо middleware для всіх маршрутів
  }

  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    const admin = await this.usersService.findByUsername('admin');
    if (!admin) {
      console.log('Creating default admin user...');
      await this.usersService.createUser('admin', 'password', RoleEnum.Admin);
    }
  }
}
