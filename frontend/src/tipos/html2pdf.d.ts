declare module 'html2pdf.js' {
  interface OpcionesHtml2Pdf {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: Record<string, unknown>;
    pagebreak?: { mode?: string | string[]; before?: string; after?: string; avoid?: string };
  }

  interface InstanciaJsPdf {
    output(tipo: 'bloburl' | 'blob' | 'datauristring'): string | Blob;
  }

  interface TrabajoHtml2Pdf {
    set(opciones: OpcionesHtml2Pdf): TrabajoHtml2Pdf;
    from(elemento: HTMLElement): TrabajoHtml2Pdf;
    toPdf(): TrabajoHtml2Pdf;
    get(clave: string): Promise<unknown>;
    outputPdf(tipo?: string): Promise<Blob>;
  }

  export default function html2pdf(): TrabajoHtml2Pdf;
}
