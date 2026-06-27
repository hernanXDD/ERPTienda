import type { Proveedor } from '../../tipos/proveedor';
import type { MovimientoCuentaCorrienteProveedor } from '../../tipos/cuentaCorrienteProveedor';
import type { CompraRegistrada } from '../../tipos/compraRegistrada';
import { calcularReporteCuentasCorrientesProveedor } from '../reportes/calcular/calcularReporteCuentasCorrientesProveedor';
import { opcionesProveedoresParaReporte } from '../reportes/filtroEntidadReporte';
import {
  armarFiltroFechasReporteDesdeMovimientos,
  esRangoFechasValido,
} from '../reportes/filtroFechasReporte';
import { exportarReporteComoPdf, nombreArchivoReportePdf } from '../reportes/impresionReporte';
import { prepararRenderizadoReporte, renderizarPlantillaReporte } from '../reportes/motorEtaReportes';
import { plantillasReportes } from '../reportes/plantillasReportes';

export interface ParametrosExportarPdfCuentaCorrienteProveedor {
  proveedor: Proveedor;
  proveedores: Proveedor[];
  movimientos: MovimientoCuentaCorrienteProveedor[];
  compras?: CompraRegistrada[];
  fechaDesde?: string;
  fechaHasta?: string;
  ventanaPdfDestino?: Window | null;
}

export async function exportarPdfCuentaCorrienteProveedor(
  parametros: ParametrosExportarPdfCuentaCorrienteProveedor,
): Promise<void> {
  const { proveedor, proveedores, movimientos, compras = [], fechaDesde, fechaHasta, ventanaPdfDestino } =
    parametros;

  const movimientosProveedor = movimientos.filter((m) => m.proveedorId === proveedor.id);
  const filtroFechas = armarFiltroFechasReporteDesdeMovimientos(
    fechaDesde,
    fechaHasta,
    movimientosProveedor.map((m) => m.fecha),
  );

  if (!esRangoFechasValido(filtroFechas)) {
    throw new Error('El rango de fechas no es válido. Revise «Desde» y «Hasta».');
  }

  const opcionesProveedor = opcionesProveedoresParaReporte(proveedores);
  const datos = calcularReporteCuentasCorrientesProveedor(
    proveedores,
    movimientos,
    { ...filtroFechas, idProveedor: proveedor.id },
    opcionesProveedor,
    compras,
  );
  datos.tituloReporte = `Cuenta corriente · ${proveedor.nombre}`;
  datos.filtroEntidadLegible = `${proveedor.nombre} · ${proveedor.documento}`;

  const filaProveedor = datos.proveedores[0];
  if (filaProveedor) {
    datos.informeCuentaUnica = true;
    datos.kpisCuentaUnica = [
      { etiqueta: 'Saldo actual', valor: filaProveedor.saldoFinal },
      { etiqueta: 'Cargos período', valor: filaProveedor.cargosPeriodo },
      { etiqueta: 'Pagos período', valor: filaProveedor.pagosPeriodo },
    ];
  }

  await prepararRenderizadoReporte();
  const html = renderizarPlantillaReporte(plantillasReportes['cuentas-corrientes-proveedor'], datos);
  const nombreArchivo = nombreArchivoReportePdf(`Cuenta-proveedor-${proveedor.nombre}`, filtroFechas);
  await exportarReporteComoPdf(html, nombreArchivo, { ventanaDestino: ventanaPdfDestino });
}
