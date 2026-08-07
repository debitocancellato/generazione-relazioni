const {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  ShadingType,
  BorderStyle
} = require("docx");

const PAGE_WIDTH_DXA = 9360; // larghezza utile pagina A4 con margini standard

function formatEuro(value) {
  if (value === null || value === undefined) return "0,00";
  return Number(value).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(value) {
  if (value === null || value === undefined) return "0,00%";
  return Number(value).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

function headingCellText(text) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
    shading: { type: ShadingType.CLEAR, fill: "E8E8E8" }
  });
}

function bodyCellText(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text: String(text), bold: !!opts.bold })]
    })]
  });
}

/**
 * Costruisce una tabella generica a partire da colonne (label + width%) e righe di dati.
 * columns: [{ key, label, widthPct, align, format }]
 * rows: array di oggetti
 */
function buildTable(columns, rows) {
  const columnWidths = columns.map(c => Math.round((c.widthPct / 100) * PAGE_WIDTH_DXA));

  const headerRow = new TableRow({
    children: columns.map(c => headingCellText(c.label))
  });

  const dataRows = rows.map(row => new TableRow({
    children: columns.map((c, i) => {
      let raw = row[c.key];
      let text;
      if (c.format === "euro") text = formatEuro(raw);
      else if (c.format === "percent") text = formatPercent(raw);
      else text = raw === null || raw === undefined ? "" : String(raw);
      return bodyCellText(text, { align: c.align, bold: c.boldRow });
    })
  }));

  return new Table({
    width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths,
    rows: [headerRow, ...dataRows]
  });
}

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, text });
}

function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, text });
}

function heading3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, text });
}

function tableCaption(text) {
  return new Paragraph({ children: [new TextRun({ text, bold: true, italics: true })], spacing: { before: 200, after: 100 } });
}

function bodyText(text) {
  // Rispetta la regola docx: mai usare \n dentro un TextRun, va spezzato in Paragraph distinti
  const paragrafi = String(text).split(/\n{2,}/);
  return paragrafi.map(p => new Paragraph({ children: [new TextRun({ text: p.trim() })], spacing: { after: 200 } }));
}

function spacer() {
  return new Paragraph({ text: "" });
}

module.exports = {
  formatEuro,
  formatPercent,
  buildTable,
  heading1,
  heading2,
  heading3,
  tableCaption,
  bodyText,
  spacer,
  PAGE_WIDTH_DXA
};
