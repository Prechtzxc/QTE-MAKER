export type DecimalString = string;

export type VatType = "VAT_INCLUSIVE" | "VAT_EXCLUSIVE" | "NON_VAT";

export type CostType = "MATERIAL" | "LABOR" | "MATERIAL_LABOR" | "OTHER";

export type QuotationRowType = "item" | "heading";

export interface QuotationSettings {
  companyName: string;
  companyAddress: string;
  contactInformation: string;
  footerText: string;
  logoPath: string;
  logoDataUrl: string;
  preparedByName: string;
  preparedByTitle: string;
  notedByName: string;
  notedByTitle: string;
  signaturePath: string;
  signatureDataUrl: string;
  signatureEnabled: boolean;
  defaultVatRate: DecimalString;
  defaultTerms: string;
  defaultExclusions: string;
}

export interface QuotationItem {
  id: string;
  rowType: QuotationRowType;
  itemNumber: string;
  description: string;
  quantity: DecimalString;
  unit: string;
  costType: CostType;
  materialUnitCost: DecimalString;
  laborUnitCost: DecimalString;
  otherUnitCost: DecimalString;
  sortOrder: number;
}

export interface QuotationSection {
  id: string;
  sectionNumber: string;
  name: string;
  sortOrder: number;
  items: QuotationItem[];
}

export interface QuotationDraft {
  id?: number;
  qteNumber: string;
  revisionOfId?: number;
  quoteDate: string;
  client: string;
  clientAddress: string;
  attention: string;
  positionDepartment: string;
  projectName: string;
  projectLocation: string;
  subject: string;
  validity: string;
  salutation: string;
  openingParagraph: string;
  preparedByName: string;
  preparedByTitle: string;
  notedByName: string;
  notedByTitle: string;
  termsConditions: string;
  exclusions: string;
  overallFactor: DecimalString;
  vatType: VatType;
  vatRate: DecimalString;
  sections: QuotationSection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemCalculation {
  itemId: string;
  rowType: QuotationRowType;
  materialTotal: DecimalString;
  laborTotal: DecimalString;
  otherTotal: DecimalString;
  actualTotal: DecimalString;
  sellingUnitCost: DecimalString;
  sellingTotal: DecimalString;
}

export interface SectionCalculation {
  sectionId: string;
  materialTotal: DecimalString;
  laborTotal: DecimalString;
  otherTotal: DecimalString;
  actualTotal: DecimalString;
  sellingTotal: DecimalString;
  items: ItemCalculation[];
}

export interface QuotationCalculation {
  materialTotal: DecimalString;
  laborTotal: DecimalString;
  otherTotal: DecimalString;
  actualCost: DecimalString;
  overallFactor: DecimalString;
  sellingPriceBeforeVat: DecimalString;
  vatType: VatType;
  vatRate: DecimalString;
  vatAmount: DecimalString;
  finalAmount: DecimalString;
  sections: SectionCalculation[];
}
