import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateQuotation } from "../domain/calculation";
import { emptyQuotationSettings } from "../domain/defaults";
import type { QuotationDraft, QuotationSettings } from "../domain/models";
import { buildCostPdfDocument } from "../pdf/costPdf";
import { buildSellingPdfDocument } from "../pdf/sellingPdf";
import { createPdfBuffer } from "../pdf/pdfMake";
import { qte26_001ReferenceQuotation } from "./referenceFixture";

const referenceSettings: QuotationSettings = {
  ...emptyQuotationSettings,
  companyName: "EYELECTRIC, INC.",
  companyAddress: "E24PV+M3G, Bulihan, Malvar, Batangas",
  contactInformation: "Corporate Purchasing",
  footerText: "QTE-26-001-EM",
  logoDataUrl: process.env.QTE_VALIDATION_LOGO
    ? `data:image/png;base64,${readFileSync(process.env.QTE_VALIDATION_LOGO).toString("base64")}`
    : "",
};
const referenceAssets = { logoDataUrl: referenceSettings.logoDataUrl || undefined };

function stressQuotation(): QuotationDraft {
  const source = qte26_001ReferenceQuotation.sections[0].items.find((item) => item.rowType === "item");
  if (!source) throw new Error("Reference fixture has no item source.");

  return {
    ...qte26_001ReferenceQuotation,
    qteNumber: "QTE-STRESS-001",
    sections: [{
      ...qte26_001ReferenceQuotation.sections[0],
      name: "Pagination Stress",
      items: Array.from({ length: 60 }, (_, index) => ({
        ...source,
        id: `stress-${index + 1}`,
        itemNumber: String(index + 1),
        description: `Pagination stress item ${index + 1}`,
        sortOrder: index,
      })),
    }],
  };
}

function pageCount(pdf: Uint8Array): number {
  return (new TextDecoder("latin1").decode(pdf).match(/\/Type \/Page\b/g) ?? []).length;
}

describe("reference validation", () => {
  it("matches the QTE-26-001 Cost reference totals from its priced rows", () => {
    const result = calculateQuotation(qte26_001ReferenceQuotation);

    expect(qte26_001ReferenceQuotation.sections[1].items.filter((item) => item.rowType === "item")).toHaveLength(40);
    expect(result.materialTotal).toBe("156165.00");
    expect(result.laborTotal).toBe("201256.00");
    expect(result.actualCost).toBe("357421.00");
    expect(result.sections[0].actualTotal).toBe("86000.00");
    expect(result.sections[1].actualTotal).toBe("271421.00");
    expect(result.sellingPriceBeforeVat).toBe("357421.00");
    expect(result.vatAmount).toBe("42890.52");
    expect(result.finalAmount).toBe("400311.52");
  });

  it("keeps the Selling PDF public while retaining reference metadata", () => {
    const calculation = calculateQuotation(qte26_001ReferenceQuotation);
    const serialized = JSON.stringify(buildSellingPdfDocument(qte26_001ReferenceQuotation, calculation, referenceSettings, referenceAssets));

    expect(serialized).toContain("QTE-26-001-EM");
    expect(serialized).toContain("FPM Spice Extension Improvement");
    expect(serialized).toContain("Supply of quality labor, materials, tools and equipment for the above mentioned subject with itemized price breakdown indicated in the attachment.");
    expect(serialized).toContain("Unit Cost");
    expect(serialized).toContain("Total Amount");
    expect(serialized).not.toContain("Material Total");
    expect(serialized).not.toContain("Labor Total");
    expect(serialized).not.toContain("Overall Pricing Factor");
    expect(serialized).not.toContain("Actual Cost");
  });

  it("generates both reference-shaped PDFs and paginates 60 items", async () => {
    const calculation = calculateQuotation(qte26_001ReferenceQuotation);
    const costPdf = await createPdfBuffer(buildCostPdfDocument(qte26_001ReferenceQuotation, calculation, referenceSettings, referenceAssets));
    const sellingPdf = await createPdfBuffer(buildSellingPdfDocument(qte26_001ReferenceQuotation, calculation, referenceSettings, referenceAssets));
    const stress = stressQuotation();
    const stressCalculation = calculateQuotation(stress);
    const stressPdf = await createPdfBuffer(buildSellingPdfDocument(stress, stressCalculation, referenceSettings, referenceAssets));

    expect(costPdf.byteLength).toBeGreaterThan(1000);
    expect(sellingPdf.byteLength).toBeGreaterThan(1000);
    expect(pageCount(costPdf)).toBe(3);
    expect(pageCount(sellingPdf)).toBe(4);
    expect(pageCount(stressPdf)).toBeGreaterThan(2);

    const outputDirectory = process.env.QTE_VALIDATION_OUTPUT ?? "C:\\Users\\ACER\\AppData\\Local\\Temp\\opencode\\qte-validation";
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(join(outputDirectory, "qte-26-001-cost-generated.pdf"), costPdf);
    await writeFile(join(outputDirectory, "qte-26-001-selling-generated.pdf"), sellingPdf);
    await writeFile(join(outputDirectory, "qte-stress-60-items-selling-generated.pdf"), stressPdf);
  });

  it.each([
    ["VAT_INCLUSIVE", "42890.52", "400311.52"],
    ["VAT_EXCLUSIVE", "0.00", "357421.00"],
    ["NON_VAT", "0.00", "357421.00"],
  ] as const)("handles %s reference mode", (vatType, vatAmount, finalAmount) => {
    const result = calculateQuotation({ ...qte26_001ReferenceQuotation, vatType });
    expect(result.vatAmount).toBe(vatAmount);
    expect(result.finalAmount).toBe(finalAmount);
  });
});
