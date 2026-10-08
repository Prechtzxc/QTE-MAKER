import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { QuotationCalculation, QuotationDraft, QuotationItem, QuotationSettings } from "../domain/models";
import { formatDate } from "../ui/format";
import { pdfMoney } from "./format";

const COLORS = {
  navy: "#172454",
  red: "#e62e3b",
  blue: "#c7d8ea",
  orange: "#f8c98f",
  peach: "#f8dec7",
  border: "#1f2937",
  muted: "#667085",
};

function text(value: string, options: Record<string, unknown> = {}): Record<string, unknown> {
  return { text: value || "", ...options };
}

function amount(value: string): Record<string, unknown> {
  const rounded = pdfMoney(value);
  return text(rounded === "0.00" ? "-" : rounded, { alignment: "right" });
}

function lines(value: string, options: Record<string, unknown> = {}): Content {
  const content = value.split(/\r?\n/).filter((line) => line.trim()).map((line) => text(line, { ...options, margin: [0, 0, 0, 2] }));
  return { stack: content.length ? content : [text("")] } as unknown as Content;
}

function attachmentHeader(quotation: QuotationDraft, settings: QuotationSettings, logoDataUrl?: string): Content {
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
    : { text: settings.companyName || "", bold: true, color: COLORS.navy, fontSize: 13, alignment: "right" };

  return { columns: [metadata, identity], columnGap: 15, margin: [24, 18, 24, 0] } as unknown as Content;
}

function footer(quotation: QuotationDraft, settings: QuotationSettings, logoDataUrl: string | undefined, currentPage: number, pageCount: number): Content {
  if (currentPage === 1) {
    return {
      stack: [
        { canvas: [{ type: "rect", x: 0, y: 0, w: 545, h: 5, color: COLORS.red }] },
        {
          columns: [
            logoDataUrl ? { image: logoDataUrl, fit: [190, 45] } : text(settings.companyName || "", { bold: true, color: COLORS.navy, fontSize: 13 }),
            { stack: [text(settings.companyAddress, { fontSize: 7, color: COLORS.muted }), text(settings.contactInformation, { fontSize: 7, color: COLORS.muted }), text(settings.footerText, { fontSize: 7, color: COLORS.muted })], margin: [10, 0, 0, 0] },
          ],
          margin: [0, 7, 0, 0],
        },
      ],
      margin: [24, 0, 24, 10],
    } as unknown as Content;
  }

  return {
    columns: [text(`${quotation.qteNumber} Selling PDF`, { fontSize: 7, color: COLORS.muted }), text(`Page ${currentPage} of ${pageCount}`, { alignment: "right", fontSize: 7, color: COLORS.muted })],
    margin: [24, 0, 24, 10],
  } as unknown as Content;
}

function coverSummary(calculation: QuotationCalculation): Content {
  const label = calculation.vatType === "VAT_INCLUSIVE" ? "Total Project Amount (VAT Included)" : calculation.vatType === "VAT_EXCLUSIVE" ? "Total Project Amount (VAT Excluded)" : "Total Project Amount (Non-VAT)";
  const description = "Supply of quality labor, materials, tools and equipment for the above mentioned subject with itemized price breakdown indicated in the attachment.";

  return {
    table: {
      widths: [35, "*", 42, 45, 82, 92],
      body: [
        [text("ITEM", { bold: true, alignment: "center", fillColor: "#c2c2c2" }), text("DESCRIPTION", { bold: true, alignment: "center", fillColor: "#c2c2c2" }), text("QTY", { bold: true, alignment: "center", fillColor: "#c2c2c2" }), text("UNIT", { bold: true, alignment: "center", fillColor: "#c2c2c2" }), text("UNIT COST", { bold: true, alignment: "center", fillColor: "#c2c2c2" }), text("TOTAL AMOUNT", { bold: true, alignment: "center", fillColor: "#c2c2c2" })],
        [text("1", { alignment: "center" }), text(description, { fontSize: 8 }), text("1", { alignment: "center" }), text("lot", { alignment: "center" }), amount(calculation.finalAmount), amount(calculation.finalAmount)],
        [{ text: label, bold: true, colSpan: 5, alignment: "right" }, {}, {}, {}, {}, { text: `PHP ${calculation.finalAmount}`, bold: true, alignment: "right" }],
      ],
    },
    layout: {
      hLineWidth: () => 0.8,
      vLineWidth: () => 0.8,
      hLineColor: () => COLORS.border,
      vLineColor: () => COLORS.border,
      paddingTop: () => 6,
      paddingBottom: () => 6,
      paddingLeft: () => 6,
      paddingRight: () => 6,
    },
  } as unknown as Content;
}

