const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const path = require('path');

(async () => {
  const src = path.resolve('data/medicine/medicine_inventory_source_2026-02-19.xlsx');
  const out = path.resolve('exports/medicine-print-range-split-7.5cm.xlsx');

  const srcWb = XLSX.readFile(src);
  const srcWs = srcWb.Sheets[srcWb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(srcWs, { defval: '' });

  const dataRows = rows
    .map((row) => ({
      code: String(row['약품코드'] ?? '').trim(),
      name: String(row['약품명'] ?? '').trim(),
      noRaw: String(row['번호'] ?? '').trim(),
      exp: String(row['유효기간'] ?? '').trim(),
      no: Number(String(row['번호'] ?? '').trim())
    }))
    .filter((r) => r.code || r.name || r.noRaw)
    .filter((r) => Number.isFinite(r.no))
    .sort((a, b) => a.no - b.no);

  const wb = new ExcelJS.Workbook();

  function setupSheet(ws) {
    ws.pageSetup = {
      paperSize: 9,
      orientation: 'portrait',
      margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
      scale: 100,
      fitToPage: false,
      horizontalCentered: false,
      printTitlesRow: '1:1'
    };

    // 7.5cm 폭 근사
    ws.columns = [
      { header: '번호', key: 'no', width: 4 },
      { header: '약품명', key: 'name', width: 14 },
      { header: '약품코드', key: 'code', width: 6 },
      { header: '유효기간', key: 'exp', width: 6 }
    ];

    ws.getRow(1).height = 20;
    ws.getRow(1).eachCell((cell) => {
      cell.font = { name: '맑은 고딕', size: 9, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
  }

  function styleDataRows(ws, startRow, endRow) {
    for (let r = startRow; r <= endRow; r++) {
      const row = ws.getRow(r);
      row.height = 18;
      for (let c = 1; c <= 4; c++) {
        const cell = row.getCell(c);
        cell.font = { name: '맑은 고딕', size: 8.5 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      }
    }
  }

  for (let start = 1; start <= 300; start += 60) {
    const end = start + 59;
    const set = dataRows.filter((r) => r.no >= start && r.no <= end);
    if (!set.length) continue;

    const ws = wb.addWorksheet(`${start}-${end}`);
    setupSheet(ws);

    for (const r of set) {
      ws.addRow({ code: r.code, name: r.name, no: r.noRaw, exp: r.exp });
    }

    styleDataRows(ws, 2, ws.rowCount);
    ws.pageSetup.printArea = `A1:D${ws.rowCount}`;
  }

  await wb.xlsx.writeFile(out);
  console.log(out);
})();
