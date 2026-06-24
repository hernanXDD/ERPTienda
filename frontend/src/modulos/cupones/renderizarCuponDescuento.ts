import { etiquetaEstadoCupon } from '../../datos/etiquetasEstadoCupon';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useNegocioStore } from '../../stores/negocio';
import {
  prepararRenderizadoReporte,
  renderizarPlantillaConEstilos,
} from '../reportes/motorEtaReportes';
import {
  etiquetaTipoDescuentoCupon,
  etiquetaValorDescuentoCupon,
  type CuponDescuentoRegistrado,
} from '../../tipos/cuponDescuento';
import { formatearFechaDiaMesAnio } from '../../utilidades/formatoFechaHora';
import { generarEstilosCuponNegocio } from './estilosCuponCss';
import { generarSvgCodigoBarrasCupon } from './generarSvgCodigoBarrasCupon';
import { obtenerHtmlPlantillaCupon } from './plantillasCupon';

export interface DatosCuponDescuento {
  tituloReporte: string;
  etiquetaTipoDocumento: string;
  generadoEl: string;
  notaPieReporte: string;
  numeroCupon: string;
  valorDescuento: string;
  tipoDescuentoLegible: string;
  nombreCliente: string;
  documentoCliente: string;
  tieneDocumentoCliente: boolean;
  fechaEmision: string;
  fechaVencimiento: string;
  observaciones: string;
  tieneObservaciones: boolean;
  codigoCupon: string;
  codigoBarrasSvg: string;
  estadoLegible: string;
}

export function armarDatosCuponDescuento(
  cupon: CuponDescuentoRegistrado,
  codigoBarras: string,
): DatosCuponDescuento {
  const documento = cupon.documentoClienteMostrar.trim();

  return {
    tituloReporte: 'Cupón de descuento',
    etiquetaTipoDocumento: 'Cupón',
    generadoEl: formatearFechaDiaMesAnio(cupon.fecha),
    notaPieReporte: 'Válido presentando el código de barras en caja · Documento generado automáticamente',
    numeroCupon: cupon.numero,
    valorDescuento: etiquetaValorDescuentoCupon(cupon),
    tipoDescuentoLegible: etiquetaTipoDescuentoCupon(cupon.tipoDescuento),
    nombreCliente: cupon.nombreClienteMostrar.trim() || 'Consumidor final',
    documentoCliente: documento,
    tieneDocumentoCliente: Boolean(documento),
    fechaEmision: formatearFechaDiaMesAnio(cupon.fecha),
    fechaVencimiento: formatearFechaDiaMesAnio(cupon.fechaVencimiento),
    observaciones: cupon.observaciones.trim(),
    tieneObservaciones: Boolean(cupon.observaciones.trim()),
    codigoCupon: codigoBarras.trim(),
    codigoBarrasSvg: generarSvgCodigoBarrasCupon(codigoBarras, { alto: 38, anchoModulo: 1.7 }),
    estadoLegible: etiquetaEstadoCupon(cupon.estado, cupon),
  };
}

export async function renderizarCuponDescuento(
  cupon: CuponDescuentoRegistrado,
  codigoBarras: string,
): Promise<string> {
  const negocioStore = useNegocioStore();
  const configuracionStore = useConfiguracionSistemaStore();
  await negocioStore.asegurarCargado();
  await configuracionStore.asegurarCargado();
  await prepararRenderizadoReporte();

  const plantilla = configuracionStore.parametros.plantillaCupon;
  const datos = armarDatosCuponDescuento(cupon, codigoBarras);
  return renderizarPlantillaConEstilos(
    obtenerHtmlPlantillaCupon(plantilla),
    datos,
    generarEstilosCuponNegocio(negocioStore.negocio, plantilla),
  );
}
