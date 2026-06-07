import * as XLSX from 'xlsx';
import { COLUMNAS_REPORTE_VENTAS_FACTURACION } from '../reportes/calcular/calcularReporteVentasFacturacion';
import { NOMBRE_ESTADO_FACTURACION_FACTURADA } from '../../datos/condicionesIva';
import type { VentaRegistrada } from '../../tipos/venta';

function normalizarEncabezado(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

const ENCABEZADO_NUMERO_VENTA = normalizarEncabezado(COLUMNAS_REPORTE_VENTAS_FACTURACION.numeroVenta);
const ENCABEZADO_NUMERO_FACTURA = normalizarEncabezado(COLUMNAS_REPORTE_VENTAS_FACTURACION.numeroFactura);

export interface CambioFacturacionPrevisto {
  ventaId: string;
  numeroVenta: string;
  nombreCliente: string;
  facturacionActual: string;
  facturacionNueva: string;
  estadoActual: string;
  estadoNuevo: string;
}

export interface ResultadoParseoFacturacionesExcel {
  cambios: CambioFacturacionPrevisto[];
  filasIgnoradasSinFactura: number;
  filasSinCambio: number;
  errores: string[];
}

function valorCeldaTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

function resolverIndiceEncabezados(filas: unknown[][]): {
  indiceEncabezado: number;
  indiceNumeroVenta: number;
  indiceNumeroFactura: number;
} | null {
  for (let indice = 0; indice < filas.length; indice += 1) {
    const fila = filas[indice];
    if (!Array.isArray(fila)) continue;

    const indicesPorNormalizado = new Map<string, number>();
    fila.forEach((celda, columna) => {
      const normalizado = normalizarEncabezado(valorCeldaTexto(celda));
      if (normalizado) indicesPorNormalizado.set(normalizado, columna);
    });

    const indiceNumeroVenta = indicesPorNormalizado.get(ENCABEZADO_NUMERO_VENTA);
    const indiceNumeroFactura = indicesPorNormalizado.get(ENCABEZADO_NUMERO_FACTURA);
    if (indiceNumeroVenta === undefined || indiceNumeroFactura === undefined) continue;

    return { indiceEncabezado: indice, indiceNumeroVenta, indiceNumeroFactura };
  }

  return null;
}

export async function parsearArchivoFacturacionesExcel(
  archivo: File,
  ventasRegistradas: readonly VentaRegistrada[],
): Promise<ResultadoParseoFacturacionesExcel> {
  const ventasPorNumero = new Map(ventasRegistradas.map((venta) => [venta.numero.trim(), venta]));
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array' });
  const nombreHoja = libro.SheetNames[0];

  if (!nombreHoja) {
    return {
      cambios: [],
      filasIgnoradasSinFactura: 0,
      filasSinCambio: 0,
      errores: ['El archivo no contiene hojas de cálculo.'],
    };
  }

  const hoja = libro.Sheets[nombreHoja];
  const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, defval: '' });
  const encabezados = resolverIndiceEncabezados(filas);

  if (!encabezados) {
    return {
      cambios: [],
      filasIgnoradasSinFactura: 0,
      filasSinCambio: 0,
      errores: [
        'No se encontraron las columnas «N° de venta» y «N° de factura». Usá la planilla exportada desde Reportes → Ventas para facturación.',
      ],
    };
  }

  const cambios: CambioFacturacionPrevisto[] = [];
  const errores: string[] = [];
  let filasIgnoradasSinFactura = 0;
  let filasSinCambio = 0;
  const numerosVentaUsados = new Set<string>();

  for (let indice = encabezados.indiceEncabezado + 1; indice < filas.length; indice += 1) {
    const fila = filas[indice];
    if (!Array.isArray(fila)) continue;

    const numeroFila = indice + 1;
    const numeroVenta = valorCeldaTexto(fila[encabezados.indiceNumeroVenta]);
    const facturacionNueva = valorCeldaTexto(fila[encabezados.indiceNumeroFactura]);

    if (!numeroVenta && !facturacionNueva) continue;

    if (!numeroVenta) {
      errores.push(`Fila ${numeroFila}: falta el número de venta.`);
      continue;
    }

    if (!facturacionNueva) {
      filasIgnoradasSinFactura += 1;
      continue;
    }

    if (numerosVentaUsados.has(numeroVenta)) {
      errores.push(`Fila ${numeroFila}: el número de venta «${numeroVenta}» está repetido en el archivo.`);
      continue;
    }
    numerosVentaUsados.add(numeroVenta);

    const venta = ventasPorNumero.get(numeroVenta);
    if (!venta) {
      errores.push(`Fila ${numeroFila}: no existe la venta «${numeroVenta}» en el sistema.`);
      continue;
    }

    const facturacionActual = venta.facturacion.trim();
    if (facturacionActual === facturacionNueva) {
      filasSinCambio += 1;
      continue;
    }

    cambios.push({
      ventaId: venta.id,
      numeroVenta,
      nombreCliente: venta.nombreClienteMostrar,
      facturacionActual: facturacionActual || '—',
      facturacionNueva,
      estadoActual: venta.estadoFacturacion.nombre,
      estadoNuevo: NOMBRE_ESTADO_FACTURACION_FACTURADA,
    });
  }

  if (cambios.length === 0 && errores.length === 0) {
    errores.push(
      'No hay filas con número de factura para cargar. Completá la columna «N° de factura» en la planilla.',
    );
  }

  cambios.sort((a, b) => a.numeroVenta.localeCompare(b.numeroVenta, 'es', { sensitivity: 'base' }));

  return {
    cambios,
    filasIgnoradasSinFactura,
    filasSinCambio,
    errores,
  };
}
