/** Estilos compartidos para vista previa e impresión de reportes (EtaJS). */
export const estilosBaseReporteCss = `
.rep-doc {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  line-height: 1.45;
  color: #0f172a;
  background: #fff;
}
.rep-doc * { box-sizing: border-box; }
.rep-enc {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 3px solid #1e3a5f;
}
.rep-marca { margin: 0; font-size: 1.35rem; font-weight: 700; color: #1e3a5f; letter-spacing: -0.02em; }
.rep-tit { margin: 0.15rem 0 0; font-size: 1.05rem; font-weight: 600; color: #334155; }
.rep-meta-bloque { text-align: right; font-size: 0.78rem; color: #64748b; }
.rep-meta-bloque p { margin: 0.15rem 0; }
.rep-meta-bloque strong { color: #334155; font-weight: 600; }
.rep-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.65rem;
  margin-bottom: 1.15rem;
}
.rep-kpi {
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}
.rep-kpi-etiq {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin-bottom: 0.2rem;
}
.rep-kpi-val {
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
}
.rep-seccion { margin-bottom: 1.25rem; }
.rep-seccion-tit {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #475569;
}
.rep-tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.rep-tabla th {
  text-align: left;
  padding: 0.45rem 0.55rem;
  background: #1e3a5f;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.rep-tabla th.der, .rep-tabla td.der { text-align: right; }
.rep-tabla td {
  padding: 0.4rem 0.55rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}
.rep-tabla tbody tr:nth-child(even) td { background: #f8fafc; }
.rep-tabla tfoot td {
  font-weight: 700;
  background: #e2e8f0;
  border-top: 2px solid #94a3b8;
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
.rep-pie {
  margin-top: 1.25rem;
  padding-top: 0.65rem;
  border-top: 1px solid #cbd5e1;
  font-size: 0.72rem;
  color: #94a3b8;
  text-align: center;
}
.rep-chip-deuda { color: #b45309; font-weight: 600; }
.rep-chip-ok { color: #047857; font-weight: 600; }
.rep-seccion {
  break-inside: avoid;
  page-break-inside: avoid;
}
.rep-tabla thead {
  display: table-header-group;
}
@media print {
  .rep-doc { font-size: 11px; }
  .rep-kpis { grid-template-columns: repeat(4, 1fr); }
}
`;
