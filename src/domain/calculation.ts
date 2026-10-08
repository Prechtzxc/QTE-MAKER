import Decimal from "decimal.js";
import type {
  CostType,
  DecimalString,
  ItemCalculation,
  QuotationCalculation,
  QuotationDraft,
  QuotationItem,
  QuotationSection,
  SectionCalculation,
} from "./models";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const ZERO = "0.00";

function decimal(value: string | number | undefined, label: string): Decimal {
  const normalized = value === undefined || (typeof value === "string" && value.trim() === "") ? "0" : String(value);
  try {
    const parsed = new Decimal(normalized);
    if (!parsed.isFinite()) {
      throw new Error();
    }
    return parsed;
  } catch {
    throw new Error(`${label} must be a valid number.`);
  }
}

function money(value: Decimal.Value): DecimalString {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function raw(value: Decimal.Value): DecimalString {
  return new Decimal(value).toString();
}

function enabledComponents(costType: CostType): { material: boolean; labor: boolean; other: boolean } {
  switch (costType) {
    case "MATERIAL":
      return { material: true, labor: false, other: false };
    case "LABOR":
      return { material: false, labor: true, other: false };
    case "MATERIAL_LABOR":
      return { material: true, labor: true, other: false };
    case "OTHER":
      return { material: false, labor: false, other: true };
  }
}

function calculateItem(item: QuotationItem, factor: Decimal): ItemCalculation {
  if (item.rowType === "heading") {
    return {
      itemId: item.id,
      rowType: "heading",
      materialTotal: ZERO,
      laborTotal: ZERO,
      otherTotal: ZERO,
      actualTotal: ZERO,
      sellingUnitCost: ZERO,
      sellingTotal: ZERO,
    };
  }

  const quantity = decimal(item.quantity, `Quantity for ${item.description || "an item"}`);
  const components = enabledComponents(item.costType);

  if (quantity.isNegative()) {
    throw new Error(`Quantity for ${item.description || "an item"} cannot be negative.`);
  }

  const materialUnit = components.material
    ? decimal(item.materialUnitCost, `Material unit cost for ${item.description || "an item"}`)
    : new Decimal(0);
  const laborUnit = components.labor
    ? decimal(item.laborUnitCost, `Labor unit cost for ${item.description || "an item"}`)
    : new Decimal(0);
  const otherUnit = components.other
    ? decimal(item.otherUnitCost, `Other unit cost for ${item.description || "an item"}`)
    : new Decimal(0);

  if (materialUnit.isNegative() || laborUnit.isNegative() || otherUnit.isNegative()) {
    throw new Error(`Costs for ${item.description || "an item"} cannot be negative.`);
  }

  const materialTotal = new Decimal(money(quantity.times(materialUnit)));
  const laborTotal = new Decimal(money(quantity.times(laborUnit)));
  const otherTotal = new Decimal(money(quantity.times(otherUnit)));
  const actualTotal = new Decimal(money(materialTotal.plus(laborTotal).plus(otherTotal)));
  const sellingTotal = new Decimal(money(actualTotal.times(factor)));
  const sellingUnitCost = quantity.isZero() ? new Decimal(0) : new Decimal(money(sellingTotal.div(quantity)));

  return {
    itemId: item.id,
    rowType: "item",
    materialTotal: materialTotal.toFixed(2),
    laborTotal: laborTotal.toFixed(2),
    otherTotal: otherTotal.toFixed(2),
    actualTotal: actualTotal.toFixed(2),
    sellingUnitCost: sellingUnitCost.toFixed(2),
    sellingTotal: sellingTotal.toFixed(2),
  };
}

function calculateSection(section: QuotationSection, factor: Decimal): SectionCalculation {
  const items = section.items.map((item) => calculateItem(item, factor));
  const materialTotal = items.reduce((sum, item) => sum.plus(item.materialTotal), new Decimal(0));
  const laborTotal = items.reduce((sum, item) => sum.plus(item.laborTotal), new Decimal(0));
  const otherTotal = items.reduce((sum, item) => sum.plus(item.otherTotal), new Decimal(0));
  const actualTotal = items.reduce((sum, item) => sum.plus(item.actualTotal), new Decimal(0));
  const sellingTotal = items.reduce((sum, item) => sum.plus(item.sellingTotal), new Decimal(0));

  return {
    sectionId: section.id,
    materialTotal: money(materialTotal),
    laborTotal: money(laborTotal),
    otherTotal: money(otherTotal),
    actualTotal: money(actualTotal),
    sellingTotal: money(sellingTotal),
    items,
  };
}

export function calculateQuotation(quotation: QuotationDraft): QuotationCalculation {
  const factor = decimal(quotation.overallFactor, "Overall pricing factor");
  const vatRate = decimal(quotation.vatRate, "VAT rate");

  if (factor.isNegative()) {
    throw new Error("Overall pricing factor cannot be negative.");
  }
  if (vatRate.isNegative() || vatRate.greaterThan(100)) {
    throw new Error("VAT rate must be between 0 and 100 percent.");
  }

  const sections = quotation.sections.map((section) => calculateSection(section, factor));
  const materialTotal = sections.reduce((sum, section) => sum.plus(section.materialTotal), new Decimal(0));
  const laborTotal = sections.reduce((sum, section) => sum.plus(section.laborTotal), new Decimal(0));
  const otherTotal = sections.reduce((sum, section) => sum.plus(section.otherTotal), new Decimal(0));
  const actualCost = sections.reduce((sum, section) => sum.plus(section.actualTotal), new Decimal(0));
  const sellingPriceBeforeVat = sections.reduce((sum, section) => sum.plus(section.sellingTotal), new Decimal(0));
  const vatAmount = quotation.vatType === "VAT_INCLUSIVE"
    ? new Decimal(money(sellingPriceBeforeVat.times(vatRate.dividedBy(100))))
    : new Decimal(0);
  const finalAmount = new Decimal(money(sellingPriceBeforeVat.plus(vatAmount)));

  return {
    materialTotal: money(materialTotal),
    laborTotal: money(laborTotal),
    otherTotal: money(otherTotal),
    actualCost: money(actualCost),
    overallFactor: raw(factor),
    sellingPriceBeforeVat: money(sellingPriceBeforeVat),
    vatType: quotation.vatType,
    vatRate: raw(vatRate),
    vatAmount: vatAmount.toFixed(2),
    finalAmount: finalAmount.toFixed(2),
    sections,
  };
}

export function isCostFieldEnabled(costType: CostType, field: "material" | "labor" | "other"): boolean {
  return enabledComponents(costType)[field];
}

export function formatDecimal(value: DecimalString): DecimalString {
  return raw(decimal(value, "Decimal value"));
}
