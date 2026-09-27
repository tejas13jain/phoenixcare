import ExcelJS from 'exceljs';

const BRAND_TEAL = 'FF0F6E6A';
const BRAND_OFFWHITE = 'FFF7FAFA';
const BRAND_CHARCOAL = 'FF1E2A32';

// Builds a branded .xlsx workbook: a title/subtitle banner above the data table, a styled
// header row, auto-sized columns, frozen header, and a generation timestamp footer note.
// `sheets`: [{ name, title, subtitle, columns: [{ header, key, width }], rows: [{...}] }]
export function buildWorkbook(sheets) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PhoenixCare';
  workbook.created = new Date();

  for (const sheetDef of sheets) {
    const sheet = workbook.addWorksheet(sheetDef.name, {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    const colCount = sheetDef.columns.length;

    sheet.mergeCells(1, 1, 1, colCount);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = 'PhoenixCare — Rise stronger, every day.';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 26;
    for (let c = 1; c <= colCount; c += 1) {
      sheet.getCell(1, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } };
    }

    sheet.mergeCells(2, 1, 2, colCount);
    const subtitleCell = sheet.getCell(2, 1);
    subtitleCell.value = `${sheetDef.title}${sheetDef.subtitle ? ` — ${sheetDef.subtitle}` : ''}`;
    subtitleCell.font = { bold: true, size: 11, color: { argb: BRAND_CHARCOAL } };
    for (let c = 1; c <= colCount; c += 1) {
      sheet.getCell(2, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_OFFWHITE } };
    }

    sheet.mergeCells(3, 1, 3, colCount);
    sheet.getCell(3, 1).value = `Generated ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`;
    sheet.getCell(3, 1).font = { italic: true, size: 9, color: { argb: 'FF445866' } };

    sheet.getRow(4).values = sheetDef.columns.map((c) => c.header);
    sheet.getRow(4).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_TEAL } };
      cell.alignment = { vertical: 'middle' };
    });

    sheetDef.columns.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width || 18;
    });

    for (const row of sheetDef.rows) {
      const values = sheetDef.columns.map((c) => row[c.key] ?? '');
      sheet.addRow(values);
    }

    sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: colCount } };
  }

  return workbook;
}

export async function sendWorkbook(res, workbook, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}
