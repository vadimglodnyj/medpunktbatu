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
import { AuthModule } from './auth/auth.module';
import { LogMiddleware } from './log.middleware';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Доступ до змінних середовища глобальний
    }),
    CacheModule.register({
      ttl: 60 * 5, // Час життя кешу: 5 хвилин
      max: 100, // Максимальна кількість елементів у кеші
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'), // Шлях до вашої папки "static"
      serveRoot: '/static', // URL-префікс для обслуговування статичних файлів
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10), // Виправлено тут
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'glodny',
        database: configService.get<string>('DB_NAME') || 'medclinic_db',
        autoLoadEntities: true,
        synchronize: true, // Не використовуйте synchronize: true в продакшн
      }),
      inject: [ConfigService],
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
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    // Цю логіку тепер переносимо до UsersService
    // Тому можна видалити цей метод або залишити його пустим
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes('*'); // Застосовуємо middleware для всіх маршрутів
  }
}
