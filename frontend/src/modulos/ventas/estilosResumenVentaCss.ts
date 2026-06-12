/** Estilos del comprobante de compra para cliente (A4, impresión y email). */
export const claseExportacionPdfResumenVenta = 'rv-doc--exportacion-pdf';

export const estilosResumenVentaCss = `
@page {
  size: A4 portrait;
  margin: 14mm 12mm 16mm;
}

.rv-doc {
  --rv-ink: #0f172a;
  --rv-muted: #64748b;
  --rv-line: #e2e8f0;
  --rv-brand: #1e3a5f;
  --rv-brand-soft: #eef2f7;
  --rv-accent: #047857;
  --rv-accent-soft: #ecfdf5;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  color: var(--rv-ink);
  background: #fff;
  width: 210mm;
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 12mm 14mm 14mm;
  box-sizing: border-box;
}
.rv-doc * { box-sizing: border-box; }

.rv-cab {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem 1.25rem;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--rv-brand);
}

.rv-cab-emisor {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
  min-width: 12rem;
}

.rv-cab-logo {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(145deg, #1e3a5f 0%, #0f2744 100%);
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #f8fafc;
}

.rv-cab-logo-img {
  display: block;
  flex-shrink: 0;
  width: auto;
  height: auto;
  max-width: 4.5rem;
  max-height: 3.75rem;
  object-fit: contain;
  object-position: center;
  background: transparent;
}

.rv-cab-datos { min-width: 0; flex: 1; }

.rv-cab-marca {
  margin: 0 0 0.2rem;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.25;
  color: var(--rv-brand);
}

.rv-cab-cuit {
  margin: 0 0 0.2rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--rv-muted);
  font-variant-numeric: tabular-nums;
}

.rv-cab-ubicacion,
.rv-cab-contacto {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--rv-muted);
}

.rv-cab-doc {
  flex-shrink: 0;
  text-align: right;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  background: var(--rv-accent-soft);
  border: 1px solid #a7f3d0;
}

.rv-cab-doc-etiq {
  margin: 0 0 0.2rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rv-accent);
}

.rv-cab-gracias {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #065f46;
}

.rv-id {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background: var(--rv-brand-soft);
  border: 1px solid var(--rv-line);
}

.rv-id-item { min-width: 8rem; }

.rv-id-item--fecha { flex: 1; min-width: 10rem; }

.rv-etiq {
  display: block;
  margin-bottom: 0.15rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--rv-muted);
}

.rv-num {
  display: block;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--rv-brand);
}

.rv-fecha {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rv-ink);
}

.rv-resumen {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1.25rem;
  margin-bottom: 1.15rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--rv-line);
}

.rv-resumen-fila { min-width: 0; }

.rv-valor {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.35;
  word-break: break-word;
}

.rv-valor--pago {
  color: var(--rv-brand);
}

.rv-detalle {
  margin-bottom: 1.15rem;
}

.rv-seccion-tit {
  margin: 0 0 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--rv-brand);
}

.rv-detalle-res {
  margin: 0 0 0.55rem;
  font-size: 0.78rem;
  color: var(--rv-muted);
}

.rv-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
}

.rv-tabla th {
  text-align: left;
  padding: 0.45rem 0.55rem;
  background: linear-gradient(180deg, #1e3a5f 0%, #152a45 100%);
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rv-tabla th.der,
.rv-tabla td.der {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.rv-tabla td {
  padding: 0.4rem 0.55rem;
  border-bottom: 1px solid var(--rv-line);
  vertical-align: top;
}

.rv-tabla tbody tr:nth-child(even) td {
  background: #f8fafc;
}

.rv-tabla-prod {
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}

.rv-tabla-sub {
  font-weight: 700;
}

.rv-tabla tfoot td {
  padding: 0.55rem 0.55rem;
  font-weight: 700;
  background: #e2e8f0;
  border-top: 2px solid #94a3b8;
  color: var(--rv-ink);
}

.rv-tabla-total {
  font-size: 1rem;
  color: var(--rv-brand);
}

.rv-obs {
  margin-bottom: 1rem;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  background: #fafafa;
}

.rv-obs-txt {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #475569;
  white-space: pre-wrap;
}

.rv-pie {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--rv-line);
  text-align: center;
}

.rv-pie-redes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem 0.85rem;
  margin-bottom: 0.55rem;
  font-size: 0.76rem;
  color: var(--rv-brand);
}

.rv-pie-red strong {
  color: var(--rv-muted);
  font-weight: 600;
}

.rv-pie-atendido {
  margin: 0 0 0.45rem;
  font-size: 0.74rem;
  color: var(--rv-muted);
}

.rv-pie-legal {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  line-height: 1.45;
  color: var(--rv-muted);
  max-width: 36rem;
  margin-inline: auto;
}

.rv-pie-emision {
  margin: 0;
  font-size: 0.68rem;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}

@media screen {
  .rv-doc {
    min-height: auto;
    box-shadow:
      0 4px 24px rgba(15, 23, 42, 0.1),
      0 0 0 1px rgba(15, 23, 42, 0.06);
    border-radius: 4px;
  }
}

@media screen and (max-width: 520px) {
  .rv-doc {
    width: 100%;
    max-width: 100%;
    padding: 1rem;
  }

  .rv-cab {
    flex-direction: column;
  }

  .rv-cab-doc {
    width: 100%;
    text-align: left;
  }

  .rv-resumen {
    grid-template-columns: 1fr;
  }
}

@media print {
  .rv-doc {
    width: auto;
    max-width: none;
    min-height: auto;
    margin: 0;
    padding: 0;
    box-shadow: none;
    border-radius: 0;
  }

  .rv-tabla thead {
    display: table-header-group;
  }

  .rv-pie {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

.rv-doc.rv-doc--exportacion-pdf {
  min-height: auto !important;
  margin: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
`;
