import { Calculator, Info } from "lucide-react";
import type { QuotationCalculation, QuotationDraft } from "../domain/models";
import { formatCurrency } from "../ui/format";
import { Panel, SelectField, TextField } from "./Controls";

interface Props {
  quotation: QuotationDraft;
  calculation: QuotationCalculation | null;
  onChange: <K extends keyof QuotationDraft>(field: K, value: QuotationDraft[K]) => void;
}

export function PricingPanel({ quotation, calculation, onChange }: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel eyebrow="Pricing rule" title="Quotation controls">
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-eyelectric-gold bg-eyelectric-gold/20 p-4">
            <div className="flex items-start gap-3">
              <Calculator className="mt-0.5 shrink-0 text-eyelectric-navy" size={20} />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-eyelectric-navy">One overall factor</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">The same factor applies to the complete actual cost, including every category and General Requirements.</p>
              </div>
            </div>
             <TextField label="Overall Pricing Factor" hint="Applied to each rounded actual line total" className="mt-4" inputMode="decimal" min="0" step="0.01" value={quotation.overallFactor} onChange={(event) => onChange("overallFactor", event.target.value)} placeholder="1.70" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <SelectField label="VAT Type" value={quotation.vatType} onChange={(event) => onChange("vatType", event.target.value as QuotationDraft["vatType"]) }>
              <option value="VAT_INCLUSIVE">VAT Inclusive</option>
              <option value="VAT_EXCLUSIVE">VAT Exclusive</option>
              <option value="NON_VAT">Non-VAT</option>
            </SelectField>
             <TextField label="VAT Rate (%)" hint={quotation.vatType === "NON_VAT" ? "Not charged for Non-VAT" : "Calculated after selling price"} inputMode="decimal" min="0" max="100" step="0.01" value={quotation.vatRate} onChange={(event) => onChange("vatRate", event.target.value)} placeholder="12" />
          </div>

          <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <Info size={16} className="mt-0.5 shrink-0 text-eyelectric-navy" />
             <p>Each material, labor, other, actual, and selling line total is rounded to two decimals with Decimal.js ROUND_HALF_UP before totals are summed. VAT is calculated from the resulting selling price before VAT and rounded to two decimals.</p>
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Live result" title="Quotation amount">
        <div className="grid gap-3 sm:grid-cols-2">
          <AmountCard label="Material Total" value={formatCurrency(calculation?.materialTotal ?? "0.00")} />
          <AmountCard label="Labor Total" value={formatCurrency(calculation?.laborTotal ?? "0.00")} />
          <AmountCard label="Other Total" value={formatCurrency(calculation?.otherTotal ?? "0.00")} />
          <AmountCard label="Actual Cost" value={formatCurrency(calculation?.actualCost ?? "0.00")} />
          <AmountCard label="Selling Price Before VAT" value={formatCurrency(calculation?.sellingPriceBeforeVat ?? "0.00")} />
          <AmountCard label={`VAT (${quotation.vatRate || "0"}%)`} value={formatCurrency(calculation?.vatAmount ?? "0.00")} muted />
          <AmountCard label="Final Quotation Amount" value={formatCurrency(calculation?.finalAmount ?? "0.00")} accent />
        </div>
        <div className="mt-5 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-4"><span>Overall Pricing Factor</span><strong className="text-eyelectric-navy">{quotation.overallFactor || "0"}</strong></div>
          <div className="mt-2 flex items-center justify-between gap-4"><span>VAT Treatment</span><strong className="text-eyelectric-navy">{quotation.vatType === "VAT_INCLUSIVE" ? "VAT Inclusive" : quotation.vatType === "VAT_EXCLUSIVE" ? "VAT Exclusive" : "Non-VAT"}</strong></div>
          <div className="mt-2 flex items-center justify-between gap-4"><span>VAT Charged</span><strong className="text-eyelectric-navy">{quotation.vatType === "VAT_INCLUSIVE" ? `${quotation.vatRate || "0"}%` : "PHP 0.00"}</strong></div>
        </div>
        {!calculation ? <p className="mt-4 text-sm font-bold text-red-700">Enter valid numeric pricing values to continue.</p> : null}
      </Panel>
    </div>
  );
}

function AmountCard({ label, value, accent = false, muted = false }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-eyelectric-red bg-eyelectric-red/5" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-bold ${accent ? "text-eyelectric-red" : muted ? "text-slate-500" : "text-eyelectric-navy"}`}>{value}</p>
    </div>
  );
}
