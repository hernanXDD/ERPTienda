/** Estilos compartidos para vista previa e impresión de reportes (EtaJS). Formato A4. */
export const claseExportacionPdfReporte = 'rep-doc--exportacion-pdf';

export const estilosBaseReporteCss = `
@page {
  size: A4 portrait;
  margin: 12mm 14mm 16mm;
}

.rep-doc {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
  color: #0f172a;
  background: #fff;
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
  margin-bottom: 1.15rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  overflow: visible;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.rep-emisor {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  flex: 1;
  min-width: 0;
  padding: 1rem 1.15rem;
  background: transparent;
}

.rep-emisor-logo {
  flex-shrink: 0;
  width: 2.85rem;
  height: 2.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(145deg, #1e3a5f 0%, #0f2744 100%);
  color: #f8fafc;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.rep-emisor-cuerpo {
  min-width: 0;
  flex: 1;
}

.rep-emisor-etiq {
  margin: 0 0 0.12rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  color: #64748b;
}

.rep-emisor-reporte {
  margin: 0 0 0.35rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e3a5f;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.rep-emisor-resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.28rem 0.45rem;
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.45;
}

.rep-emisor-nom {
  font-weight: 700;
  color: #334155;
}

.rep-emisor-cuit {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.rep-emisor-fecha {
  font-variant-numeric: tabular-nums;
}

.rep-emisor-sep {
  color: #94a3b8;
}

.rep-doc-meta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.85rem 1.15rem;
  background: transparent;
  border-left: 1px solid #cbd5e1;
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
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.76rem;
  color: #64748b;
  text-align: right;
}

.rep-meta-item strong {
  display: block;
  margin-bottom: 0.12rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #475569;
}

.rep-meta-item span {
  display: block;
  color: #0f172a;
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
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.rep-kpi-etiq {
  display: block;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.rep-kpi-val {
  font-size: 1.12rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #1e3a5f;
}

.rep-nota {
  margin: 0 0 1rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border-left: 3px solid #1e3a5f;
  background: #f8fafc;
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.45;
}

.rep-seccion { margin-bottom: 1.25rem; }

.rep-seccion-tit {
  margin: 0 0 0.55rem;
  padding-bottom: 0.35rem;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #1e3a5f;
}

.rep-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
}

.rep-tabla th {
  text-align: left;
  padding: 0.5rem 0.6rem;
  background: linear-gradient(180deg, #1e3a5f 0%, #152a45 100%);
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rep-tabla th.der, .rep-tabla td.der { text-align: right; }

.rep-tabla td {
  padding: 0.42rem 0.6rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.rep-tabla tbody tr:nth-child(even) td { background: #f8fafc; }

.rep-tabla tbody tr:last-child td { border-bottom: none; }

.rep-tabla tfoot td {
  font-weight: 700;
  background: #e2e8f0;
  border-top: 2px solid #94a3b8;
  color: #0f172a;
}

.rep-vacio {
  margin: 0;
  padding: 1rem;
  text-align: center;
  color: #64748b;
  font-style: italic;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.rep-pie-pagina {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 14mm;
  padding: 1.5mm 14mm 3mm;
  border-top: 0.35mm solid #e2e8f0;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1mm;
  z-index: 20;
}

.rep-pie-contacto {
  text-align: center;
  font-size: 6.8pt;
  color: #475569;
  line-height: 1.4;
}

.rep-pie-dir {
  margin: 0;
  font-weight: 600;
  color: #334155;
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
  color: #94a3b8;
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
  color: #475569;
}

.rep-pie-pagina-red-val {
  color: #1e3a5f;
  font-weight: 600;
  text-decoration: none;
}

.rep-pie-pagina-barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4mm;
  font-size: 6pt;
  color: #94a3b8;
  line-height: 1.2;
}

.rep-pie-pagina-nota {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  margin: 0 !important;
  padding: 0 10mm 10mm !important;
  box-sizing: border-box !important;
  font-size: 8.5pt !important;
  line-height: 1.35 !important;
  overflow: visible !important;
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
`;
