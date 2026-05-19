import type { MovimientoCuentaCorriente } from '../../tipos/cuentaCorriente';
import type { Cliente } from '../../tipos/cliente';
import { formatearFechaDiaMesAnio, formatearFechaYHora } from '../../utilidades/formatoFechaHora';

export interface DatosImpresionReciboPago {
  cliente: Pick<Cliente, 'nombre' | 'documento'>;
  movimiento: MovimientoCuentaCorriente;
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

/**
 * Vista provisional de recibo tras registrar un pago.
 * Diseño evolucionar a plantilla institucional + PDF servidor.
 */
export function abrirImpresionReciboPagoCuentaCorriente(datos: DatosImpresionReciboPago): void {
  if (datos.movimiento.tipoMovimiento !== 'pagoRegistrado') {
    window.console.warn('Sólo los movimientos de tipo pago admiten recibo de cobro.');
    return;
  }

  const aud = datos.movimiento.auditoriaPago;
  const referenciaRecibo = aud?.codigoPublicoRecibo?.trim()
    ? aud.codigoPublicoRecibo
    : `Pago · ref. ${datos.movimiento.id.slice(0, 8)}`;

  const ventanaEmergente = window.open('', '_blank', 'noopener,noreferrer');
  if (!ventanaEmergente) {
    window.alert(
      'El navegador bloqueó la ventana emergente. Permití ventanas desde este sitio para ver el recibo.'
    );
    return;
  }

  const nom = escaparTextoParaHtml(datos.cliente.nombre);
  const doc = escaparTextoParaHtml(datos.cliente.documento);
  const mon = formatoMoneda.format(datos.movimiento.importe);
  const fechaPagoTxt = escaparTextoParaHtml(formatearFechaDiaMesAnio(datos.movimiento.fecha));
  const codRec = escaparTextoParaHtml(referenciaRecibo);

  const formaPagoCruda = aud?.formaDePagoEtiqueta?.trim();
  const formaPagoTxt = escaparTextoParaHtml(formaPagoCruda && formaPagoCruda.length > 0 ? formaPagoCruda : '—');
  const refPago = aud?.referenciaDelPagoOpcional?.trim();
  const filaReferencia =
    refPago && refPago.length > 0
      ? `<dt>Referencia / comprobante</dt><dd>${escaparTextoParaHtml(refPago)}</dd>`
      : '';

  const bloqueAuditoria = aud
    ? (() => {
        const marcaRegistroTxt = escaparTextoParaHtml(formatearFechaYHora(aud.marcaTiempoUtcRegistroCliente));
        const op = escaparTextoParaHtml(aud.etiquetaUsuarioRegistrante);
        const canal = escaparTextoParaHtml(aud.canalCapturaDocumentado);
        return `<div class="sec"><h3>Registro en sistema</h3>
<dl>
<dt>Registrado</dt><dd>${marcaRegistroTxt}</dd>
<dt>Operador</dt><dd>${op}</dd>
<dt>Canal</dt><dd>${canal}</dd>
</dl></div>`;
      })()
    : `<div class="sec sec--aviso"><p class="aviso">Este pago no tiene código de recibo numerado (carga histórica o migración). El comprobante refleja los datos del movimiento en cuenta corriente.</p></div>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width"/>
<title>Recibo · ${codRec}</title>
<style>
body{font-family:system-ui,sans-serif;margin:2rem;line-height:1.45;color:#0f172a}
h1{font-size:1.15rem;margin:0 0 .25rem}
.sub{color:#475569;font-size:.88rem;margin:0}
.rec{border:2px solid #94a3b8;border-radius:12px;padding:1.35rem;margin-top:1.25rem;max-width:32rem;background:#fefefe}
.cod{font-size:1.05rem;font-weight:700;color:#334155;letter-spacing:.04em;margin-bottom:.85rem;}
dl{display:grid;grid-template:auto/8.5rem 1fr;gap:.35rem 1rem;font-size:.92rem;margin:0}
dt{color:#64748b;margin:0;font-weight:600;text-transform:uppercase;font-size:.7rem;letter-spacing:.05em;padding-top:.1rem;}
dd{margin:0;font-variant-numeric:tabular-nums}
.sec{margin-top:1.15rem;padding-top:.85rem;border-top:1px solid #cbd5e1}
.sec h3{margin:0 0 .35rem;font-size:.74rem;color:#475569;text-transform:uppercase;letter-spacing:.05em;}
.sec p{margin:0;font-size:.85rem;color:#475569;line-height:1.5}
.sec--aviso .aviso{margin:0;font-size:.82rem;color:#64748b;font-style:italic;line-height:1.45}
.acc{margin-top:1.25rem}
.btn{font:inherit;padding:.42rem .9rem;border-radius:8px;border:1px solid #cbd5e1;background:#f1f5f9;cursor:pointer}
@media print{.acc{display:none};body{margin:1rem};.rec{border-color:#cbd5e1}}
</style></head><body>
<header><h1>Recibo provisional de cobro · cuenta corriente</h1><p class="sub">Este comprobante reemplazará eventualmente por un formato legal / PDF emitido desde el servidor.</p></header>
<div class="rec">
<div class="cod">${codRec}</div>
<dl>
<dt>Cliente</dt><dd>${nom}</dd>
<dt>Documento</dt><dd>${doc}</dd>
<dt>Importe</dt><dd><strong>${mon}</strong></dd>
<dt>Fecha pago</dt><dd>${fechaPagoTxt}</dd>
<dt>Forma de pago</dt><dd>${formaPagoTxt}</dd>
<dt>Concepto</dt><dd>${escaparTextoParaHtml(datos.movimiento.descripcion)}</dd>
${filaReferencia}
</dl>
${bloqueAuditoria}
</div>
<div class="acc"><button type="button" class="btn" onclick="window.print()">Imprimir o guardar PDF</button></div>
</body></html>`;

  ventanaEmergente.document.open();
  ventanaEmergente.document.write(html);
  ventanaEmergente.document.close();
}