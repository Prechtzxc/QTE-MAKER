import type { QuotationDraft, QuotationSection, QuotationSettings } from "./models";

export const emptyQuotationSettings: QuotationSettings = {
  companyName: "",
  companyAddress: "",
  contactInformation: "",
  footerText: "",
  logoPath: "",
  logoDataUrl: "",
  preparedByName: "",
  preparedByTitle: "",
  notedByName: "",
  notedByTitle: "",
  signaturePath: "",
  signatureDataUrl: "",
  signatureEnabled: false,
  defaultVatRate: "12",
  defaultTerms: "",
  defaultExclusions: "",
};

export function createSection(name = "General Requirements", sortOrder = 0): QuotationSection {
  return {
    id: crypto.randomUUID(),
    sectionNumber: "I.",
    name,
    sortOrder,
    items: [],
  };
}

export function normalizeQuotationSettings(value: Partial<QuotationSettings> | null | undefined): QuotationSettings {
  return {
    ...emptyQuotationSettings,
    ...(value ?? {}),
    signatureEnabled: Boolean(value?.signatureEnabled),
  };
}

export function createEmptyQuotation(settings: QuotationSettings = emptyQuotationSettings): QuotationDraft {
  const today = new Date().toISOString().slice(0, 10);

  return {
    qteNumber: "",
    quoteDate: today,
    client: "",
    clientAddress: "",
    attention: "",
    positionDepartment: "",
    projectName: "",
    projectLocation: "",
    subject: "",
    validity: "",
    salutation: "Gentlemen:",
    openingParagraph: "In response to your inquiry, we are pleased to quote you the following items:",
    preparedByName: settings.preparedByName,
    preparedByTitle: settings.preparedByTitle,
    notedByName: settings.notedByName,
    notedByTitle: settings.notedByTitle,
    termsConditions: settings.defaultTerms,
    exclusions: settings.defaultExclusions,
    overallFactor: "1.00",
    vatType: "VAT_INCLUSIVE",
    vatRate: settings.defaultVatRate || "12",
    sections: [createSection()],
  };
}
