import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { isCostFieldEnabled } from "../domain/calculation";
import type { QuotationCalculation, QuotationDraft, QuotationItem, QuotationSection } from "../domain/models";
import { formatCurrency } from "../ui/format";
import { DangerButton, IconButton, Panel, PrimaryButton, SecondaryButton } from "./Controls";

interface Props {
  quotation: QuotationDraft;
  calculation: QuotationCalculation | null;
  updateQuotation: (updater: (current: QuotationDraft) => QuotationDraft) => void;
}

function emptyItem(sortOrder: number, rowType: "item" | "heading"): QuotationItem {
  return {
    id: crypto.randomUUID(),
    rowType,
    itemNumber: "",
    description: rowType === "heading" ? "New heading" : "",
    quantity: "1",
    unit: "lot",
    costType: "MATERIAL",
    materialUnitCost: "0",
    laborUnitCost: "0",
    otherUnitCost: "0",
    sortOrder,
  };
}

function updateSection(quotation: QuotationDraft, sectionId: string, updater: (section: QuotationSection) => QuotationSection): QuotationDraft {
  return {
    ...quotation,
    sections: quotation.sections.map((section) => section.id === sectionId ? updater(section) : section),
  };
}

export function ItemsEditor({ quotation, calculation, updateQuotation }: Props) {
  const selectedSections = quotation.sections;

  function addSection() {
    updateQuotation((current) => ({
      ...current,
      sections: [...current.sections, {
        id: crypto.randomUUID(),
        sectionNumber: `${current.sections.length + 1}.`,
        name: "New Category",
        sortOrder: current.sections.length,
        items: [],
      }],
    }));
  }

  function moveSection(sectionIndex: number, direction: -1 | 1) {
    updateQuotation((current) => {
      const nextIndex = sectionIndex + direction;
      if (nextIndex < 0 || nextIndex >= current.sections.length) return current;
      const sections = [...current.sections];
      [sections[sectionIndex], sections[nextIndex]] = [sections[nextIndex], sections[sectionIndex]];
      return { ...current, sections: sections.map((section, index) => ({ ...section, sortOrder: index })) };
    });
  }

  function deleteSection(sectionId: string) {
    const section = quotation.sections.find((item) => item.id === sectionId);
    if (!section || !window.confirm(`Delete ${section.name || "this category"} and its items?`)) return;
    updateQuotation((current) => ({ ...current, sections: current.sections.filter((item) => item.id !== sectionId) }));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
      <Panel eyebrow="Cost structure" title="Categories" className="h-fit xl:sticky xl:top-5">
        <div className="space-y-2">
          {selectedSections.map((section, index) => (
            <div key={section.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <GripVertical size={15} className="mt-2 shrink-0 text-slate-400" />
                <input value={section.name} onChange={(event) => updateQuotation((current) => updateSection(current, section.id, (item) => ({ ...item, name: event.target.value })))} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-eyelectric-navy outline-none" />
              </div>
              <div className="mt-2 flex items-center justify-between pl-6 text-[11px] text-slate-400">
                <span>{section.items.filter((item) => item.rowType === "item").length} items</span>
                <div className="flex gap-0.5">
                  <IconButton title="Move category up" onClick={() => moveSection(index, -1)} disabled={index === 0}><ChevronUp size={14} /></IconButton>
                  <IconButton title="Move category down" onClick={() => moveSection(index, 1)} disabled={index === selectedSections.length - 1}><ChevronDown size={14} /></IconButton>
                  <IconButton title="Delete category" onClick={() => deleteSection(section.id)}><Trash2 size={14} /></IconButton>
                </div>
              </div>
            </div>
          ))}
          <SecondaryButton onClick={addSection} className="w-full"><Plus size={15} /> Add category</SecondaryButton>
        </div>
      </Panel>

      <div className="space-y-5">
        {selectedSections.map((section, sectionIndex) => {
          const sectionCalculation = calculation?.sections.find((item) => item.sectionId === section.id);
          return (
            <SectionEditor
              key={section.id}
              quotation={quotation}
              section={section}
              sectionIndex={sectionIndex}
              sectionCalculation={sectionCalculation}
              updateQuotation={updateQuotation}
            />
          );
        })}
        {selectedSections.length === 0 ? (
          <Panel>
            <div className="py-10 text-center text-sm text-slate-500">Add a category to begin entering costs.</div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

function SectionEditor({ quotation, section, sectionIndex, sectionCalculation, updateQuotation }: { quotation: QuotationDraft; section: QuotationSection; sectionIndex: number; sectionCalculation?: QuotationCalculation["sections"][number]; updateQuotation: Props["updateQuotation"] }) {
  function addRow(rowType: "item" | "heading") {
    updateQuotation((current) => updateSection(current, section.id, (item) => ({ ...item, items: [...item.items, emptyItem(item.items.length, rowType)] })));
  }

  function deleteItem(itemId: string) {
    updateQuotation((current) => updateSection(current, section.id, (item) => ({ ...item, items: item.items.filter((child) => child.id !== itemId) })));
  }

  function moveItem(itemIndex: number, direction: -1 | 1) {
    updateQuotation((current) => updateSection(current, section.id, (item) => {
      const nextIndex = itemIndex + direction;
      if (nextIndex < 0 || nextIndex >= item.items.length) return item;
      const items = [...item.items];
      [items[itemIndex], items[nextIndex]] = [items[nextIndex], items[itemIndex]];
      return { ...item, items: items.map((child, index) => ({ ...child, sortOrder: index })) };
    }));
  }

  return (
    <Panel
      eyebrow={`Category ${sectionIndex + 1}`}
      title={`${section.sectionNumber || `${sectionIndex + 1}.`} ${section.name || "Unnamed category"}`}
      actions={
        <div className="flex gap-2">
          <SecondaryButton onClick={() => addRow("heading")} className="px-3 py-1.5 text-xs"><Plus size={14} /> Heading</SecondaryButton>
          <PrimaryButton onClick={() => addRow("item")} className="px-3 py-1.5 text-xs"><Plus size={14} /> Item</PrimaryButton>
        </div>
      }
      className="overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="w-16 px-2 py-3 text-left">Item</th>
              <th className="min-w-[260px] px-2 py-3 text-left">Description</th>
              <th className="w-20 px-2 py-3 text-left">Qty</th>
              <th className="w-24 px-2 py-3 text-left">Unit</th>
              <th className="w-36 px-2 py-3 text-left">Cost Type</th>
              <th className="w-28 px-2 py-3 text-right">Material</th>
              <th className="w-28 px-2 py-3 text-right">Labor</th>
              <th className="w-28 px-2 py-3 text-right">Other</th>
              <th className="w-32 px-2 py-3 text-right">Actual Total</th>
              <th className="w-20 px-2 py-3 text-right">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {section.items.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-400">No items in this category yet.</td></tr>
            ) : section.items.map((item, itemIndex) => {
              const itemCalculation = sectionCalculation?.items.find((row) => row.itemId === item.id);
              if (item.rowType === "heading") {
                return (
                  <tr key={item.id} className="bg-[#f8dec7]">
                    <td className="px-2 py-2 text-xs font-bold text-eyelectric-navy">Heading</td>
                    <td colSpan={8} className="px-2 py-2">
                      <input value={item.description} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { description: event.target.value })} className="w-full bg-transparent font-bold uppercase text-eyelectric-navy outline-none" />
                    </td>
                    <td className="px-2 py-2 text-right"><RowActions itemIndex={itemIndex} itemCount={section.items.length} onMove={moveItem} onDelete={() => deleteItem(item.id)} /></td>
                  </tr>
                );
              }

              return (
                <tr key={item.id} className="align-top">
                  <td className="px-2 py-2"><input value={item.itemNumber} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { itemNumber: event.target.value })} className="w-14 rounded border border-transparent px-2 py-1 text-sm outline-none hover:border-slate-300 focus:border-eyelectric-navy" placeholder="1" /></td>
                  <td className="px-2 py-2"><input value={item.description} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { description: event.target.value })} className="w-full min-w-[240px] rounded border border-transparent px-2 py-1 text-sm outline-none hover:border-slate-300 focus:border-eyelectric-navy" placeholder="Cost item description" /></td>
                  <td className="px-2 py-2"><input value={item.quantity} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { quantity: event.target.value })} className="w-16 rounded border border-transparent px-2 py-1 text-right text-sm outline-none hover:border-slate-300 focus:border-eyelectric-navy" inputMode="decimal" /></td>
                  <td className="px-2 py-2"><input value={item.unit} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { unit: event.target.value })} className="w-20 rounded border border-transparent px-2 py-1 text-sm outline-none hover:border-slate-300 focus:border-eyelectric-navy" placeholder="lot" /></td>
                  <td className="px-2 py-2">
                    <select value={item.costType} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { costType: event.target.value as QuotationItem["costType"] })} className="w-32 rounded border border-transparent bg-white px-1 py-1 text-xs outline-none hover:border-slate-300 focus:border-eyelectric-navy">
                      <option value="MATERIAL">Material</option>
                      <option value="LABOR">Labor</option>
                      <option value="MATERIAL_LABOR">Material + Labor</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </td>
                  <td className="px-2 py-2"><input disabled={!isCostFieldEnabled(item.costType, "material")} value={item.materialUnitCost} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { materialUnitCost: event.target.value })} className="w-24 rounded border border-transparent px-2 py-1 text-right text-sm outline-none hover:border-slate-300 focus:border-eyelectric-navy disabled:bg-slate-100" inputMode="decimal" /></td>
                  <td className="px-2 py-2"><input disabled={!isCostFieldEnabled(item.costType, "labor")} value={item.laborUnitCost} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { laborUnitCost: event.target.value })} className="w-24 rounded border border-transparent px-2 py-1 text-right text-sm outline-none hover:border-slate-300 focus:border-eyelectric-navy disabled:bg-slate-100" inputMode="decimal" /></td>
                  <td className="px-2 py-2"><input disabled={!isCostFieldEnabled(item.costType, "other")} value={item.otherUnitCost} onChange={(event) => updateItem(updateQuotation, section.id, item.id, { otherUnitCost: event.target.value })} className="w-24 rounded border border-transparent px-2 py-1 text-right text-sm outline-none hover:border-slate-300 focus:border-eyelectric-navy disabled:bg-slate-100" inputMode="decimal" /></td>
                  <td className="px-2 py-2 text-right font-bold text-slate-700">{formatCurrency(itemCalculation?.actualTotal ?? "0.00")}</td>
                  <td className="px-2 py-2 text-right"><RowActions itemIndex={itemIndex} itemCount={section.items.length} onMove={moveItem} onDelete={() => deleteItem(item.id)} /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-[#f8dec7] text-sm font-bold text-eyelectric-navy">
            <tr>
              <td colSpan={8} className="px-3 py-3 text-right">Category Actual Total</td>
              <td className="px-2 py-3 text-right">{formatCurrency(sectionCalculation?.actualTotal ?? "0.00")}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}

function RowActions({ itemIndex, itemCount, onMove, onDelete }: { itemIndex: number; itemCount: number; onMove: (index: number, direction: -1 | 1) => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-0.5">
      <IconButton title="Move up" onClick={() => onMove(itemIndex, -1)} disabled={itemIndex === 0}><ChevronUp size={14} /></IconButton>
      <IconButton title="Move down" onClick={() => onMove(itemIndex, 1)} disabled={itemIndex === itemCount - 1}><ChevronDown size={14} /></IconButton>
      <IconButton title="Delete item" onClick={onDelete} className="hover:text-red-700"><Trash2 size={14} /></IconButton>
    </div>
  );
}

function updateItem(updateQuotation: Props["updateQuotation"], sectionId: string, itemId: string, changes: Partial<QuotationItem>) {
  updateQuotation((current) => updateSection(current, sectionId, (section) => ({
    ...section,
    items: section.items.map((item) => item.id === itemId ? { ...item, ...changes } : item),
  })));
}
