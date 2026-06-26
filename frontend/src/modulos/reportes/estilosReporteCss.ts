import { normalizarTemaClaroNegocio } from '../../stores/tema';
import { TEMA_CLARO_POR_DEFECTO, type TemaClaroNegocio } from '../tema/temaClaroPorDefecto';
import { bloqueVariablesCssReporte } from './variablesCssReporte';

/** Estilos compartidos para vista previa e impresión de reportes (EtaJS). Formato A4. */
export const claseExportacionPdfReporte = 'rep-doc--exportacion-pdf';

const estilosReporteCssPlantilla = `
@page {
  size: A4 portrait;
  margin: 12mm 14mm 16mm;
}

.rep-doc {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
  color: var(--rep-texto);
  background: var(--rep-fondo);
  width: 210mm;
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 0 14mm 16mm;
  box-sizing: border-box;
  position: relative;
}
.rep-doc * { box-sizing: border-box; }

.rep-enc-pro {
  display: flex;
  align-items: stretch;
  margin-bottom: 1.25rem;
  border: 1px solid var(--rep-borde);
  border-radius: 14px;
  overflow: hidden;
  background: var(--rep-gradiente-enc);
  box-shadow: var(--rep-sombra-enc);
}

.rep-emisor {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  flex: 1;
  min-width: 0;
  padding: 0.35rem 0;
}

.rep-emisor-marca {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rep-emisor-marca--logo {
  padding: 0.75rem 0 0.75rem 1.15rem;
}

.rep-emisor-marca--iniciales {
  padding: 0.75rem 0 0.75rem 1.15rem;
}

.rep-emisor-logo {
  width: 4.5rem;
  height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--rep-gradiente-logo);
  color: var(--rep-texto-sobre-acento);
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.rep-emisor-logo-img {
  display: block;
  width: auto;
  height: auto;
  max-width: 6.5rem;
  max-height: 5.5rem;
  object-fit: contain;
  object-position: center;
  background: transparent;
}

.rep-emisor-cuerpo {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1rem 1.25rem 1rem 0;
}

.rep-emisor-etiq {
  margin: 0 0 0.2rem;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--rep-texto-apagado);
}

.rep-emisor-reporte {
  margin: 0 0 0.45rem;
  font-size: 1.38rem;
  font-weight: 800;
  color: var(--rep-acento);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.rep-emisor-resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.5rem;
  font-size: 0.8rem;
  color: var(--rep-texto-suave);
  line-height: 1.45;
}

.rep-emisor-cuit {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.rep-emisor-fecha {
  font-variant-numeric: tabular-nums;
}

.rep-emisor-sep {
  color: var(--rep-texto-sep);
}

.rep-doc-meta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.85rem 1.15rem;
  background: transparent;
  border-left: 1px solid var(--rep-borde);
}

.rep-meta-grid {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.45rem;
}

.rep-meta-item {
  min-width: 9rem;
  max-width: 14rem;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--rep-borde-claro);
  background: var(--rep-fondo);
  font-size: 0.76rem;
  color: var(--rep-texto-apagado);
  text-align: right;
}

.rep-meta-item strong {
  display: block;
  margin-bottom: 0.12rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--rep-texto-suave);
}

.rep-meta-item span {
  display: block;
  color: var(--rep-texto);
  font-weight: 600;
  line-height: 1.35;
}

.rep-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.65rem;
  margin-bottom: 1.15rem;
}

.rep-kpi {
  padding: 0.7rem 0.8rem;
  border-radius: 10px;
  border: 1px solid var(--rep-borde-claro);
  background: var(--rep-gradiente-kpi);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.rep-kpi-etiq {
  display: block;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--rep-texto-apagado);
  margin-bottom: 0.25rem;
}

.rep-kpi-val {
  font-size: 1.12rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--rep-acento);
}

.rep-nota {
  margin: 0 0 1rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border-left: 3px solid var(--rep-acento);
  background: var(--rep-fondo-alt);
  font-size: 0.82rem;
  color: var(--rep-texto-suave);
  line-height: 1.45;
}

.rep-seccion { margin-bottom: 1.25rem; }

.rep-seccion-tit {
  margin: 0 0 0.55rem;
  padding-bottom: 0.35rem;
  border-bottom: 2px solid var(--rep-borde-claro);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--rep-acento);
}

.rep-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  border: 1px solid var(--rep-borde);
  border-radius: 8px;
  overflow: hidden;
}

.rep-tabla th {
  text-align: left;
  padding: 0.5rem 0.6rem;
  background: var(--rep-gradiente-acento);
  color: var(--rep-texto-sobre-acento);
  font-weight: 600;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rep-tabla th.der, .rep-tabla td.der { text-align: right; }

.rep-tabla td {
  padding: 0.42rem 0.6rem;
  border-bottom: 1px solid var(--rep-borde-claro);
  vertical-align: top;
}

.rep-tabla tbody tr:nth-child(even) td { background: var(--rep-fondo-alt); }

.rep-tabla tbody tr:last-child td { border-bottom: none; }

.rep-tabla tfoot td {
  font-weight: 700;
  background: var(--rep-fondo-cabecera);
  border-top: 2px solid var(--rep-texto-sep);
  color: var(--rep-texto);
}

.rep-cc-detalle-fila td {
  padding: 0 0 0.65rem !important;
  background: transparent !important;
  border-bottom: none !important;
}

.rep-cc-detalle {
  margin: 0.15rem 0 0.35rem 0.35rem;
  padding: 0.55rem 0.65rem 0.65rem;
  border-left: 3px solid var(--rep-acento-borde-detalle);
  border-radius: 0 8px 8px 0;
  background: var(--rep-fondo-alt);
}

.rep-cc-detalle-tit {
  margin: 0 0 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--rep-texto-apagado);
  text-transform: uppercase;
}

.rep-cc-productos {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rep-cc-productos li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.22rem 0;
  font-size: 0.78rem;
  color: var(--rep-texto-suave);
  border-top: 1px dashed rgba(15, 23, 42, 0.1);
}

.rep-cc-productos li:first-child {
  border-top: none;
  padding-top: 0;
}

.rep-cc-productos-nom {
  flex: 1;
  min-width: 0;
}

.rep-cc-productos-det {
  flex-shrink: 0;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.rep-cc-productos-cant {
  margin-right: 0.25rem;
  color: var(--rep-texto-apagado);
}

.rep-cc-productos-importe {
  font-weight: 600;
  color: var(--rep-texto-medio);
}

.rep-cc-detalle-total {
  margin: 0.45rem 0 0;
  padding-top: 0.35rem;
  font-size: 0.78rem;
  text-align: right;
  color: var(--rep-texto-suave);
  border-top: 1px solid rgba(15, 23, 42, 0.1);
}

.rep-vacio {
  margin: 0;
  padding: 1rem;
  text-align: center;
  color: var(--rep-texto-apagado);
  font-style: italic;
  border: 1px dashed var(--rep-borde);
  border-radius: 8px;
  background: var(--rep-fondo-alt);
}

.rep-pie-pagina {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 14mm;
  padding: 1.5mm 14mm 3mm;
  border-top: 0.35mm solid var(--rep-borde-claro);
  background: var(--rep-fondo);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1mm;
  z-index: 20;
}

.rep-pie-contacto {
  text-align: center;
  font-size: 6.8pt;
  color: var(--rep-texto-suave);
  line-height: 1.4;
}

.rep-pie-dir {
  margin: 0;
  font-weight: 600;
  color: var(--rep-texto-medio);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.rep-pie-loc {
  margin: 0.1rem 0 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.rep-pie-medios {
  margin: 0.12rem 0 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.2rem 0.35rem;
}

.rep-pie-sep {
  color: var(--rep-texto-sep);
}

.rep-pie-pagina-redes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 2mm 4mm;
}

.rep-pie-pagina-red {
  display: inline-flex;
  align-items: center;
  gap: 1mm;
  font-size: 6.5pt;
  line-height: 1.25;
}

.rep-pie-pagina-red-nom {
  font-weight: 700;
  color: var(--rep-texto-suave);
}

.rep-pie-pagina-red-val {
  color: var(--rep-acento);
  font-weight: 600;
  text-decoration: none;
}

.rep-pie-pagina-barra {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 4mm;
  font-size: 6pt;
  color: var(--rep-texto-sep);
  line-height: 1.2;
}

.rep-pie-marca-sistema {
  font-size: 6.5pt;
  font-weight: 700;
  letter-spacing: 0.09em;
  color: var(--rep-texto-sep);
  white-space: nowrap;
}

.rep-pie-pagina-nota {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  justify-self: center;
  min-width: 0;
}

.rep-pie-pagina-pag::after {
  content: 'Vista previa · PDF multipágina';
}

@media screen {
  .rep-pie-pagina {
    display: none !important;
  }

  .rep-doc {
    min-height: auto;
    padding-bottom: 0;
  }
}

.rep-chip-deuda { color: #b45309; font-weight: 600; }
.rep-chip-ok { color: #047857; font-weight: 600; }

.rep-seccion {
  break-inside: avoid;
  page-break-inside: avoid;
}

.rep-enc-pro {
  break-inside: avoid;
  page-break-inside: avoid;
}

.rep-tabla thead {
  display: table-header-group;
}

@media print {
  .rep-doc {
    font-size: 10pt;
    width: auto;
    max-width: none;
    min-height: auto;
    margin: 0;
    padding: 0 0 16mm;
  }

  .rep-kpis { grid-template-columns: repeat(4, 1fr); }
  .rep-enc-pro { box-shadow: none; }

  .rep-pie-pagina {
    position: fixed;
    bottom: 0;
  }

  .rep-pie-pagina-pag::after {
    content: counter(page) ' / ' counter(pages);
  }
}

/** Aplicada solo al exportar PDF (impresionReporte.ts). No afecta la vista previa en pantalla. */
.rep-doc.rep-doc--exportacion-pdf {
  width: 210mm !important;
  max-width: 210mm !important;
  min-width: 210mm !important;
  min-height: auto !important;
  margin: 0 !important;
  padding: 0 10mm 10mm !important;
  box-sizing: border-box !important;
  font-size: 8.5pt !important;
  line-height: 1.35 !important;
  overflow: visible !important;
}

.rep-doc.rep-doc--exportacion-pdf .rep-enc-pro {
  margin-bottom: 0.55rem !important;
}

.rep-doc.rep-doc--exportacion-pdf .rep-seccion {
  break-inside: auto !important;
  page-break-inside: auto !important;
  margin-bottom: 0.65rem !important;
}

.rep-doc.rep-doc--exportacion-pdf .rep-seccion--cuenta-unica {
  margin-top: 0 !important;
}

.rep-doc.rep-doc--exportacion-pdf .rep-tabla {
  break-inside: auto !important;
  page-break-inside: auto !important;
}

.rep-doc.rep-doc--exportacion-pdf .rep-tabla tbody tr {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

.rep-doc.rep-doc--exportacion-pdf .rep-cc-detalle-fila {
  break-inside: auto !important;
  page-break-inside: auto !important;
}

.rep-doc.rep-doc--exportacion-pdf .rep-pie-pagina {
  display: none !important;
}

.rep-doc.rep-doc--exportacion-pdf .rep-kpis {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin-bottom: 0.75rem;
}

.rep-doc.rep-doc--exportacion-pdf .rep-kpi {
  padding: 0.45rem 0.55rem;
}

.rep-doc.rep-doc--exportacion-pdf .rep-kpi-val {
  font-size: 0.95rem;
}

.rep-doc.rep-doc--exportacion-pdf .rep-tabla {
  table-layout: fixed;
  width: 100%;
  font-size: 6.5pt;
  line-height: 1.3;
  overflow: visible;
}

.rep-doc.rep-doc--exportacion-pdf .rep-tabla th {
  padding: 0.22rem 0.2rem;
  font-size: 6pt;
  letter-spacing: 0.02em;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.rep-doc.rep-doc--exportacion-pdf .rep-tabla td {
  padding: 0.2rem 0.2rem;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.rep-doc.rep-doc--exportacion-pdf .rep-tabla :is(th, td).der {
  width: 9%;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-size: 6.5pt;
  padding-inline: 0.12rem;
  overflow-wrap: normal;
  word-break: normal;
}

.rep-doc.rep-doc--exportacion-pdf .rep-tabla :is(th, td).der:first-child {
  width: 4%;
  text-align: center;
}

.rep-doc.rep-doc--exportacion-pdf .rep-emisor-logo {
  width: 3.75rem;
  height: 3.75rem;
  font-size: 1rem;
}

.rep-doc.rep-doc--exportacion-pdf .rep-emisor-logo-img {
  max-width: 5rem;
  max-height: 4.25rem;
}

.rep-doc.rep-doc--exportacion-pdf .rep-emisor-marca--logo,
.rep-doc.rep-doc--exportacion-pdf .rep-emisor-marca--iniciales {
  padding: 0.55rem 0 0.55rem 0.75rem;
}

.rep-doc.rep-doc--exportacion-pdf .rep-emisor-cuerpo {
  padding: 0.7rem 0.85rem;
}

.rep-doc.rep-doc--exportacion-pdf .rep-emisor-reporte {
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
}
`;

/** Genera CSS completo con variables del tema claro del negocio (nunca modo oscuro de la app). */
export function generarEstilosBaseReporteCss(tema?: TemaClaroNegocio | null): string {
  const temaFinal = tema ?? { ...TEMA_CLARO_POR_DEFECTO };
  return `${bloqueVariablesCssReporte(temaFinal)}\n${estilosReporteCssPlantilla}`;
}

/** Estilos con la paleta por defecto (fallback cuando aún no hay negocio cargado). */
export const estilosBaseReporteCss = generarEstilosBaseReporteCss(TEMA_CLARO_POR_DEFECTO);

/** Resuelve estilos a partir de los campos de tema del negocio. */
export function generarEstilosReporteNegocio(
  negocio: Parameters<typeof normalizarTemaClaroNegocio>[0] | null | undefined,
): string {
  return generarEstilosBaseReporteCss(normalizarTemaClaroNegocio(negocio ?? {}));
}
