import { describe, expect, it } from "vitest";
import { calculateQuotation } from "../domain/calculation";
import { emptyQuotationSettings } from "../domain/defaults";
import type { QuotationDraft, QuotationSettings } from "../domain/models";
import { buildCostPdfDocument } from "./costPdf";
import { buildSellingPdfDocument } from "./sellingPdf";

function quotation(): QuotationDraft {
  return {
    qteNumber: "QTE-26-001-EM",
    quoteDate: "2026-01-05",
    client: "CDO Malvar, Batangas",
    clientAddress: "E24PV+M3G, Bulihan, Malvar, Batangas",
    attention: "MARYCEL BUENDIA",
    positionDepartment: "Corporate Purchasing",
    projectName: "FPM Spice Extension Improvement",
    projectLocation: "E24PV+M3G, Bulihan, Malvar, Batangas",
    subject: "FPM Spice Extension Improvement",
    validity: "Forty Five (45) Days",
    salutation: "Gentlemen:",
    openingParagraph: "In response to your inquiry, we are pleased to quote you the following items:",
    preparedByName: "Rommel Antonio Rey R. Araos",
    preparedByTitle: "Operation Head",
    notedByName: "Rey R. Araos",
    notedByTitle: "President",
    termsConditions: "Payment terms to be agreed upon.",
    exclusions: "All other scope not specifically mentioned in this proposal.",
    overallFactor: "1.00",
    vatType: "VAT_INCLUSIVE",
    vatRate: "12",
    sections: [
      {
        id: "section-1",
        sectionNumber: "I.",
        name: "General Requirements",
        sortOrder: 0,
        items: [
          {
            id: "item-1",
            rowType: "item",
            itemNumber: "1",
            description: "Supply and installation",
            quantity: "1",
            unit: "lot",
            costType: "OTHER",
            materialUnitCost: "0",
            laborUnitCost: "0",
            otherUnitCost: "483869.40",
            sortOrder: 0,
          },
        ],
      },
    ],
  };
}

function settings(overrides: Partial<QuotationSettings> = {}): QuotationSettings {
  return { ...emptyQuotationSettings, companyName: "Configured Company", ...overrides };
}

describe("PDF definitions", () => {
  it("uses the reference VAT result without introducing a separate PDF calculation", () => {
    const draft = quotation();
    const calculation = calculateQuotation(draft);
    const definition = buildSellingPdfDocument(draft, calculation, settings());
    const serialized = JSON.stringify(definition);

    expect(calculation.sellingPriceBeforeVat).toBe("483869.40");
    expect(calculation.vatAmount).toBe("58064.33");
    expect(calculation.finalAmount).toBe("541933.73");
    expect(serialized).toContain("Unit Cost");
    expect(serialized).toContain("Total Amount");
    expect(serialized).not.toContain("Material Total");
    expect(serialized).not.toContain("Labor Total");
    expect(serialized).not.toContain("EYELECTRIC, INC.");
  });

  it("keeps the Cost PDF internal columns and configured signature behavior", () => {
    const draft = quotation();
    const calculation = calculateQuotation(draft);
    const disabledSignature = JSON.stringify(buildCostPdfDocument(draft, calculation, settings()));
    const enabledSignature = JSON.stringify(buildCostPdfDocument(draft, calculation, settings({ signatureEnabled: true, signatureDataUrl: "data:image/png;base64,AA==" }), { signatureDataUrl: "data:image/png;base64,AA==" }));

    expect(disabledSignature).toContain("Material");
    expect(disabledSignature).toContain("Labor");
    expect(disabledSignature).toContain("Other");
    expect(disabledSignature).not.toContain("data:image/png");
    expect(enabledSignature).toContain("data:image/png");
    expect(enabledSignature).toContain("541933.73");
  });
});
