import { ArrowLeft, Calculator, ClipboardList, FileText, LayoutList, Save, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateQuotation } from "./domain/calculation";
import { createEmptyQuotation, emptyQuotationSettings } from "./domain/defaults";
import type { QuotationCalculation, QuotationDraft, QuotationSettings } from "./domain/models";
import { ItemsEditor } from "./components/ItemsEditor";
import { Panel, PrimaryButton, SecondaryButton } from "./components/Controls";
import { ProjectForm } from "./components/ProjectForm";
import { PricingPanel } from "./components/PricingPanel";
import { ReviewPanel } from "./components/ReviewPanel";
import { PdfWorkspace } from "./components/PdfWorkspace";
import { QuotationList, type QuotationListRow } from "./components/QuotationList";
import { SettingsPage } from "./components/SettingsPage";
import { formatCurrency } from "./ui/format";
import { deleteQuotation as deleteQuotationFromStorage, listQuotations, loadSettings, saveQuotation as saveQuotationToStorage, saveSettings as saveSettingsToStorage } from "./data/storage";

type AppMode = "list" | "editor" | "settings";
type EditorTab = "project" | "items" | "pricing" | "review" | "pdf";

const tabs: Array<{ id: EditorTab; label: string; icon: typeof ClipboardList }> = [
  { id: "project", label: "Project", icon: ClipboardList },
  { id: "items", label: "Items", icon: LayoutList },
  { id: "pricing", label: "Pricing", icon: Calculator },
  { id: "review", label: "Review", icon: FileText },
  { id: "pdf", label: "PDFs", icon: FileText },
];

function cloneQuotation(quotation: QuotationDraft): QuotationDraft {
  return JSON.parse(JSON.stringify(quotation)) as QuotationDraft;
}

function getCalculation(quotation: QuotationDraft): QuotationCalculation | null {
  try {
    return calculateQuotation(quotation);
  } catch {
    return null;
  }
}

export default function App() {
  const [mode, setMode] = useState<AppMode>("list");
  const [activeTab, setActiveTab] = useState<EditorTab>("project");
  const [search, setSearch] = useState("");
  const [quotations, setQuotations] = useState<QuotationDraft[]>([]);
  const [settings, setSettings] = useState<QuotationSettings>(emptyQuotationSettings);
  const [draft, setDraft] = useState<QuotationDraft | null>(null);
  const [requestedPdfType, setRequestedPdfType] = useState<"cost" | "selling">("cost");
  const [notice, setNotice] = useState<{ type: "info" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadSettings(), listQuotations()])
      .then(([loadedSettings, loadedQuotations]) => {
        if (!mounted) return;
        setSettings(loadedSettings);
        setQuotations(loadedQuotations);
      })
      .catch((error) => {
        if (!mounted) return;
        setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to load local QTE data." });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const rows: QuotationListRow[] = quotations
    .filter((quotation) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return [quotation.qteNumber, quotation.client, quotation.projectName].some((value) => value.toLowerCase().includes(query));
    })
    .map((quotation) => ({ quotation, amount: getCalculation(quotation)?.finalAmount ?? "0.00" }));

  function notify(text: string, type: "info" | "error" = "info") {
    setNotice({ text, type });
    window.setTimeout(() => setNotice((current) => current?.text === text ? null : current), 3500);
  }

  function openNew() {
    setDraft(createEmptyQuotation(settings));
    setRequestedPdfType("cost");
    setActiveTab("project");
    setMode("editor");
    setNotice(null);
  }

  function openQuotation(quotation: QuotationDraft) {
    setDraft(cloneQuotation(quotation));
    setRequestedPdfType("cost");
    setActiveTab("project");
    setMode("editor");
    setNotice(null);
  }

  function openPdf(quotation: QuotationDraft, type: "cost" | "selling") {
    setDraft(cloneQuotation(quotation));
    setRequestedPdfType(type);
    setActiveTab("pdf");
    setMode("editor");
    setNotice(null);
  }

  function duplicateQuotation(quotation: QuotationDraft) {
    const copy = cloneQuotation(quotation);
    copy.id = undefined;
    copy.revisionOfId = quotation.id;
    copy.qteNumber = "";
    copy.createdAt = undefined;
    copy.updatedAt = undefined;
    setDraft(copy);
    setActiveTab("project");
    setMode("editor");
    notify("Duplicate opened. Enter the new QTE number before saving.");
  }

  async function deleteQuotation(quotation: QuotationDraft) {
    if (!window.confirm(`Delete ${quotation.qteNumber || "this quotation"}?`)) return;
    try {
      if (quotation.id !== undefined) await deleteQuotationFromStorage(quotation.id);
      setQuotations((current) => current.filter((item) => item.id !== quotation.id));
      notify("Quotation deleted.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to delete the quotation.", "error");
    }
  }

  async function saveDraft() {
    if (!draft) return;
    if (!draft.qteNumber.trim()) {
      notify("Enter a QTE number before saving.", "error");
      setActiveTab("project");
      return;
    }

    const duplicateNumber = quotations.some((quotation) => quotation.id !== draft.id && quotation.qteNumber.trim().toLowerCase() === draft.qteNumber.trim().toLowerCase());
    if (duplicateNumber) {
      notify("That QTE number is already in use. Enter the manual QTE reference for this quotation.", "error");
      setActiveTab("project");
      return;
    }

    const calculation = getCalculation(draft);
    if (!calculation) {
      notify("Check the quotation values before saving.", "error");
      return;
    }

    try {
      const saved = await saveQuotationToStorage(draft, calculation);
      setQuotations((current) => {
        const existingIndex = current.findIndex((item) => item.id === saved.id);
        if (existingIndex === -1) return [...current, saved];
        const next = [...current];
        next[existingIndex] = saved;
        return next;
      });
      setDraft(saved);
      setMode("list");
      notify(`${saved.qteNumber} saved.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to save the quotation.", "error");
    }
  }

  function updateDraft(updater: (current: QuotationDraft) => QuotationDraft) {
    setDraft((current) => current ? updater(current) : current);
  }

  function changeDraftField<K extends keyof QuotationDraft>(field: K, value: QuotationDraft[K]) {
    updateDraft((current) => ({ ...current, [field]: value }));
  }

  function updateSettings<K extends keyof QuotationSettings>(field: K, value: QuotationSettings[K]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function saveSettings() {
    try {
      await saveSettingsToStorage(settings);
      setMode("list");
      notify("Settings saved to local application storage.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to save Settings.", "error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b-4 border-eyelectric-red bg-eyelectric-navy text-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <button onClick={() => { setMode("list"); setNotice(null); }} className="flex items-center gap-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-eyelectric-gold font-black text-eyelectric-navy">Q</span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-eyelectric-gold">Eyelectric</span>
              <span className="block text-lg font-bold leading-tight">QTE Maker</span>
            </span>
          </button>
          {mode !== "settings" ? <button onClick={() => setMode("settings")} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white"><SettingsIcon size={16} /> Settings</button> : null}
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        {notice ? <div role="status" className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-eyelectric-blue bg-eyelectric-blue/30 text-eyelectric-navy"}`}>{notice.text}</div> : null}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-500 shadow-panel">Loading local QTE data...</div>
        ) : mode === "settings" ? (
          <SettingsPage settings={settings} onChange={updateSettings} onSave={saveSettings} onBack={() => setMode("list")} />
        ) : mode === "editor" && draft ? (
          <Editor quotation={draft} activeTab={activeTab} calculation={getCalculation(draft)} settings={settings} requestedPdfType={requestedPdfType} onTabChange={setActiveTab} updateQuotation={updateDraft} onChangeField={changeDraftField} onBack={() => setMode("list")} onSave={saveDraft} />
        ) : (
          <QuotationList rows={rows} search={search} onSearchChange={setSearch} onNew={openNew} onOpen={openQuotation} onDuplicate={duplicateQuotation} onDelete={deleteQuotation} onCostPdf={(quotation) => openPdf(quotation, "cost")} onSellingPdf={(quotation) => openPdf(quotation, "selling")} onSettings={() => setMode("settings")} />
        )}
      </main>
    </div>
  );
}