function attachmentHeaderRow(): any[] {
  return [
    text("Item", { bold: true, alignment: "center" }),
    text("Description", { bold: true, alignment: "center" }),
    text("Qty", { bold: true, alignment: "center" }),
    text("Unit", { bold: true, alignment: "center" }),
    text("Unit Cost", { bold: true, alignment: "center" }),
    text("Total Amount", { bold: true, alignment: "center" }),
  ];
}

function categoryRow(label: string, fillColor: string): any[] {
  return [{ text: label, bold: true, colSpan: 6, fillColor, color: COLORS.navy }, {}, {}, {}, {}, {}];
}

function itemRow(item: QuotationItem, result: QuotationCalculation["sections"][number]["items"][number]): any[] {
  return [text(item.itemNumber, { alignment: "center" }), text(item.description, { fontSize: 8 }), text(item.quantity, { alignment: "right" }), text(item.unit, { alignment: "center" }), amount(result.sellingUnitCost), amount(result.sellingTotal)];
}

function signatureBlock(quotation: QuotationDraft, settings: QuotationSettings, signatureDataUrl?: string): Content {
  return {
    columns: [
      { stack: [text(settings.companyName, { bold: true, fontSize: 9 }), ...(signatureDataUrl ? [{ image: signatureDataUrl, fit: [130, 45], margin: [0, 3, 0, 0] }] : [{ text: "", margin: [0, 34, 0, 0] }]), text(quotation.preparedByName, { bold: true, fontSize: 9 }), text(quotation.preparedByTitle, { fontSize: 8 })] },
      { stack: [text("Noted by:", { fontSize: 9 }), { text: "", margin: [0, 34, 0, 0] }, text(quotation.notedByName, { bold: true, fontSize: 9 }), text(quotation.notedByTitle, { fontSize: 8 })] },
    ],
    columnGap: 180,
    margin: [0, 18, 0, 0],
  } as unknown as Content;
}

