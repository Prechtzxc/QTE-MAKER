import { describe, expect, it } from "vitest";
import { createEmptyQuotation, emptyQuotationSettings } from "./defaults";

describe("createEmptyQuotation", () => {
  it("loads configurable defaults without generating a QTE reference", () => {
    const quotation = createEmptyQuotation({
      ...emptyQuotationSettings,
      preparedByName: "Prepared Person",
      preparedByTitle: "Operations",
      notedByName: "Noted Person",
      notedByTitle: "President",
      defaultTerms: "Configured terms",
      defaultExclusions: "Configured exclusions",
    });

    expect(quotation.qteNumber).toBe("");
    expect(quotation.preparedByName).toBe("Prepared Person");
    expect(quotation.notedByTitle).toBe("President");
    expect(quotation.termsConditions).toBe("Configured terms");
    expect(quotation.exclusions).toBe("Configured exclusions");
    expect("contingency" in quotation).toBe(false);
  });
});
