const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const path = require('path');

(async () => {
  const src = path.resolve('data/medicine/medicine_inventory_source_2026-02-19.xlsx');
  const out = path.resolve('exports/medicine-print-ready-v3-7.5cm.xlsx');

  const srcWb = XLSX.readFile(src);
  const firstSheetName = srcWb.SheetNames[0];
  const srcWs = srcWb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(srcWs, { defval: '' });

  const dataRows = rows
    .map((row) => ({
      code: String(row['약품코드'] ?? '').trim(),
      name: String(row['약품명'] ?? '').trim(),
      no: String(row['번호'] ?? '').trim(),
      exp: String(row['유효기간'] ?? '').trim()
    }))
    .filter((r) => r.code || r.name || r.no)
    .sort((a, b) => Number(a.no || 0) - Number(b.no || 0));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('print_ready_7.5cm', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
      horizontalCentered: false,
      fitToPage: false,
      scale: 100,
      printTitlesRow: '1:1'
    }
  });

  // 7.5cm 총 폭 기준 근사 컬럼 폭
  ws.columns = [
    { header: '약품코드', key: 'code', width: 6 },
    { header: '약품명', key: 'name', width: 14 },
    { header: '번호', key: 'no', width: 4 },
    { header: '유효기간', key: 'exp', width: 6 }
  ];

  const chunkSize = 30;
  let outRow = 1;

  function writeHeader(rowNo) {
    ws.getCell(`A${rowNo}`).value = '약품코드';
    ws.getCell(`B${rowNo}`).value = '약품명';
    ws.getCell(`C${rowNo}`).value = '번호';
    ws.getCell(`D${rowNo}`).value = '유효기간';
  }

  writeHeader(outRow);

  for (let i = 0; i < dataRows.length; i++) {
    if (i > 0 && i % chunkSize === 0) {
      ws.getRow(outRow).addPageBreak();
      outRow += 1;
      writeHeader(outRow);
    }
    outRow += 1;
    const r = dataRows[i];
    ws.getCell(`A${outRow}`).value = r.code;
    ws.getCell(`B${outRow}`).value = r.name;
    ws.getCell(`C${outRow}`).value = r.no;
    ws.getCell(`D${outRow}`).value = r.exp;
  }

  const lastRow = outRow;

  ws.eachRow((row) => {
    const isHeader = String(row.getCell(1).value || '') === '약품코드';
    row.height = isHeader ? 20 : 18;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: '맑은 고딕', size: isHeader ? 9 : 8.5, bold: isHeader };
      const align = colNumber === 2 ? 'center' : 'center';
      cell.alignment = { vertical: 'middle', horizontal: align, wrapText: false };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  ws.pageSetup.printArea = `A1:D${lastRow}`;
  await wb.xlsx.writeFile(out);
  console.log(out);
})();
