import { Copy, FileText, FolderOpen, Plus, Search, Settings, Trash2 } from "lucide-react";
import type { QuotationDraft } from "../domain/models";
import { formatCurrency, formatDate, vatLabel } from "../ui/format";
import { EmptyState, IconButton, PrimaryButton, TextField } from "./Controls";

export interface QuotationListRow {
  quotation: QuotationDraft;
  amount: string;
}

interface Props {
  rows: QuotationListRow[];
  search: string;
  onSearchChange: (value: string) => void;
  onNew: () => void;
  onOpen: (quotation: QuotationDraft) => void;
  onDuplicate: (quotation: QuotationDraft) => void;
  onDelete: (quotation: QuotationDraft) => void;
  onCostPdf: (quotation: QuotationDraft) => void;
  onSellingPdf: (quotation: QuotationDraft) => void;
  onSettings: () => void;
}

export function QuotationList({ rows, search, onSearchChange, onNew, onOpen, onDuplicate, onDelete, onCostPdf, onSellingPdf, onSettings }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-eyelectric-red">Quotation workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-eyelectric-navy">Saved QTEs</h1>
          <p className="mt-2 text-sm text-slate-500">Create, review, and export Eyelectric quotations locally.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSettings} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:border-eyelectric-navy hover:text-eyelectric-navy">
            <Settings size={16} /> Settings
          </button>
          <PrimaryButton onClick={onNew}><Plus size={17} /> New QTE</PrimaryButton>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-panel">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <TextField label="" aria-label="Search quotations" placeholder="Search QTE number, client, or project" value={search} onChange={(event) => onSearchChange(event.target.value)} className="[&>span]:hidden [&>input]:mt-0 [&>input]:pl-10" />
        </div>
        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{rows.length} quotation{rows.length === 1 ? "" : "s"}</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={search ? "No matching QTEs" : "No saved QTEs yet"} description={search ? "Try a different search term." : "Start with the project details, then add cost categories and items."} action={!search ? <PrimaryButton onClick={onNew}><Plus size={17} /> Create your first QTE</PrimaryButton> : undefined} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full border-collapse text-left text-sm">
              <thead className="bg-eyelectric-blue/60 text-[11px] font-bold uppercase tracking-[0.1em] text-eyelectric-navy">
                <tr>
                  <th className="px-4 py-3">QTE No.</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">VAT</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map(({ quotation, amount }) => (
                  <tr key={quotation.id ?? quotation.qteNumber} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 font-bold text-eyelectric-navy">{quotation.qteNumber || "Untitled QTE"}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(quotation.quoteDate)}</td>
                    <td className="px-4 py-4 font-medium text-slate-800">{quotation.client || "—"}</td>
                    <td className="max-w-[240px] truncate px-4 py-4 text-slate-600">{quotation.projectName || "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{vatLabel(quotation.vatType)}</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-800">{formatCurrency(amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton title="Open" onClick={() => onOpen(quotation)}><FolderOpen size={16} /></IconButton>
                        <IconButton title="Duplicate" onClick={() => onDuplicate(quotation)}><Copy size={16} /></IconButton>
                        <IconButton title="Cost PDF" onClick={() => onCostPdf(quotation)}><FileText size={16} /></IconButton>
                        <IconButton title="Selling PDF" onClick={() => onSellingPdf(quotation)}><FileText size={16} className="text-eyelectric-red" /></IconButton>
                        <IconButton title="Delete" onClick={() => onDelete(quotation)} className="hover:text-red-700"><Trash2 size={16} /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
