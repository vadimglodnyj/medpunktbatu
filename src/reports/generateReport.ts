import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';

interface Medication {
  shortName: string;
  totalQuantity: number; // Загальна кількість на весь період
  unit: string;
}

interface Visit {
  id: number;
  name: string;
  startDate: string; // Початок лікування
  endDate: string; // Кінець лікування
  medications: Medication[];
}

interface PreparedData {
  patientId: number;
  patientName: string;
  medications: { [key: string]: number }; // Назва медикаменту → кількість на день
}

// **Розподіл поштучних медикаментів**
function distributeUnits(total: number, days: number): number[] {
  const result = Array(days).fill(0);
  let remaining = total;

  if (total <= days) {
    // Розподіл по 1 на день, поки не закінчиться кількість
    for (let i = 0; i < total; i++) {
      result[i] = 1;
    }
  } else {
    // Рівномірний розподіл з округленням
    const base = Math.floor(total / days); // Базова кількість на день
    let extra = total % days; // Залишок для додаткового розподілу

    for (let i = 0; i < days; i++) {
      result[i] = base;
      if (extra > 0) {
        result[i] += 1; // Додаємо 1, щоб розподілити залишок
        extra--;
      }
    }
  }

  return result;
}

// **Розподіл для упаковок (уп.)**
function distributeEvenly(total: number, days: number): number[] {
  const result = Array(days).fill(0);
  let remaining = total;

  for (let i = 0; i < days; i++) {
    if (i === days - 1) {
      // Останній день отримує залишок
      result[i] = Math.round(remaining * 10) / 10;
    } else {
      result[i] = Math.floor((remaining / (days - i)) * 10) / 10;
    }
    remaining -= result[i];
  }
  return result;
}

