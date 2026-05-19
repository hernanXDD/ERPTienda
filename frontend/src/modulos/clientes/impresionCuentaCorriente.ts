import type { MovimientoConSaldo } from '../../stores/cuentaCorriente';
import { formatearFechaYHora } from '../../utilidades/formatoFechaHora';

/** Datos necesarios para el reporte imprimible de cuenta corriente (evolucionable a PDF u otro formato). */
export interface DatosImpresionCuentaCorriente {
  nombreCliente: string;
  documentoCliente: string;
  limiteCompraCuentaCorriente: number;
  saldoActual: number;
  disponibleParaCompras: number;
  /** Historial completo, ordenado como lo devuelve el store con saldos acumulados. */
  movimientosConSaldo: MovimientoConSaldo[];
}

const formatoMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function escaparTextoParaHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textoTipoMovimiento(tipo: MovimientoConSaldo['tipoMovimiento']): string {
  return tipo === 'cargo' ? 'Cargo' : 'Pago';
}

function armarFilasTablaHtml(movs: MovimientoConSaldo[]): string {
  if (movs.length === 0) {
    return `<tr><td colspan="6" class="muted">Sin movimientos registrados.</td></tr>`;
  }
  return movs
    .map((m) => {
      const debe =
        m.tipoMovimiento === 'cargo' ? formatoMoneda.format(m.importe) : '—';
      const haber =
        m.tipoMovimiento === 'pagoRegistrado' ? formatoMoneda.format(m.importe) : '—';
      return `
        <tr>
          <td>${formatearFechaYHora(m.fecha)}</td>
          <td>${textoTipoMovimiento(m.tipoMovimiento)}</td>
          <td>${escaparTextoParaHtml(m.descripcion)}</td>
          <td class="num">${debe}</td>
          <td class="num">${haber}</td>
          <td class="num">${formatoMoneda.format(m.saldoTrasMovimiento)}</td>
        </tr>`;
    })
    .join('');
}

/** Abre ventana nueva con vista imprimible. Incluye todos los movimientos (no aplica filtros del modal). */
export function abrirImpresionCuentaCorriente(datos: DatosImpresionCuentaCorriente): void {
  const ventanaEmergente = window.open('', '_blank', 'noopener,noreferrer');
  if (!ventanaEmergente) {
    window.alert(
      'El navegador bloqueó la ventana emergente. Permití ventanas desde este sitio para imprimir la cuenta.'
    );
    return;
  }

  const fechaEmisionLegible = formatearFechaYHora(new Date());

  const nombreSeguro = escaparTextoParaHtml(datos.nombreCliente);
  const documentoSeguro = escaparTextoParaHtml(datos.documentoCliente);
  const filas = armarFilasTablaHtml(datos.movimientosConSaldo);

  const contenidoHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cuenta corriente · ${nombreSeguro}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, "Segoe UI", sans-serif; margin: 1.75rem 1.5rem; color: #0f172a; line-height: 1.45; }
    h1 { font-size: 1.25rem; margin: 0 0 0.25rem; }
    .muted { color: #64748b; font-size: 0.875rem; }
    .cab { margin-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.85rem; }
    dl { display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 1.25rem; margin: 0; font-size: 0.9rem; max-width: 28rem; }
    dt { color: #64748b; }
    dd { margin: 0; font-variant-numeric: tabular-nums; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    thead th { text-align: left; border-bottom: 2px solid #cbd5e1; padding: 0.55rem 0.45rem; font-size: 0.72rem;
      text-transform: uppercase; letter-spacing: 0.04em; color: #475569; background: #f8fafc; }
    td { border-bottom: 1px solid #e2e8f0; padding: 0.5rem 0.45rem; vertical-align: top; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    tr:nth-child(even) td { background: #f8fafc; }
    footer { margin-top: 1.5rem; font-size: 0.75rem; color: #64748b; }
    .acciones-imprimir { margin: 0 0 1rem; }
    .btn { font: inherit; padding: 0.4rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1;
      background: #f1f5f9; cursor: pointer; }
    .btn:hover { background: #e2e8f0; }
    @media print {
      body { margin: 0; }
      .acciones-imprimir { display: none; }
      tr:nth-child(even) td { background: transparent; }
    }
  </style>
</head>
<body>
  <div class="acciones-imprimir">
    <button type="button" class="btn" onclick="window.print()">Imprimir o guardar como PDF</button>
  </div>
  <header class="cab">
    <h1>Estado de cuenta corriente</h1>
    <p class="muted">Emitido: ${escaparTextoParaHtml(fechaEmisionLegible)} · Historial completo al momento de emisión.</p>
  </header>
  <section aria-label="Cliente">
    <dl>
      <dt>Cliente</dt><dd>${nombreSeguro}</dd>
      <dt>Documento</dt><dd>${documentoSeguro}</dd>
      <dt>Límite compra en CC</dt><dd>${formatoMoneda.format(datos.limiteCompraCuentaCorriente)}</dd>
      <dt>Saldo actual</dt><dd>${formatoMoneda.format(datos.saldoActual)}</dd>
      <dt>Disponible</dt><dd>${formatoMoneda.format(datos.disponibleParaCompras)}</dd>
    </dl>
  </section>
  <section style="margin-top:1.5rem;" aria-label="Movimientos">
    <h2 class="muted" style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 0.5rem;">Movimientos</h2>
    <table>
      <thead>
        <tr>
          <th>Fecha / hora</th>
          <th>Tipo</th>
          <th>Descripción</th>
          <th style="text-align:right;">Debe</th>
          <th style="text-align:right;">Haber</th>
          <th style="text-align:right;">Saldo</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  </section>
  <footer>Este documento es una vista imprimible provisoria del sistema ERP. Podrá reemplazarse por un reporte formal más adelante.</footer>
</body>
</html>`;

  ventanaEmergente.document.open();
  ventanaEmergente.document.write(contenidoHtml);
  ventanaEmergente.document.close();
}
