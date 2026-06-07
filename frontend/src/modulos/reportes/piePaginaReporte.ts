import type { RedSocialPieReporte } from './emisorNegocioReporte';

export interface DatosPiePaginaReporte {
  tituloReporte: string;
  notaPieReporte: string;
  negocioNombre: string;
  negocioDireccion: string;
  negocioLocalidad: string;
  negocioTelefono: string;
  negocioCorreo: string;
  tieneDireccion: boolean;
  tieneLocalidad: boolean;
  tieneTelefono: boolean;
  tieneCorreo: boolean;
  tieneDatosContacto: boolean;
  redesSociales: RedSocialPieReporte[];
}

export function armarDatosPiePaginaReporte(datos: Record<string, unknown>): DatosPiePaginaReporte {
  const redes = Array.isArray(datos.redesSociales)
    ? (datos.redesSociales as RedSocialPieReporte[])
    : [];

  return {
    tituloReporte: String(datos.tituloReporte ?? 'Reporte'),
    notaPieReporte: String(datos.notaPieReporte ?? ''),
    negocioNombre: String(datos.negocioNombre ?? ''),
    negocioDireccion: String(datos.negocioDireccion ?? ''),
    negocioLocalidad: String(datos.negocioLocalidad ?? ''),
    negocioTelefono: String(datos.negocioTelefono ?? ''),
    negocioCorreo: String(datos.negocioCorreo ?? ''),
    tieneDireccion: Boolean(datos.tieneDireccion),
    tieneLocalidad: Boolean(datos.tieneLocalidad),
    tieneTelefono: Boolean(datos.tieneTelefono),
    tieneCorreo: Boolean(datos.tieneCorreo),
    tieneDatosContacto: Boolean(datos.tieneDatosContacto),
    redesSociales: redes,
  };
}

export function leerDatosPieDesdeDocumento(documento: HTMLElement): DatosPiePaginaReporte | null {
  const pie = documento.querySelector('.rep-pie-pagina');
  const raw = pie?.getAttribute('data-rep-pie');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DatosPiePaginaReporte;
  } catch {
    return null;
  }
}

interface JsPdfConPaginas {
  internal: {
    getNumberOfPages: () => number;
    pageSize: { getWidth: () => number; getHeight: () => number };
  };
  setPage: (pagina: number) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  setLineWidth: (ancho: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  setFontSize: (tamano: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  text: (
    texto: string,
    x: number,
    y: number,
    opciones?: { align?: 'left' | 'center' | 'right'; maxWidth?: number },
  ) => void;
}

function calcularAlturaPiePdf(pie: DatosPiePaginaReporte): number {
  let lineas = 1;
  if (pie.tieneDireccion) lineas += 1;
  if (pie.tieneLocalidad) lineas += 1;
  if (pie.tieneTelefono || pie.tieneCorreo) lineas += 1;
  if (pie.redesSociales.length > 0) lineas += 1;
  return 6 + lineas * 3.2;
}

export function dibujarPieEnTodasLasPaginasPdf(
  pdf: JsPdfConPaginas,
  pie: DatosPiePaginaReporte,
): void {
  const total = pdf.internal.getNumberOfPages();
  const ancho = pdf.internal.pageSize.getWidth();
  const alto = pdf.internal.pageSize.getHeight();
  const margen = 10;
  const alturaPie = calcularAlturaPiePdf(pie);
  const ySeparador = alto - alturaPie;

  for (let pagina = 1; pagina <= total; pagina += 1) {
    pdf.setPage(pagina);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.25);
    pdf.line(margen, ySeparador, ancho - margen, ySeparador);

    let y = ySeparador + 3.5;

    if (pie.tieneDireccion) {
      pdf.setFontSize(7);
      pdf.setTextColor(51, 65, 85);
      pdf.text(pie.negocioDireccion, ancho / 2, y, {
        align: 'center',
        maxWidth: ancho - margen * 2,
      });
      y += 3.2;
    }

    if (pie.tieneLocalidad) {
      pdf.setFontSize(6.8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(pie.negocioLocalidad, ancho / 2, y, {
        align: 'center',
        maxWidth: ancho - margen * 2,
      });
      y += 3.2;
    }

    if (pie.tieneTelefono || pie.tieneCorreo) {
      const medios: string[] = [];
      if (pie.tieneTelefono) medios.push(`Tel. ${pie.negocioTelefono}`);
      if (pie.tieneCorreo) medios.push(pie.negocioCorreo);
      pdf.setFontSize(6.8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(medios.join('   ·   '), ancho / 2, y, {
        align: 'center',
        maxWidth: ancho - margen * 2,
      });
      y += 3.2;
    }

    if (pie.redesSociales.length > 0) {
      const lineaRedes = pie.redesSociales
        .map((red) => `${red.etiqueta}  ${red.texto}`)
        .join('   ·   ');
      pdf.setFontSize(6.8);
      pdf.setTextColor(30, 58, 95);
      pdf.text(lineaRedes, ancho / 2, y, {
        align: 'center',
        maxWidth: ancho - margen * 2,
      });
      y += 3.2;
    }

    pdf.setFontSize(6.2);
    pdf.setTextColor(148, 163, 184);
    pdf.text(pie.notaPieReporte, margen, alto - 4);
    pdf.text(`Pág. ${pagina} / ${total}`, ancho - margen, alto - 4, { align: 'right' });
  }
}
