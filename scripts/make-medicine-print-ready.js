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
    { header: '약품코드', key: 'code', width: 11 },
    { header: '약품명', key: 'name', width: 28 },
    { header: '번호', key: 'no', width: 7 },
    { header: '유효기간', key: 'exp', width: 11 }
  ];

  // 번호 기준 정렬 후 30행 단위로 헤더 반복(사진 출력 포맷 유사)
  const dataRows = rows
    .map((row) => ({
      code: String(row['약품코드'] ?? '').trim(),
      name: String(row['약품명'] ?? '').trim(),
      no: String(row['번호'] ?? '').trim(),
      exp: String(row['유효기간'] ?? '').trim()
    }))
    .filter((r) => r.code || r.name || r.no)
    .sort((a, b) => Number(a.no || 0) - Number(b.no || 0));

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

  ws.eachRow((row, rowNumber) => {
    const isHeader = ['약품코드', '약품명', '번호', '유효기간'].includes(String(row.getCell(1).value || ''))
      && String(row.getCell(2).value || '') === '약품명';
    row.height = isHeader ? 24 : 22;
    row.eachCell((cell) => {
      cell.font = { name: '맑은 고딕', size: isHeader ? 11 : 10.5, bold: isHeader };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  ws.pageSetup.printArea = `A1:D${lastRow}`;

  await outWb.xlsx.writeFile(out);
  console.log(out);
})();
