import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

pdfMake.vfs = pdfFonts;

export function createPdfBlob(documentDefinition: TDocumentDefinitions): Promise<Blob> {
  return new Promise((resolve) => {
    pdfMake.createPdf(documentDefinition).getBlob(resolve);
  });
}

export function createPdfBuffer(documentDefinition: TDocumentDefinitions): Promise<Uint8Array> {
  return new Promise((resolve) => {
    pdfMake.createPdf(documentDefinition).getBuffer(resolve);
  });
}