export function buildSellingPdfDocument(quotation: QuotationDraft, calculation: QuotationCalculation, settings: QuotationSettings, assets: { logoDataUrl?: string; signatureDataUrl?: string } = {}): TDocumentDefinitions {
  const logoDataUrl = assets.logoDataUrl || undefined;
  const signatureDataUrl = settings.signatureEnabled ? assets.signatureDataUrl || undefined : undefined;
  const attachmentBody: any[][] = [attachmentHeaderRow()];

  quotation.sections.forEach((section, sectionIndex) => {
    attachmentBody.push(categoryRow(`${section.sectionNumber || `${sectionIndex + 1}.`} ${section.name}`, sectionIndex === 0 ? "#dcecc3" : COLORS.orange));
    const sectionResult = calculation.sections.find((result) => result.sectionId === section.id);
    section.items.forEach((item) => {
      if (item.rowType === "heading") {
        attachmentBody.push(categoryRow(item.description, COLORS.peach));
        return;
      }
      const result = sectionResult?.items.find((itemResult) => itemResult.itemId === item.id);
      if (result) attachmentBody.push(itemRow(item, result));
    });
     attachmentBody.push([{ text: "Sub Total:", bold: true, colSpan: 5, alignment: "right", fillColor: COLORS.peach }, {}, {}, {}, {}, { text: pdfMoney(sectionResult?.sellingTotal ?? "0.00"), bold: true, alignment: "right", fillColor: COLORS.peach }]);
  });

  const totalLabel = calculation.vatType === "VAT_INCLUSIVE" ? "TOTAL PROJECT AMOUNT (VAT INCLUDED)" : calculation.vatType === "VAT_EXCLUSIVE" ? "TOTAL PROJECT AMOUNT (VAT EXCLUDED)" : "TOTAL PROJECT AMOUNT (NON-VAT)";
   attachmentBody.push([{ text: totalLabel, bold: true, colSpan: 5, alignment: "right", fillColor: COLORS.blue, color: COLORS.navy }, {}, {}, {}, {}, { text: `PHP ${pdfMoney(calculation.finalAmount)}`, bold: true, alignment: "right", fillColor: COLORS.blue, color: COLORS.navy }]);

  const attachmentTable = {
    pageBreak: "before",
    pageOrientation: "landscape",
    table: { headerRows: 1, widths: [42, "*", 45, 50, 90, 100], body: attachmentBody },
    headerRows: 1,
    dontBreakRows: true,
    keepWithHeaderRows: 1,
    layout: {
      fillColor: (rowIndex: number) => rowIndex === 0 ? COLORS.blue : undefined,
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      hLineColor: () => COLORS.border,
      vLineColor: () => COLORS.border,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      paddingLeft: () => 5,
      paddingRight: () => 5,
    },
  };

  return {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [24, 36, 24, 72],
     header: (currentPage: number) => currentPage === 1 ? null : attachmentHeader(quotation, settings, logoDataUrl),
     footer: (currentPage: number, pageCount: number) => footer(quotation, settings, logoDataUrl, currentPage, pageCount),
    defaultStyle: { font: "Roboto", fontSize: 9, color: "#111827" },
    content: [
      {
        columns: [
          { width: 70, stack: [text("Our Ref.", { bold: true }), text("Date:", { bold: true, margin: [0, 18, 0, 0] })] },
          { width: "*", stack: [text(quotation.qteNumber, { bold: true, fontSize: 12 }), text(formatDate(quotation.quoteDate), { bold: true, margin: [0, 16, 0, 0] })] },
        ],
        margin: [4, 0, 0, 16],
      },
      { text: quotation.client, bold: true, fontSize: 11, margin: [4, 0, 0, 2] },
      { text: quotation.clientAddress, fontSize: 10, margin: [4, 0, 0, 18] },
      { columns: [{ width: 78, text: "Attention:" }, { width: "*", stack: [text(quotation.attention, { bold: true, fontSize: 10 }), text(quotation.positionDepartment, { fontSize: 10 })] }], margin: [4, 0, 0, 15] },
      { columns: [{ width: 78, text: "Subject:" }, { width: "*", text: quotation.subject, bold: true, fontSize: 10 }], margin: [4, 0, 0, 18] },
      text(quotation.salutation, { bold: true, margin: [4, 0, 0, 18] }),
      text(quotation.openingParagraph, { margin: [4, 0, 0, 10] }),
      coverSummary(calculation),
      { text: "TERMS AND CONDITIONS:", bold: true, fontSize: 10, margin: [4, 18, 0, 7] },
      lines(quotation.termsConditions, { fontSize: 9, margin: [4, 0, 0, 0] }),
      { text: "EXCLUSIONS:", bold: true, italics: true, fontSize: 10, margin: [4, 14, 0, 6] },
      lines(quotation.exclusions, { fontSize: 9, margin: [4, 0, 0, 0] }),
      text("Thank you very much for giving us the opportunity to quote on this requirement. We hope everything is in order. We will keep in touch as to the development of your inquiry.", { margin: [4, 16, 0, 0] }),
      text("Very truly yours,", { margin: [4, 18, 0, 0] }),
       signatureBlock(quotation, settings, signatureDataUrl),
      attachmentTable as any,
    ],
    info: {
      title: `${quotation.qteNumber} Selling PDF`,
      subject: quotation.subject || quotation.projectName,
      author: settings.companyName || "",
    },
  };
}