// **Формування даних зі звіту**
function prepareReportData(
  visits: Visit[],
  reportDate: string,
): PreparedData[] {
  const result: PreparedData[] = [];

  console.log(`--- Генерація даних на дату ${reportDate} ---`);

  visits.forEach((visit) => {
    const start = new Date(visit.startDate);
    const end = new Date(visit.endDate);
    const report = new Date(reportDate);

    if (start <= report && end >= report) {
      const totalDays = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1,
      );

      const medications: { [key: string]: number } = {};

      visit.medications.forEach((med) => {
        let dailyDoses: number[];

        // Вибір алгоритму розподілу
        if (['шт.', 'фл.', 'туб.', 'пара.'].includes(med.unit)) {
          dailyDoses = distributeUnits(med.totalQuantity, totalDays);
        } else {
          dailyDoses = distributeEvenly(med.totalQuantity, totalDays);
        }

        const dayIndex = Math.floor(
          (report.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (dailyDoses[dayIndex] > 0) {
          medications[med.shortName] = dailyDoses[dayIndex];
        }

        console.log(
          `Пацієнт: ${visit.name}, Медикамент: ${med.shortName}, ` +
            `Розподіл: ${dailyDoses}, Значення на ${reportDate}: ${dailyDoses[dayIndex]}`,
        );
      });

      if (Object.keys(medications).length > 0) {
        result.push({
          patientId: visit.id,
          patientName: convertToInitials(visit.name),
          medications,
        });
      }
    }
  });

  return result;
}

function formatDateToUkrainian(dateString: string): string {
  const monthNames = [
    'січня',
    'лютого',
    'березня',
    'квітня',
    'травня',
    'червня',
    'липня',
    'серпня',
    'вересня',
    'жовтня',
    'листопада',
    'грудня',
  ];

  const date = new Date(dateString);
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

async function fillExcelReport(
  preparedData: PreparedData[],
  reportDate: string,
) {
  try {
    const templatePath = path.resolve(__dirname, '../templates/template.xlsx');
    const outputDir = path.resolve(__dirname, '../../dist/generated');

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const patientsPerFile = 21; // Ліміт пацієнтів на файл
    const totalFiles = Math.ceil(preparedData.length / patientsPerFile);

    for (let fileIndex = 0; fileIndex < totalFiles; fileIndex++) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) throw new Error('Worksheet could not be loaded');

      // Номер відомості
      const formattedDate = formatDateToUkrainian(reportDate);
      const reportNumber = `${fileIndex}_${reportDate.replace(/-/g, '')}`;

      console.log(`--- Генерація звіту ${reportNumber} ---`);

      // Замінюємо плейсхолдери у заголовках
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (typeof cell.value === 'string') {
            cell.value = cell.value.replace('{{дата}}', formattedDate);
            cell.value = cell.value.replace(
              '{{номер_відомості}}',
              reportNumber,
            );
          }
        });
      });

      // Визначаємо унікальні медикаменти для всіх пацієнтів у файлі
      const groupData = preparedData.slice(
        fileIndex * patientsPerFile,
        (fileIndex + 1) * patientsPerFile,
      );

      const allMedications = Array.from(
        new Set(groupData.flatMap((data) => Object.keys(data.medications))),
      );

      // Заповнюємо назви медикаментів у рядок 3 та одиниці виміру у рядок 5
      allMedications.forEach((medName, i) => {
        const column = String.fromCharCode(68 + i);
        worksheet.getCell(`${column}3`).value = medName;

        const unit = groupData
          .flatMap((data) => Object.keys(data.medications))
          .filter((name) => name === medName)
          .map(() => {
            const firstVisitWithMed = testVisits.find((visit) =>
              visit.medications.some((med) => med.shortName === medName),
            );
            return (
              firstVisitWithMed?.medications.find(
                (med) => med.shortName === medName,
              )?.unit || ''
            );
          })[0];

        worksheet.getCell(`${column}5`).value = unit;
      });

      // Заповнення даних по пацієнтах
      let currentRow = 7;
      groupData.forEach((data, index) => {
        worksheet.getCell(`A${currentRow}`).value = index + 1; // № п/п
        worksheet.getCell(`B${currentRow}`).value = `е-амб № ${data.patientId}`;
        worksheet.getCell(`C${currentRow}`).value = data.patientName;

        allMedications.forEach((medName, i) => {
          const column = String.fromCharCode(68 + i);
          const value = data.medications[medName];
          if (value !== undefined && value !== 0) {
            worksheet.getCell(`${column}${currentRow}`).value = value;
          }
        });

        currentRow++;
      });

      // Збереження файлу
      const outputFile = path.join(
        outputDir,
        `daily_report_${reportNumber}.xlsx`,
      );
      await workbook.xlsx.writeFile(outputFile);
      console.log(`Report successfully generated: ${outputFile}`);
    }
  } catch (error) {
    console.error('Error generating report:', error);
  }
}

function convertToInitials(fullName: string): string {
  const [lastName, firstName, middleName] = fullName.split(' ');
  const initials = `${firstName?.charAt(0) || ''}. ${middleName?.charAt(0) || ''}.`;
  return `${lastName} ${initials}`;
}

