import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { QuotationCalculation, QuotationDraft, QuotationItem, QuotationSettings } from "../domain/models";
import { formatDate } from "../ui/format";
import { pdfMoney } from "./format";

const COLORS = {
  navy: "#172454",
  red: "#e62e3b",
  yellow: "#fff200",
  blue: "#c7d8ea",
  green: "#dcecc3",
  orange: "#f8c98f",
  peach: "#f8dec7",
  gray: "#f3f4f6",
  border: "#1f2937",
  muted: "#667085",
};

type Cell = any;

function text(value: string, options: Record<string, unknown> = {}): Record<string, unknown> {
  return { text: value || "", ...options };
}

function amount(value: string): Record<string, unknown> {
  const rounded = pdfMoney(value);
  return text(rounded === "0.00" ? "-" : rounded, { alignment: "right" });
}

function headerMetadata(quotation: QuotationDraft, settings: QuotationSettings, logoDataUrl?: string): Content {
  const metadata = {
    table: {
      widths: [70, "*"],
      body: [
        [text("Project:", { bold: true }), text(quotation.projectName)],
        [text("Location:", { bold: true }), text(quotation.projectLocation)],
        [text("Attention", { bold: true }), text(quotation.attention)],
        [text("QTE Ref", { bold: true }), text(quotation.qteNumber)],
        [text("Date", { bold: true }), text(formatDate(quotation.quoteDate))],
      ],
    },
    layout: "noBorders",
  };

  const identity = logoDataUrl
    ? { image: logoDataUrl, fit: [220, 58], alignment: "right" }
    : {
        stack: [
          text(settings.companyName || "", { bold: true, color: COLORS.navy, fontSize: 13, alignment: "right" }),
          text(settings.companyAddress || "", { color: COLORS.muted, fontSize: 7, alignment: "right", margin: [0, 3, 0, 0] }),
          text(settings.contactInformation || "", { color: COLORS.muted, fontSize: 7, alignment: "right" }),
        ],
      };

  return {
    columns: [metadata, identity],
    columnGap: 15,
    margin: [24, 18, 24, 0],
  } as unknown as Content;
}

function footer(quotation: QuotationDraft, settings: QuotationSettings, currentPage: number, pageCount: number): Content {
  return {
    columns: [
      text(settings.footerText || quotation.qteNumber, { fontSize: 7, color: COLORS.muted }),
      text(`Page ${currentPage} of ${pageCount}`, { alignment: "right", fontSize: 7, color: COLORS.muted }),
    ],
    margin: [24, 0, 24, 10],
  } as unknown as Content;
}

function pricingBlock(quotation: QuotationDraft): Content {
  const vatLabel = quotation.vatType === "VAT_INCLUSIVE" ? "VAT INCLUSIVE" : quotation.vatType === "VAT_EXCLUSIVE" ? "VAT EXCLUSIVE" : "NON-VAT";
  return {
    table: {
      widths: ["*", 110, 100, 90],
      body: [[
        text("COST", { bold: true, fontSize: 11, color: COLORS.navy }),
        text(`OVERALL FACTOR\n${quotation.overallFactor || "0.00"}`, { bold: true, alignment: "center", color: COLORS.navy }),
        text(`VAT TYPE\n${vatLabel}`, { bold: true, alignment: "center", color: COLORS.navy }),
        text(`VAT RATE\n${quotation.vatRate || "0"}%`, { bold: true, alignment: "center", color: COLORS.navy }),
      ]],
    },
    layout: {
      fillColor: () => COLORS.yellow,
      hLineColor: () => COLORS.yellow,
      vLineColor: () => COLORS.yellow,
      paddingTop: () => 5,
      paddingBottom: () => 5,
      paddingLeft: () => 7,
      paddingRight: () => 7,
    },
    margin: [0, 0, 0, 8],
  } as unknown as Content;
}

