import { Download, Eye, FileText, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { QuotationCalculation, QuotationDraft, QuotationSettings } from "../domain/models";
import { isTauriRuntime, recordDocument } from "../data/storage";
import { buildCostPdfDocument } from "../pdf/costPdf";
import { buildSellingPdfDocument } from "../pdf/sellingPdf";
import { createPdfBlob, createPdfBuffer } from "../pdf/pdfMake";
import { Panel, PrimaryButton, SecondaryButton } from "./Controls";

interface Props {
  quotation: QuotationDraft;
  calculation: QuotationCalculation | null;
  settings: QuotationSettings;
  initialDocumentType?: "cost" | "selling";
  onCostPreview?: () => void;
}

export function PdfWorkspace({ quotation, calculation, settings, initialDocumentType = "cost" }: Props) {
  const [documentType, setDocumentType] = useState<"cost" | "selling">(initialDocumentType);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function definitionFor(kind: "cost" | "selling") {
    const assets = {
      logoDataUrl: settings.logoDataUrl || undefined,
      signatureDataUrl: settings.signatureDataUrl || undefined,
    };
    return kind === "cost"
      ? buildCostPdfDocument(quotation, calculation!, settings, assets)
      : buildSellingPdfDocument(quotation, calculation!, settings, assets);
  }

  async function preview(kind: "cost" | "selling") {
    if (!calculation) {
      setError("Enter valid quotation values before generating a PDF.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const definition = definitionFor(kind);
      const blob = await createPdfBlob(definition);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : `Unable to generate the ${kind === "cost" ? "Cost" : "Selling"} PDF.`);
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf(kind: "cost" | "selling") {
    if (!calculation) {
      setError("Enter valid quotation values before generating a PDF.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const definition = definitionFor(kind);
      const fileName = `${safeFilePart(quotation.qteNumber || "quotation")}-${kind}.pdf`;
      if (isTauriRuntime()) {
        const filePath = await save({
          title: `Export ${kind === "cost" ? "Cost" : "Selling"} PDF`,
          defaultPath: fileName,
          filters: [{ name: "PDF document", extensions: ["pdf"] }],
        });
        if (!filePath) return;
        await writeFile(filePath, await createPdfBuffer(definition));
        if (quotation.id !== undefined) await recordDocument(quotation.id, kind === "cost" ? "COST" : "SELLING", filePath);
        setStatus(`PDF saved to ${filePath}`);
      } else {
        const blob = await createPdfBlob(definition);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        setStatus(`Downloaded ${fileName}`);
      }
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : `Unable to export the ${kind === "cost" ? "Cost" : "Selling"} PDF.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel eyebrow="Documents" title="PDF preview">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex gap-2">
          <button onClick={() => setDocumentType("cost")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${documentType === "cost" ? "bg-eyelectric-navy text-white" : "bg-slate-100 text-slate-500"}`}><FileText size={16} /> Cost PDF</button>
          <button onClick={() => setDocumentType("selling")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${documentType === "selling" ? "bg-eyelectric-navy text-white" : "bg-slate-100 text-slate-500"}`}><FileText size={16} /> Selling PDF</button>
        </div>
        <div className="flex gap-2"><SecondaryButton onClick={() => preview(documentType)} disabled={busy}><Eye size={16} /> {busy ? "Generating..." : `Preview ${documentType === "cost" ? "Cost" : "Selling"}`}</SecondaryButton><PrimaryButton onClick={() => exportPdf(documentType)} disabled={busy}><Download size={16} /> Export PDF</PrimaryButton></div>
      </div>

      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
      {status ? <div className="mt-4 rounded-lg border border-eyelectric-blue bg-eyelectric-blue/30 px-4 py-3 text-sm font-medium text-eyelectric-navy">{status}</div> : null}
      <div className="mt-5 min-h-[620px] overflow-hidden rounded-xl border border-slate-300 bg-slate-100">
        {previewUrl ? <iframe title={`${documentType === "cost" ? "Cost" : "Selling"} PDF preview`} src={previewUrl} className="h-[720px] w-full bg-white" /> : <div className="flex min-h-[620px] flex-col items-center justify-center px-6 text-center text-slate-400">{busy ? <LoaderCircle className="animate-spin" size={32} /> : <FileText size={42} />}<p className="mt-3 text-sm font-medium">Generate a {documentType === "cost" ? "Cost" : "Selling"} PDF preview to inspect the layout.</p></div>}
      </div>
    </Panel>
  );
}

function safeFilePart(value: string): string {
  return value.trim().replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, "-") || "quotation";
}
