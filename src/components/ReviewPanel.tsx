import type { QuotationCalculation, QuotationDraft } from "../domain/models";
import { formatCurrency } from "../ui/format";
import { Panel, SecondaryButton } from "./Controls";

interface Props {
  quotation: QuotationDraft;
  calculation: QuotationCalculation | null;
  onOpenPdf: () => void;
}

export function ReviewPanel({ quotation, calculation, onOpenPdf }: Props) {
  return (
    <div className="space-y-5">
      <Panel eyebrow="Internal review" title="Cost summary" actions={<SecondaryButton onClick={onOpenPdf}>Open PDF tab</SecondaryButton>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReviewValue label="Actual Cost" value={formatCurrency(calculation?.actualCost ?? "0.00")} />
          <ReviewValue label="Pricing Factor" value={quotation.overallFactor || "0.00"} />
          <ReviewValue label="Selling Before VAT" value={formatCurrency(calculation?.sellingPriceBeforeVat ?? "0.00")} />
          <ReviewValue label="VAT" value={formatCurrency(calculation?.vatAmount ?? "0.00")} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-eyelectric-navy px-5 py-4 text-white">
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-eyelectric-gold">Final quotation amount</p><p className="mt-1 text-xs text-white/70">{quotation.vatType === "VAT_INCLUSIVE" ? "VAT Included" : quotation.vatType === "VAT_EXCLUSIVE" ? "VAT Excluded" : "Non-VAT"}</p></div>
          <strong className="text-2xl">{formatCurrency(calculation?.finalAmount ?? "0.00")}</strong>
        </div>
      </Panel>

      <Panel eyebrow="Category totals" title="Rounded cost breakdown">
        <div className="overflow-x-auto">
          <table className="min-w-[650px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <tr><th className="px-3 py-3">Category</th><th className="px-3 py-3 text-right">Material</th><th className="px-3 py-3 text-right">Labor</th><th className="px-3 py-3 text-right">Other</th><th className="px-3 py-3 text-right">Actual Total</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotation.sections.map((section, index) => {
                const sectionResult = calculation?.sections.find((item) => item.sectionId === section.id);
                return <tr key={section.id}><td className="px-3 py-3 font-bold text-eyelectric-navy">{section.sectionNumber || `${index + 1}.`} {section.name || "Unnamed category"}</td><td className="px-3 py-3 text-right">{formatCurrency(sectionResult?.materialTotal ?? "0.00")}</td><td className="px-3 py-3 text-right">{formatCurrency(sectionResult?.laborTotal ?? "0.00")}</td><td className="px-3 py-3 text-right">{formatCurrency(sectionResult?.otherTotal ?? "0.00")}</td><td className="px-3 py-3 text-right font-bold">{formatCurrency(sectionResult?.actualTotal ?? "0.00")}</td></tr>;
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 font-bold text-eyelectric-navy"><tr><td className="px-3 py-3">Total</td><td className="px-3 py-3 text-right">{formatCurrency(calculation?.materialTotal ?? "0.00")}</td><td className="px-3 py-3 text-right">{formatCurrency(calculation?.laborTotal ?? "0.00")}</td><td className="px-3 py-3 text-right">{formatCurrency(calculation?.otherTotal ?? "0.00")}</td><td className="px-3 py-3 text-right">{formatCurrency(calculation?.actualCost ?? "0.00")}</td></tr></tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-2 text-lg font-bold text-eyelectric-navy">{value}</p></div>;
}