function tableHeader(includeOther: boolean): Cell[] {
  const header: Cell[] = [
    text("Item", { bold: true, alignment: "center", rowSpan: 2 }),
    text("Description", { bold: true, alignment: "center", rowSpan: 2 }),
    text("Qty", { bold: true, alignment: "center", rowSpan: 2 }),
    text("Unit", { bold: true, alignment: "center", rowSpan: 2 }),
    text("Material", { bold: true, alignment: "center", colSpan: 2 }), {},
    text("Labor", { bold: true, alignment: "center", colSpan: 2 }), {},
  ];
  if (includeOther) header.push(text("Other", { bold: true, alignment: "center", colSpan: 2 }), {});
  header.push(text(includeOther ? "Actual Total" : "Total Amount", { bold: true, alignment: "center", rowSpan: 2 }));
  return header;
}

function tableSubHeader(includeOther: boolean): Cell[] {
  const header: Cell[] = [
    {}, {}, {}, {},
    text("Unit", { bold: true, alignment: "center" }), text("Total", { bold: true, alignment: "center" }),
    text("Unit", { bold: true, alignment: "center" }), text("Total", { bold: true, alignment: "center" }),
  ];
  if (includeOther) header.push(
    text("Unit", { bold: true, alignment: "center" }),
    text("Total", { bold: true, alignment: "center" }),
  );
  header.push({});
  return header;
}

function emptyCells(count: number): Cell[] {
  return Array.from({ length: count }, () => ({}));
}

function categoryRow(label: string, fillColor: string, totalColumns: number): Cell[] {
  return [{ text: label, bold: true, colSpan: totalColumns, fillColor, color: COLORS.navy }, ...emptyCells(totalColumns - 1)];
}

function itemRow(item: QuotationItem, calculation: QuotationCalculation["sections"][number]["items"][number], includeOther: boolean): Cell[] {
  const row: Cell[] = [
    text(item.itemNumber, { alignment: "center" }),
    text(item.description, { fontSize: 8 }),
    text(item.quantity, { alignment: "right" }),
    text(item.unit, { alignment: "center" }),
    amount(item.costType === "MATERIAL" || item.costType === "MATERIAL_LABOR" ? item.materialUnitCost : "0.00"),
    amount(calculation.materialTotal),
    amount(item.costType === "LABOR" || item.costType === "MATERIAL_LABOR" ? item.laborUnitCost : "0.00"),
    amount(calculation.laborTotal),
  ];
  if (includeOther) row.push(
    amount(item.costType === "OTHER" ? item.otherUnitCost : "0.00"),
    amount(calculation.otherTotal),
  );
  row.push(amount(calculation.actualTotal));
  return row;
}

function summaryRow(label: string, value: Cell, totalColumns: number, options: { fillColor?: string; color?: string } = {}): Cell[] {
  const fillColor = options.fillColor || COLORS.peach;
  return [
    { text: label, bold: true, colSpan: totalColumns - 1, alignment: "right", fillColor, color: options.color },
    ...emptyCells(totalColumns - 2),
    { ...value, bold: true, fillColor, color: options.color },
  ];
}

function sectionSubtotal(value: string, totalColumns: number): Cell[] {
  return summaryRow("Sub Total:", amount(value), totalColumns);
}

function signatureBlock(quotation: QuotationDraft, signatureDataUrl?: string): Content {
  const prepared = {
    stack: [
      text("Prepared By:", { bold: true, fontSize: 8 }),
      ...(signatureDataUrl ? [{ image: signatureDataUrl, fit: [130, 45], margin: [0, 3, 0, 0] }] : [{ text: "", margin: [0, 28, 0, 0] }]),
      text(quotation.preparedByName, { bold: true, fontSize: 9 }),
      text(quotation.preparedByTitle, { fontSize: 8 }),
    ],
  };
  const noted = {
    stack: [
      text("Noted By:", { bold: true, fontSize: 8 }),
      { text: "", margin: [0, 28, 0, 0] },
      text(quotation.notedByName, { bold: true, fontSize: 9 }),
      text(quotation.notedByTitle, { fontSize: 8 }),
    ],
  };

  return { columns: [prepared, noted], columnGap: 180, margin: [0, 14, 0, 0] } as unknown as Content;
}

