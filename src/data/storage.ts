import { invoke } from "@tauri-apps/api/core";
import type { QuotationCalculation, QuotationDraft, QuotationSettings } from "../domain/models";
import { emptyQuotationSettings, normalizeQuotationSettings } from "../domain/defaults";

const SETTINGS_KEY = "eyelectric-qte-maker.settings";
const QUOTATIONS_KEY = "eyelectric-qte-maker.quotations";

const settingsKeys: Array<keyof QuotationSettings> = [
  "companyName",
  "companyAddress",
  "contactInformation",
  "footerText",
  "logoPath",
  "logoDataUrl",
  "preparedByName",
  "preparedByTitle",
  "notedByName",
  "notedByTitle",
  "signaturePath",
  "signatureDataUrl",
  "signatureEnabled",
  "defaultVatRate",
  "defaultTerms",
  "defaultExclusions",
];

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function settingsToRecord(settings: QuotationSettings): Record<string, string> {
  return Object.fromEntries(settingsKeys.map((key) => [key, String(settings[key])]));
}

function recordToSettings(record: Record<string, string>): QuotationSettings {
  return normalizeQuotationSettings({
    companyName: record.company_name ?? record.companyName,
    companyAddress: record.company_address ?? record.companyAddress,
    contactInformation: record.contact_information ?? record.contactInformation,
    footerText: record.footer_text ?? record.footerText,
    logoPath: record.logo_path ?? record.logoPath,
    logoDataUrl: record.logo_data_url ?? record.logoDataUrl,
    preparedByName: record.prepared_by_name ?? record.preparedByName,
    preparedByTitle: record.prepared_by_title ?? record.preparedByTitle,
    notedByName: record.noted_by_name ?? record.notedByName,
    notedByTitle: record.noted_by_title ?? record.notedByTitle,
    signaturePath: record.signature_path ?? record.signaturePath,
    signatureDataUrl: record.signature_data_url ?? record.signatureDataUrl,
    signatureEnabled: (record.signature_enabled ?? record.signatureEnabled) === "true",
    defaultVatRate: record.default_vat_rate ?? record.defaultVatRate,
    defaultTerms: record.default_terms ?? record.defaultTerms,
    defaultExclusions: record.default_exclusions ?? record.defaultExclusions,
  });
}

function normalizeQuotation(value: QuotationDraft): QuotationDraft {
  return {
    ...value,
    qteNumber: value.qteNumber ?? "",
    quoteDate: value.quoteDate ?? "",
    client: value.client ?? "",
    clientAddress: value.clientAddress ?? "",
    attention: value.attention ?? "",
    positionDepartment: value.positionDepartment ?? "",
    projectName: value.projectName ?? "",
    projectLocation: value.projectLocation ?? "",
    subject: value.subject ?? "",
    validity: value.validity ?? "",
    salutation: value.salutation ?? "",
    openingParagraph: value.openingParagraph ?? "",
    preparedByName: value.preparedByName ?? "",
    preparedByTitle: value.preparedByTitle ?? "",
    notedByName: value.notedByName ?? "",
    notedByTitle: value.notedByTitle ?? "",
    termsConditions: value.termsConditions ?? "",
    exclusions: value.exclusions ?? "",
    overallFactor: value.overallFactor ?? "0",
    vatType: value.vatType ?? "VAT_INCLUSIVE",
    vatRate: value.vatRate ?? "0",
    sections: (value.sections ?? []).map((section) => ({
      ...section,
      id: String(section.id),
      sectionNumber: section.sectionNumber ?? "",
      name: section.name ?? "",
      sortOrder: section.sortOrder ?? 0,
      items: (section.items ?? []).map((item) => ({
        ...item,
        id: String(item.id),
        rowType: item.rowType ?? "item",
        itemNumber: item.itemNumber ?? "",
        description: item.description ?? "",
        quantity: item.quantity ?? "0",
        unit: item.unit ?? "",
        costType: item.costType ?? "MATERIAL",
        materialUnitCost: item.materialUnitCost ?? "0",
        laborUnitCost: item.laborUnitCost ?? "0",
        otherUnitCost: item.otherUnitCost ?? "0",
        sortOrder: item.sortOrder ?? 0,
      })),
    })),
  };
}

export async function loadSettings(): Promise<QuotationSettings> {
  if (isTauriRuntime()) {
    const result = await invoke<Record<string, string>>("load_settings");
    return recordToSettings(result);
  }

  return normalizeQuotationSettings(readLocal<Partial<QuotationSettings>>(SETTINGS_KEY, emptyQuotationSettings));
}

export async function saveSettings(settings: QuotationSettings): Promise<void> {
  const normalized = normalizeQuotationSettings(settings);
  if (isTauriRuntime()) {
    await invoke("save_settings", { settings: settingsToRecord(normalized) });
    return;
  }

  writeLocal(SETTINGS_KEY, normalized);
}

export async function listQuotations(): Promise<QuotationDraft[]> {
  if (isTauriRuntime()) {
    const result = await invoke<QuotationDraft[]>("list_quotations");
    return result.map(normalizeQuotation);
  }

  return readLocal<QuotationDraft[]>(QUOTATIONS_KEY, []).map(normalizeQuotation);
}

export async function saveQuotation(quotation: QuotationDraft, calculation: QuotationCalculation): Promise<QuotationDraft> {
  const now = new Date().toISOString();
  const next = normalizeQuotation({
    ...quotation,
    updatedAt: now,
    createdAt: quotation.createdAt ?? now,
  });

  if (isTauriRuntime()) {
    const id = await invoke<number>("save_quotation", {
      request: {
        quotation: next,
        calculation: {
          actualCost: calculation.actualCost,
          sellingPriceBeforeVat: calculation.sellingPriceBeforeVat,
          vatAmount: calculation.vatAmount,
          finalAmount: calculation.finalAmount,
        },
      },
    });
    return { ...next, id };
  }

  const quotations = readLocal<QuotationDraft[]>(QUOTATIONS_KEY, []);
  const id = next.id ?? Math.max(0, ...quotations.map((item) => item.id ?? 0)) + 1;
  const saved = { ...next, id };
  const existingIndex = quotations.findIndex((item) => item.id === id);
  if (existingIndex === -1) {
    quotations.push(saved);
  } else {
    quotations[existingIndex] = saved;
  }
  writeLocal(QUOTATIONS_KEY, quotations);
  return saved;
}

export async function deleteQuotation(id: number): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("delete_quotation", { id });
    return;
  }

  writeLocal(QUOTATIONS_KEY, readLocal<QuotationDraft[]>(QUOTATIONS_KEY, []).filter((quotation) => quotation.id !== id));
}

export async function recordDocument(quotationId: number, documentType: "COST" | "SELLING", filePath: string): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("record_document", { quotationId, documentType, filePath });
  }
}
