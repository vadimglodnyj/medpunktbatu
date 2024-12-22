import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';

interface Medication {
  shortName: string;
  totalQuantity: number;
  unit: string;
}

interface Visit {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  medications: Medication[];
}

@Injectable()
export class ReportsService {
  private generateUniqueReportNumber(
    patientCount: number,
    reportDate: string,
  ): string {
    const reportBatch = Math.floor(patientCount / 21);
    return `${reportBatch}_${reportDate.replace(/\./g, '')}`;
  }

  // Розподіл медикаментів
  private distributeEvenly(
    total: number,
    days: number,
    unit: string,
  ): number[] {
    const result = Array(days).fill(0);
    if (['шт.', 'фл.', 'туб.', 'пар.'].includes(unit)) {
      const daily = Math.floor(total / days);
      for (let i = 0; i < total; i++) {
        result[i % days] += 1;
      }
    } else {
      let remaining = total;
      for (let i = 0; i < days; i++) {
        result[i] = Math.floor((remaining / (days - i)) * 10) / 10;
        remaining -= result[i];
      }
    }
    return result;
  }

  async generateDailyReport(
    visits: Visit[],
    reportDate: string,
  ): Promise<string[]> {
    const generatedFiles: string[] = [];
    const reportNumber = this.generateUniqueReportNumber(
      visits.length,
      reportDate,
    );
    const outputDir = path.resolve(__dirname, '../../reports');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let batch = 0; batch < Math.ceil(visits.length / 21); batch++) {
      const workbook = new ExcelJS.Workbook();
      const templatePath = path.resolve(
        __dirname,
        '../templates/template.xlsx',
      );
      await workbook.xlsx.readFile(templatePath);

      const worksheet = workbook.getWorksheet(1);

      // **Перевірка, чи завантажився аркуш**
      if (!worksheet) {
        throw new Error(
          `Worksheet not found in template at ${templatePath}. Check the template file.`,
        );
      }

      const startRow = 7;
      const patientsBatch = visits.slice(batch * 21, (batch + 1) * 21);
      let currentRow = startRow;

      patientsBatch.forEach((visit) => {
        const start = new Date(visit.startDate);
        const end = new Date(visit.endDate);
        const report = new Date(reportDate);
        const days = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1,
        );

        worksheet.getCell(`A${currentRow}`).value = visit.id;
        worksheet.getCell(`B${currentRow}`).value = `е-амб № ${visit.id}`;
        worksheet.getCell(`C${currentRow}`).value = visit.name;

        visit.medications.forEach((med, index) => {
          const dailyDoses = this.distributeEvenly(
            med.totalQuantity,
            days,
            med.unit,
          );
          const dayIndex = Math.floor(
            (report.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (dayIndex >= 0 && dayIndex < dailyDoses.length) {
            const column = String.fromCharCode(68 + index);
            worksheet.getCell(`${column}${currentRow}`).value =
              dailyDoses[dayIndex] > 0 ? dailyDoses[dayIndex] : '';
          }
        });
        currentRow++;
      });

      const outputFile = path.join(
        outputDir,
        `report_${reportNumber}_${batch + 1}.xlsx`,
      );
      await workbook.xlsx.writeFile(outputFile);
      generatedFiles.push(outputFile);
    }
    return generatedFiles;
  }
}