function Editor({ quotation, activeTab, calculation, settings, requestedPdfType, onTabChange, updateQuotation, onChangeField, onBack, onSave }: { quotation: QuotationDraft; activeTab: EditorTab; calculation: QuotationCalculation | null; settings: QuotationSettings; requestedPdfType: "cost" | "selling"; onTabChange: (tab: EditorTab) => void; updateQuotation: (updater: (current: QuotationDraft) => QuotationDraft) => void; onChangeField: <K extends keyof QuotationDraft>(field: K, value: QuotationDraft[K]) => void; onBack: () => void; onSave: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-eyelectric-navy"><ArrowLeft size={16} /> Back to QTE list</button>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-eyelectric-red">Quotation editor</p>
          <h1 className="mt-2 text-3xl font-bold text-eyelectric-navy">{quotation.qteNumber || "New QTE"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={onBack}>Cancel</SecondaryButton>
          <PrimaryButton onClick={onSave}><Save size={16} /> Save QTE</PrimaryButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-2 shadow-panel">
        <nav className="flex flex-wrap gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => onTabChange(id)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${activeTab === id ? "bg-eyelectric-navy text-white" : "text-slate-500 hover:bg-slate-100 hover:text-eyelectric-navy"}`}><Icon size={16} /> {label}</button>
          ))}
        </nav>
        <div className="mr-2 hidden items-center gap-5 text-right text-xs md:flex">
          <SummaryChip label="Actual Cost" value={formatCurrency(calculation?.actualCost ?? "0.00")} />
          <SummaryChip label="Final Amount" value={formatCurrency(calculation?.finalAmount ?? "0.00")} accent />
        </div>
      </div>

      {activeTab === "project" ? <ProjectForm quotation={quotation} onChange={onChangeField} /> : null}
      {activeTab === "items" ? <ItemsEditor quotation={quotation} calculation={calculation} updateQuotation={updateQuotation} /> : null}
      {activeTab === "pricing" ? <PricingPanel quotation={quotation} calculation={calculation} onChange={onChangeField} /> : null}
      {activeTab === "review" ? <ReviewPanel quotation={quotation} calculation={calculation} onOpenPdf={() => onTabChange("pdf")} /> : null}
      {activeTab === "pdf" ? <PdfWorkspace key={`${quotation.id ?? "new"}-${requestedPdfType}`} quotation={quotation} calculation={calculation} settings={settings} initialDocumentType={requestedPdfType} /> : null}
    </div>
  );
}

function SummaryChip({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className={`mt-0.5 text-sm font-bold ${accent ? "text-eyelectric-red" : "text-eyelectric-navy"}`}>{value}</p></div>;
}

function EditorPlaceholder({ title, description }: { title: string; description: string }) {
  return <Panel eyebrow="Next step" title={title}><div className="flex min-h-[300px] items-center justify-center text-center"><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-eyelectric-blue font-black text-eyelectric-navy">Q</div><p className="mt-4 font-bold text-eyelectric-navy">{description}</p></div></div></Panel>;
}
