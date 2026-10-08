/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyQuotation } from "../domain/defaults";
import { calculateQuotation } from "../domain/calculation";
import { loadSettings, listQuotations, saveQuotation, saveSettings, deleteQuotation } from "./storage";

describe("browser persistence fallback", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips configurable settings", async () => {
    const settings = {
      companyName: "Configured Company",
      companyAddress: "Configured Address",
      contactInformation: "Configured Contact",
      footerText: "Configured Footer",
      logoPath: "logo.png",
      logoDataUrl: "data:image/png;base64,AA==",
      preparedByName: "Prepared",
      preparedByTitle: "Title",
      notedByName: "Noted",
      notedByTitle: "President",
      signaturePath: "signature.png",
      signatureDataUrl: "data:image/png;base64,BB==",
      signatureEnabled: true,
      defaultVatRate: "12",
      defaultTerms: "Default terms",
      defaultExclusions: "Default exclusions",
    };

    await saveSettings(settings);

    await expect(loadSettings()).resolves.toEqual(settings);
  });

  it("supports create, edit, list, and delete quotation flows", async () => {
    const quotation = createEmptyQuotation({
      companyName: "Configured Company",
      companyAddress: "",
      contactInformation: "",
      footerText: "",
      logoPath: "",
      logoDataUrl: "",
      preparedByName: "Prepared",
      preparedByTitle: "Title",
      notedByName: "Noted",
      notedByTitle: "President",
      signaturePath: "",
      signatureDataUrl: "",
      signatureEnabled: false,
      defaultVatRate: "12",
      defaultTerms: "Default terms",
      defaultExclusions: "Default exclusions",
    });
    quotation.qteNumber = "QTE-PERSIST-001";
    const calculation = calculateQuotation(quotation);

    const saved = await saveQuotation(quotation, calculation);
    expect(saved.id).toBe(1);
    await expect(listQuotations()).resolves.toHaveLength(1);

    await saveQuotation({ ...saved, subject: "Edited subject" }, calculation);
    await expect(listQuotations()).resolves.toMatchObject([{ id: 1, subject: "Edited subject" }]);

    await deleteQuotation(saved.id!);
    await expect(listQuotations()).resolves.toEqual([]);
  });
});
