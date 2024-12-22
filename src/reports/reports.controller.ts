import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

interface ReportQueryParams {
  reportDate: string;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Ендпоінт для генерації щоденного звіту
  @Get('daily')
  async generateDailyReport(
    @Query() query: ReportQueryParams,
    @Res() res: Response,
  ) {
    try {
      const { reportDate } = query;

      if (!reportDate) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Parameter "reportDate" is required.' });
      }

      // Тестові дані на час реалізації
      const testVisits = [
        {
          id: 1,
          name: 'Петров Іван Іванович',
          startDate: '2024-12-01',
          endDate: '2024-12-21',
          medications: [
            { shortName: 'Ібупрофен', totalQuantity: 10, unit: 'шт.' },
            { shortName: 'Амброксол', totalQuantity: 5, unit: 'уп.' },
          ],
        },
        {
          id: 2,
          name: 'Сидоренко Олег Миколайович',
          startDate: '2024-12-10',
          endDate: '2024-12-20',
          medications: [
            { shortName: 'Парацетамол', totalQuantity: 12, unit: 'шт.' },
          ],
        },
      ];

      const generatedFiles = await this.reportsService.generateDailyReport(
        testVisits,
        reportDate,
      );

      return res.status(HttpStatus.OK).json({
        message: 'Reports successfully generated.',
        files: generatedFiles,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Failed to generate reports.' });
    }
  }
}
