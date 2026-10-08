import { ArrowLeft, FileText, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { QuotationSettings } from "../domain/models";
import { IconButton, Panel, PrimaryButton, SecondaryButton, TextAreaField, TextField } from "./Controls";

interface Props {
  settings: QuotationSettings;
  onChange: <K extends keyof QuotationSettings>(field: K, value: QuotationSettings[K]) => void;
  onSave: () => void | Promise<void>;
  onBack: () => void;
}

export function SettingsPage({ settings, onChange, onSave, onBack }: Props) {
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-eyelectric-navy"><ArrowLeft size={16} /> Back to QTEs</button>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-eyelectric-red">Local configuration</p>
          <h1 className="mt-2 text-3xl font-bold text-eyelectric-navy">Settings</h1>
          <p className="mt-2 text-sm text-slate-500">Configure the branding and defaults used by new quotations.</p>
        </div>
        <PrimaryButton onClick={save} disabled={saving}><Save size={16} /> {saving ? "Saving..." : "Save settings"}</PrimaryButton>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel eyebrow="Branding" title="Eyelectric document identity">
          <div className="space-y-4">
            <TextField label="Company Name" value={settings.companyName} onChange={(event) => onChange("companyName", event.target.value)} placeholder="Company name" />
            <TextAreaField label="Company Address" rows={3} value={settings.companyAddress} onChange={(event) => onChange("companyAddress", event.target.value)} placeholder="Address shown in the document footer" />
            <TextAreaField label="Contact Information" rows={3} value={settings.contactInformation} onChange={(event) => onChange("contactInformation", event.target.value)} placeholder="Telephone, mobile, email, website" />
            <TextAreaField label="Footer Text" rows={2} value={settings.footerText} onChange={(event) => onChange("footerText", event.target.value)} placeholder="Additional footer text" />
             <AssetField label="Logo image" path={settings.logoPath} dataUrl={settings.logoDataUrl} accept="image/png,image/jpeg,image/svg+xml" onPathChange={(value) => onChange("logoPath", value)} onDataUrlChange={(value) => onChange("logoDataUrl", value)} />
          </div>
        </Panel>

        <Panel eyebrow="Signatories" title="Default prepared and noted by">
          <div className="space-y-4">
            <TextField label="Prepared By Default Name" value={settings.preparedByName} onChange={(event) => onChange("preparedByName", event.target.value)} />
            <TextField label="Prepared By Default Title" value={settings.preparedByTitle} onChange={(event) => onChange("preparedByTitle", event.target.value)} />
            <TextField label="Noted By Default Name" value={settings.notedByName} onChange={(event) => onChange("notedByName", event.target.value)} />
            <TextField label="Noted By Default Title" value={settings.notedByTitle} onChange={(event) => onChange("notedByTitle", event.target.value)} />
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={settings.signatureEnabled} onChange={(event) => onChange("signatureEnabled", event.target.checked)} className="h-4 w-4 accent-eyelectric-navy" />
              Include configured signature image
            </label>
             <AssetField label="Signature image" path={settings.signaturePath} dataUrl={settings.signatureDataUrl} accept="image/png,image/jpeg,image/svg+xml" disabled={!settings.signatureEnabled} onPathChange={(value) => onChange("signaturePath", value)} onDataUrlChange={(value) => onChange("signatureDataUrl", value)} />
          </div>
        </Panel>

        <Panel eyebrow="Defaults" title="New quotation defaults">
          <div className="space-y-4">
            <TextField label="Default VAT Rate (%)" inputMode="decimal" value={settings.defaultVatRate} onChange={(event) => onChange("defaultVatRate", event.target.value)} />
            <TextAreaField label="Default Terms and Conditions" rows={10} value={settings.defaultTerms} onChange={(event) => onChange("defaultTerms", event.target.value)} placeholder="Loaded into each new quotation and editable there" />
            <TextAreaField label="Default Exclusions" rows={10} value={settings.defaultExclusions} onChange={(event) => onChange("defaultExclusions", event.target.value)} placeholder="Loaded into each new quotation and editable there" />
          </div>
        </Panel>

        <Panel eyebrow="Storage" title="Local-only application data">
          <div className="rounded-lg border border-eyelectric-blue bg-eyelectric-blue/20 p-4 text-sm leading-6 text-eyelectric-navy">
            Quotations, settings, and generated document records will be stored in the Windows application data folder. PDF export will still let you choose a destination on the local machine.
          </div>
          <div className="mt-4">
            <SecondaryButton onClick={onBack}><ArrowLeft size={16} /> Return to QTE list</SecondaryButton>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AssetField({ label, path, dataUrl, accept, disabled = false, onPathChange, onDataUrlChange }: { label: string; path: string; dataUrl: string; accept: string; disabled?: boolean; onPathChange: (value: string) => void; onDataUrlChange: (value: string) => void }) {
  async function chooseAsset(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const encoded = await fileToDataUrl(file);
    onPathChange(file.name);
    onDataUrlChange(encoded);
  }

  function clearAsset() {
    onPathChange("");
    onDataUrlChange("");
  }

  return (
    <div className={`rounded-lg border border-slate-200 p-3 ${disabled ? "bg-slate-50 opacity-60" : "bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</span>
        {(path || dataUrl) && !disabled ? <IconButton title={`Clear ${label}`} onClick={clearAsset}><Trash2 size={15} /></IconButton> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-eyelectric-navy hover:text-eyelectric-navy">
          <FileText size={16} /> Choose image
          <input type="file" accept={accept} disabled={disabled} onChange={chooseAsset} className="sr-only" />
        </label>
        <span className="min-w-0 truncate text-xs text-slate-500">{path || (dataUrl ? "Embedded image asset" : "No image selected")}</span>
      </div>
      <TextField label="Asset label / path" value={path} disabled={disabled} onChange={(event) => onPathChange(event.target.value)} placeholder="Optional local asset reference" className="mt-3" />
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}
