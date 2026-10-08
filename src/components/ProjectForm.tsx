import type { QuotationDraft } from "../domain/models";
import { Panel, TextAreaField, TextField } from "./Controls";

interface Props {
  quotation: QuotationDraft;
  onChange: <K extends keyof QuotationDraft>(field: K, value: QuotationDraft[K]) => void;
}

export function ProjectForm({ quotation, onChange }: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
      <Panel eyebrow="Project information" title="Quotation details">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="QTE Number" hint="Manual reference" required placeholder="QTE-26-001-EM" value={quotation.qteNumber} onChange={(event) => onChange("qteNumber", event.target.value)} />
          <TextField label="Date" type="date" value={quotation.quoteDate} onChange={(event) => onChange("quoteDate", event.target.value)} />
          <TextField label="Client" placeholder="Client company or site" value={quotation.client} onChange={(event) => onChange("client", event.target.value)} />
          <TextField label="Attention" placeholder="Contact person" value={quotation.attention} onChange={(event) => onChange("attention", event.target.value)} />
          <TextField label="Position / Department" placeholder="Corporate Purchasing" value={quotation.positionDepartment} onChange={(event) => onChange("positionDepartment", event.target.value)} />
          <TextField label="Validity" placeholder="Forty Five (45) Days" value={quotation.validity} onChange={(event) => onChange("validity", event.target.value)} />
          <TextAreaField label="Client Address" className="md:col-span-2" rows={2} placeholder="Client address" value={quotation.clientAddress} onChange={(event) => onChange("clientAddress", event.target.value)} />
          <TextField label="Project Name" placeholder="FPM Spice Extension Improvement" value={quotation.projectName} onChange={(event) => onChange("projectName", event.target.value)} />
          <TextField label="Project Location" placeholder="Project location" value={quotation.projectLocation} onChange={(event) => onChange("projectLocation", event.target.value)} />
          <TextField label="Subject" className="md:col-span-2" placeholder="Quotation subject" value={quotation.subject} onChange={(event) => onChange("subject", event.target.value)} />
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel eyebrow="Letter" title="Opening text">
          <div className="space-y-4">
            <TextField label="Salutation" value={quotation.salutation} onChange={(event) => onChange("salutation", event.target.value)} />
            <TextAreaField label="Opening Paragraph" rows={5} value={quotation.openingParagraph} onChange={(event) => onChange("openingParagraph", event.target.value)} />
          </div>
        </Panel>
        <Panel eyebrow="Signatories" title="Prepared and noted by">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <TextField label="Prepared By" value={quotation.preparedByName} onChange={(event) => onChange("preparedByName", event.target.value)} />
            <TextField label="Prepared By Title" value={quotation.preparedByTitle} onChange={(event) => onChange("preparedByTitle", event.target.value)} />
            <TextField label="Noted By" value={quotation.notedByName} onChange={(event) => onChange("notedByName", event.target.value)} />
            <TextField label="Noted By Title" value={quotation.notedByTitle} onChange={(event) => onChange("notedByTitle", event.target.value)} />
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Document text" title="Terms and exclusions" className="xl:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField label="Terms and Conditions" rows={9} value={quotation.termsConditions} onChange={(event) => onChange("termsConditions", event.target.value)} />
          <TextAreaField label="Exclusions" rows={9} value={quotation.exclusions} onChange={(event) => onChange("exclusions", event.target.value)} />
        </div>
      </Panel>
    </div>
  );
}