export function buildCostPdfDocument(quotation: QuotationDraft, calculation: QuotationCalculation, settings: QuotationSettings, assets: { logoDataUrl?: string; signatureDataUrl?: string } = {}): TDocumentDefinitions {
  const logoDataUrl = assets.logoDataUrl || undefined;
  const signatureDataUrl = settings.signatureEnabled ? assets.signatureDataUrl || undefined : undefined;
  const includeOther = quotation.sections.some((section) => section.items.some((item) => item.rowType === "item" && item.costType === "OTHER"));
  const totalColumns = includeOther ? 11 : 9;
  const widths = [30, "*", 38, 42, 58, 62, 58, 62, ...(includeOther ? [58, 62] : []), 78];
  const body: any[][] = [tableHeader(includeOther), tableSubHeader(includeOther)];

  quotation.sections.forEach((section, sectionIndex) => {
    body.push(categoryRow(`${section.sectionNumber || `${sectionIndex + 1}.`} ${section.name}`, sectionIndex === 0 ? COLORS.green : COLORS.orange, totalColumns));
    const sectionResult = calculation.sections.find((result) => result.sectionId === section.id);
    section.items.forEach((item) => {
      if (item.rowType === "heading") {
        body.push(categoryRow(item.description, COLORS.peach, totalColumns));
        return;
      }
      const itemResult = sectionResult?.items.find((result) => result.itemId === item.id);
      if (itemResult) body.push(itemRow(item, itemResult, includeOther));
    });
    body.push(sectionSubtotal(sectionResult?.actualTotal ?? "0.00", totalColumns));
  });

  const totals: Cell[][] = [
    summaryRow("Material Total", amount(calculation.materialTotal), totalColumns),
    summaryRow("Labor Total", amount(calculation.laborTotal), totalColumns),
    ...(includeOther ? [summaryRow("Other Total", amount(calculation.otherTotal), totalColumns)] : []),
    summaryRow("Actual Cost", amount(calculation.actualCost), totalColumns),
    summaryRow("Overall Pricing Factor", text(calculation.overallFactor, { alignment: "right" }), totalColumns),
    summaryRow("Selling Price Before VAT", amount(calculation.sellingPriceBeforeVat), totalColumns),
    summaryRow(calculation.vatType === "VAT_INCLUSIVE" ? `VAT (${calculation.vatRate}%)` : "VAT", amount(calculation.vatAmount), totalColumns),
    summaryRow(
      calculation.vatType === "VAT_INCLUSIVE" ? "TOTAL PROJECT AMOUNT (VAT INCLUDED)" : calculation.vatType === "VAT_EXCLUSIVE" ? "TOTAL PROJECT AMOUNT (VAT EXCLUDED)" : "TOTAL PROJECT AMOUNT (NON-VAT)",
      text(`PHP ${pdfMoney(calculation.finalAmount)}`, { alignment: "right" }),
      totalColumns,
      { fillColor: COLORS.blue, color: COLORS.navy },
    ),
  ];

  return {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [24, 112, 24, 32],
    header: () => headerMetadata(quotation, settings, logoDataUrl),
    footer: (currentPage: number, pageCount: number) => footer(quotation, settings, currentPage, pageCount),
    defaultStyle: { font: "Roboto", fontSize: 8, color: "#111827" },
    styles: {
      tableHeader: { fillColor: COLORS.blue, color: COLORS.navy, fontSize: 8 },
    },
    content: [
      pricingBlock(quotation),
      ({
        table: { headerRows: 2, widths, body },
        headerRows: 2,
        dontBreakRows: true,
        keepWithHeaderRows: 1,
        layout: {
          fillColor: (rowIndex: number) => rowIndex < 2 ? COLORS.blue : undefined,
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          paddingTop: () => 3,
          paddingBottom: () => 3,
          paddingLeft: () => 4,
          paddingRight: () => 4,
        },
      } as any),
      ({ margin: [0, 8, 0, 0], table: { widths, body: totals }, layout: { hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => COLORS.border, vLineColor: () => COLORS.border, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 } } as any),
      signatureBlock(quotation, signatureDataUrl),
    ],
    info: {
      title: `${quotation.qteNumber} Cost PDF`,
      subject: quotation.subject || quotation.projectName,
      author: settings.companyName || "",
    },
  };
}
