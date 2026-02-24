const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const path = require('path');

(async () => {
  const src = path.resolve('data/medicine/medicine_inventory_source_2026-02-19.xlsx');
  const out = path.resolve('exports/medicine-print-ready.xlsx');

  const srcWb = XLSX.readFile(src);
  const firstSheetName = srcWb.SheetNames[0];
  const srcWs = srcWb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(srcWs, { defval: '' });

  const required = ['약품코드', '약품명', '번호', '유효기간'];
  for (const key of required) {
    if (!(rows[0] && Object.prototype.hasOwnProperty.call(rows[0], key))) {
      throw new Error(`원본 헤더 누락: ${key}`);
    }
  }

  const outWb = new ExcelJS.Workbook();
  const ws = outWb.addWorksheet('print_ready', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
      horizontalCentered: true,
      printTitlesRow: '1:1'
    }
  });

  ws.columns = [
    { header: '약품코드', key: 'code', width: 12 },
    { header: '약품명', key: 'name', width: 30 },
    { header: '번호', key: 'no', width: 8 },
    { header: '유효기간', key: 'exp', width: 12 }
  ];

  for (const row of rows) {
    const code = String(row['약품코드'] ?? '').trim();
    const name = String(row['약품명'] ?? '').trim();
    const no = String(row['번호'] ?? '').trim();
    const exp = String(row['유효기간'] ?? '').trim();
    if (!code && !name && !no) continue;
    ws.addRow({ code, name, no, exp });
  }

  ws.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 28 : 24;
    row.eachCell((cell) => {
      cell.font = { name: '맑은 고딕', size: 11, bold: rowNumber === 1 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];

  await outWb.xlsx.writeFile(out);
  console.log(out);
})();