// Тестові дані
// const testVisits: Visit[] = [
//   {
//     id: 1,
//     name: 'Сидоров Андрій Іванович',
//     startDate: '2024-12-13',
//     endDate: '2024-12-17',
//     medications: [
//       { shortName: 'Ібупрофен', totalQuantity: 2, unit: 'уп.' },
//       { shortName: 'Диклофенак', totalQuantity: 1, unit: 'уп.' },
//       { shortName: 'Шприци', totalQuantity: 10, unit: 'шт.' },
//     ],
//   },
//   {
//     id: 2,
//     name: 'Гончаров Олексій Іванович',
//     startDate: '2024-12-12',
//     endDate: '2024-12-17',
//     medications: [
//       { shortName: 'Амброксол', totalQuantity: 1, unit: 'уп.' },
//       { shortName: 'Серветки спиртові', totalQuantity: 10, unit: 'шт.' },
//       { shortName: 'Шприци', totalQuantity: 5, unit: 'шт.' },
//     ],
//   },
//   {
//     id: 3,
//     name: 'Коваленко Ірина Петрівна',
//     startDate: '2024-12-15',
//     endDate: '2024-12-20',
//     medications: [
//       { shortName: 'Амброксол', totalQuantity: 1, unit: 'уп.' },
//       { shortName: 'Шприци', totalQuantity: 4, unit: 'шт.' },
//       { shortName: 'Парацетамол', totalQuantity: 2, unit: 'уп.' },
//     ],
//   },
//   {
//     id: 4,
//     name: 'Петренко Василь Степанович',
//     startDate: '2024-12-14',
//     endDate: '2024-12-17',
//     medications: [
//       { shortName: 'Ібупрофен', totalQuantity: 1, unit: 'уп.' },
//       { shortName: 'Диклофенак', totalQuantity: 0.5, unit: 'уп.' },
//       { shortName: 'Фармазолін', totalQuantity: 2, unit: 'фл.' },
//     ],
//   },
//   {
//     id: 5,
//     name: 'Захарова Ольга Михайлівна',
//     startDate: '2024-12-16',
//     endDate: '2024-12-18',
//     medications: [
//       { shortName: 'Парацетамол', totalQuantity: 1, unit: 'уп.' },
//       { shortName: 'Серветки спиртові', totalQuantity: 6, unit: 'шт.' },
//     ],
//   },
//   {
//     id: 6,
//     name: 'Мельник Андрій Павлович',
//     startDate: '2024-12-17',
//     endDate: '2024-12-23',
//     medications: [
//       { shortName: 'Шприци', totalQuantity: 6, unit: 'шт.' },
//       { shortName: 'Фармазолін', totalQuantity: 1, unit: 'фл.' },
//       { shortName: 'Диклофенак', totalQuantity: 0.5, unit: 'уп.' },
//     ],
//   },
//   {
//     id: 7,
//     name: 'Іваненко Сергій Петрович',
//     startDate: '2024-12-10',
//     endDate: '2024-12-17',
//     medications: [
//       { shortName: 'Ібупрофен', totalQuantity: 2, unit: 'уп.' },
//       { shortName: 'Фармазолін', totalQuantity: 3, unit: 'фл.' },
//     ],
//   },
//   {
//     id: 8,
//     name: 'Ткаченко Оксана Володимирівна',
//     startDate: '2024-12-13',
//     endDate: '2024-12-18',
//     medications: [
//       { shortName: 'Серветки спиртові', totalQuantity: 8, unit: 'шт.' },
//       { shortName: 'Шприци', totalQuantity: 2, unit: 'шт.' },
//     ],
//   },
//   {
//     id: 9,
//     name: 'Поліщук Антон Михайлович',
//     startDate: '2024-12-17',
//     endDate: '2024-12-19',
//     medications: [
//       { shortName: 'Фармазолін', totalQuantity: 1, unit: 'фл.' },
//       { shortName: 'Шприци', totalQuantity: 2, unit: 'шт.' },
//     ],
//   },
//   {
//     id: 10,
//     name: 'Бойко Анастасія Ігорівна',
//     startDate: '2024-12-15',
//     endDate: '2024-12-17',
//     medications: [
//       { shortName: 'Амброксол', totalQuantity: 0.5, unit: 'уп.' },
//       { shortName: 'Серветки спиртові', totalQuantity: 4, unit: 'шт.' },
//     ],
//   },
// ];

const testVisits: Visit[] = [
  ...Array.from({ length: 44 }, (_, i) => ({
    id: i + 1,
    name: `Пацієнт ${i + 1} ПІБ`,
    startDate: '2024-12-15',
    endDate: '2024-12-17',
    medications: [
      {
        shortName: 'Амброксол',
        totalQuantity: 1,
        unit: 'уп.',
      },
      {
        shortName: 'Шприци',
        totalQuantity: 5,
        unit: 'шт.',
      },
      {
        shortName: 'Серветки спиртові',
        totalQuantity: 10,
        unit: 'шт.',
      },
    ],
  })),
];

const reportDate = '2024-12-17';
const preparedData = prepareReportData(testVisits, reportDate);
fillExcelReport(preparedData, reportDate);
