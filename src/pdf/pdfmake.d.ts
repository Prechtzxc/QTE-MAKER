declare module "pdfmake/build/pdfmake" {
  import type { TDocumentDefinitions } from "pdfmake/interfaces";

  interface PdfDocument {
    getBlob(callback: (blob: Blob) => void): void;
    getBuffer(callback: (buffer: Uint8Array) => void): void;
    download(fileName?: string, callback?: () => void): void;
    open(): void;
  }

  interface PdfMake {
    vfs: Record<string, string>;
    createPdf(documentDefinition: TDocumentDefinitions): PdfDocument;
  }

  const pdfMake: PdfMake;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const pdfFonts: Record<string, string>;
  export default pdfFonts;
}
