import * as path from 'path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';

async function generateAct(data: any[], period: string) {
  try {
    const templatePath = path.resolve(
      __dirname,
      '../templates/act_template.xlsx',
    );
    const outputDir = path.resolve(__dirname, '../../dist/generated');

    console.log('Template path:', templatePath);
    console.log('Output directory path:', outputDir);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log('Output directory created:', outputDir);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Worksheet could not be loaded');
    }

    function styleCell(cell: ExcelJS.Cell) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }

    // Функція для конвертації чисел у текст
    const numberToWords = (amount: number): string => {
      const units = [
        '',
        'одна',
        'дві',
        'три',
        'чотири',
        'п’ять',
        'шість',
        'сім',
        'вісім',
        'дев’ять',
      ];
      const teens = [
        'десять',
        'одинадцять',
        'дванадцять',
        'тринадцять',
        'чотирнадцять',
        'п’ятнадцять',
        'шістнадцять',
        'сімнадцять',
        'вісімнадцять',
        'дев’ятнадцять',
      ];
      const tens = [
        '',
        'десять',
        'двадцять',
        'тридцять',
        'сорок',
        'п’ятдесят',
        'шістдесят',
        'сімдесят',
        'вісімдесят',
        'дев’яносто',
      ];
      const thousands = ['тисяча', 'тисячі', 'тисяч'];

      const getHundreds = (num: number): string => {
        const hundreds = [
          '',
          'сто',
          'двісті',
          'триста',
          'чотириста',
          'п’ятсот',
          'шістсот',
          'сімсот',
          'вісімсот',
          'дев’ятсот',
        ];
        return hundreds[Math.floor(num / 100)];
      };

      const getTensAndUnits = (num: number): string => {
        if (num < 10) return units[num];
        if (num < 20) return teens[num - 10];
        return `${tens[Math.floor(num / 10)]} ${units[num % 10]}`.trim();
      };

      const hrn = Math.floor(amount);
      const kop = Math.round((amount - hrn) * 100);

      let result = '';
      const thousandsPart = Math.floor(hrn / 1000);
      const remainder = hrn % 1000;

      if (thousandsPart > 0) {
        result += `${getHundreds(thousandsPart)} ${units[thousandsPart]} ${thousands[thousandsPart === 1 ? 0 : thousandsPart > 1 && thousandsPart < 5 ? 1 : 2]} `;
      }

      result +=
        `${getHundreds(remainder)} ${getTensAndUnits(remainder % 100)}`.trim();

      result += ' грн.';
      if (kop > 0) {
        result += ` ${getTensAndUnits(kop)} коп.`;
      }

      return result.replace(/\s+/g, ' ').trim();
    };

    let startRow = 21;
    const totalRow = 24;
    let index = 1;
    const totalSum = data.reduce((sum, item) => sum + item.total, 0);
    const totalSumText = numberToWords(totalSum);

    // Додавання рядків даних
    if (data.length > 3) {
      worksheet.spliceRows(totalRow, 0, ...Array(data.length - 3).fill([]));
    }

    data.forEach((item) => {
      const row = worksheet.getRow(startRow);

      row.getCell(1).value = index; // № п/п
      row.getCell(3).value = item.name; // Назва медикаменту
      row.getCell(4).value = item.unit; // Одиниця виміру
      row.getCell(5).value = item.quantity; // Кількість
      row.getCell(6).value = item.pricePerUnit; // Ціна за одиницю
      row.getCell(7).value = item.total; // Сума, грн

      row.eachCell((cell) => styleCell(cell));

      startRow++;
      index++;
    });

    const summaryRow = worksheet.getRow(startRow);
    summaryRow.getCell(5).value = 'ВСЬОГО';
    summaryRow.getCell(5).font = {
      bold: true,
      name: 'Times New Roman',
      size: 11,
    };
    summaryRow.getCell(7).value = totalSum.toFixed(2);
    summaryRow.getCell(7).font = {
      bold: true,
      name: 'Times New Roman',
      size: 11,
    };
    summaryRow.eachCell((cell) => styleCell(cell));

    // Замінюємо плейсхолдери у звичайних та об'єднаних клітинках
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === 'string') {
          cell.value = cell.value.replace('{{PERIOD}}', period);
          cell.value = cell.value.replace(
            '{{TOTAL_PRICE}}',
            totalSum.toFixed(2),
          );
          cell.value = cell.value.replace(
            '{{WORDS_TOTAL_PRICE}}',
            totalSumText,
          );
        }
      });
    });

    const outputFile = path.join(
      outputDir,
      `act_${period.replace(/\./g, '_')}.xlsx`,
    );
    await workbook.xlsx.writeFile(outputFile);

    console.log(`Act successfully generated: ${outputFile}`);
  } catch (error) {
    console.error('Error generating act:', error);
  }
}

// Тестові дані
const testData = [
  {
    name: 'Диклофенак натрій 3%',
    unit: 'фл',
    quantity: 10.32,
    pricePerUnit: 50,
    total: 500,
  },
  { name: 'Шприц 5мл', unit: 'шт', quantity: 15, pricePerUnit: 20, total: 300 },
  {
    name: 'Парацетамол 500 мг',
    unit: 'уп.',
    quantity: 5.64,
    pricePerUnit: 60,
    total: 336,
  },
];

// Виклик функції для генерації акту
generateAct(testData, '01.12.2024 по 31.12.2024');
