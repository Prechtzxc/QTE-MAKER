import { describe, expect, it } from "vitest";
import { calculateQuotation } from "./calculation";
import type { QuotationDraft } from "./models";

function quotation(overrides: Partial<QuotationDraft> = {}): QuotationDraft {
  return {
    qteNumber: "QTE-TEST",
    quoteDate: "2026-10-07",
    client: "Client",
    clientAddress: "Address",
    attention: "Attention",
    positionDepartment: "Purchasing",
    projectName: "Project",
    projectLocation: "Location",
    subject: "Subject",
    validity: "30 Days",
    salutation: "Gentlemen:",
    openingParagraph: "Opening",
    preparedByName: "Prepared",
    preparedByTitle: "Title",
    notedByName: "Noted",
    notedByTitle: "Title",
    termsConditions: "Terms",
    exclusions: "Exclusions",
    overallFactor: "1.70",
    vatType: "VAT_EXCLUSIVE",
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
            description: "Supply and Install PVC Pipe",
            quantity: "20",
            unit: "pcs",
            costType: "MATERIAL_LABOR",
            materialUnitCost: "500",
            laborUnitCost: "200",
            otherUnitCost: "0",
            sortOrder: 0,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("calculateQuotation", () => {
  it("calculates material, labor, actual cost, and selling price with one factor", () => {
    const result = calculateQuotation(quotation());

    expect(result.materialTotal).toBe("10000.00");
    expect(result.laborTotal).toBe("4000.00");
    expect(result.actualCost).toBe("14000.00");
    expect(result.sellingPriceBeforeVat).toBe("23800.00");
    expect(result.vatAmount).toBe("0.00");
    expect(result.finalAmount).toBe("23800.00");
  });

  it("adds VAT for VAT-inclusive quotations", () => {
    const result = calculateQuotation(
      quotation({
        overallFactor: "1.00",
        vatType: "VAT_INCLUSIVE",
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
                description: "Base",
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
      }),
    );

    expect(result.sellingPriceBeforeVat).toBe("483869.40");
    expect(result.vatAmount).toBe("58064.33");
    expect(result.finalAmount).toBe("541933.73");
  });

  it("rounds monetary line extensions before summing them", () => {
    const result = calculateQuotation(
      quotation({
        overallFactor: "1.00",
        sections: [
          {
            id: "section-1",
            sectionNumber: "I.",
            name: "Other",
            sortOrder: 0,
            items: [
              {
                id: "item-1",
                rowType: "item",
                itemNumber: "1",
                description: "First",
                quantity: "3",
                unit: "pcs",
                costType: "OTHER",
                materialUnitCost: "0",
                laborUnitCost: "0",
                otherUnitCost: "0.333",
                sortOrder: 0,
              },
              {
                id: "item-2",
                rowType: "item",
                itemNumber: "2",
                description: "Second",
                quantity: "1",
                unit: "pcs",
                costType: "OTHER",
                materialUnitCost: "0",
                laborUnitCost: "0",
                otherUnitCost: "0.335",
                sortOrder: 1,
              },
            ],
          },
        ],
      }),
    );

    expect(result.otherTotal).toBe("1.34");
    expect(result.actualCost).toBe("1.34");
    expect(result.sellingPriceBeforeVat).toBe("1.34");
  });

  it("rounds each enabled cost component and the selling line before aggregation", () => {
    const result = calculateQuotation(
      quotation({
        overallFactor: "1.50",
        vatType: "VAT_INCLUSIVE",
        vatRate: "12",
        sections: [
          {
            id: "section-1",
            sectionNumber: "I.",
            name: "Rounding",
            sortOrder: 0,
            items: [
              {
                id: "item-1",
                rowType: "item",
                itemNumber: "1",
                description: "Component rounding",
                quantity: "1",
                unit: "lot",
                costType: "MATERIAL_LABOR",
                materialUnitCost: "0.005",
                laborUnitCost: "0.005",
                otherUnitCost: "0",
                sortOrder: 0,
              },
            ],
          },
        ],
      }),
    );

    expect(result.sections[0].items[0]).toMatchObject({
      materialTotal: "0.01",
      laborTotal: "0.01",
      actualTotal: "0.02",
      sellingTotal: "0.03",
    });
    expect(result.actualCost).toBe("0.02");
    expect(result.sellingPriceBeforeVat).toBe("0.03");
    expect(result.vatAmount).toBe("0.00");
    expect(result.finalAmount).toBe("0.03");
  });
});
