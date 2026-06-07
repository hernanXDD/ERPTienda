import * as XLSX from 'xlsx';
import { armarNombreLineaComercial } from '../catalogo/catalogoPresentacion';
import type { Producto, Variante } from '../../tipos/catalogo';

/** Encabezados exactos de la plantilla (exportación e importación masiva). */
export const COLUMNAS_PLANTILLA_CONTEO_FISICO = {
  codigoProducto: 'Código de producto',
  nombreProducto: 'Nombre de producto',
  cantidadActual: 'Cantidad actual',
  stockFisico: 'Stock físico',
} as const;

function normalizarEncabezado(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

const ENCABEZADOS_NORMALIZADOS: Record<keyof typeof COLUMNAS_PLANTILLA_CONTEO_FISICO, string> = {
  codigoProducto: normalizarEncabezado(COLUMNAS_PLANTILLA_CONTEO_FISICO.codigoProducto),
  nombreProducto: normalizarEncabezado(COLUMNAS_PLANTILLA_CONTEO_FISICO.nombreProducto),
  cantidadActual: normalizarEncabezado(COLUMNAS_PLANTILLA_CONTEO_FISICO.cantidadActual),
  stockFisico: normalizarEncabezado(COLUMNAS_PLANTILLA_CONTEO_FISICO.stockFisico),
};

export interface FilaPlantillaConteoFisico {
  variante: Variante;
  producto: Producto;
  cantidadActual: number;
}

export interface CambioConteoPrevisto {
  varianteId: string;
  codigoProducto: string;
  nombreProducto: string;
  cantidadAnterior: number;
  cantidadNueva: number;
  delta: number;
}

export interface ResultadoParseoPlantillaConteo {
  cambios: CambioConteoPrevisto[];
  filasIgnoradasVacias: number;
  filasSinCambio: number;
  errores: string[];
  advertencias: string[];
}

function valorCeldaTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

function parsearStockFisico(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return null;
    return Math.floor(valor);
  }
  const texto = String(valor).trim().replace(',', '.');
  if (!texto) return null;
  const numero = Number(texto);
  if (!Number.isFinite(numero)) return null;
  return Math.floor(numero);
}

export function codigoProductoParaConteo(variante: Variante): string {
  const codigoBarras = variante.codigoBarras?.trim();
  return codigoBarras || variante.id;
}

export function armarIndiceCodigoVariante(variantes: readonly Variante[]): Map<string, Variante> {
  const mapa = new Map<string, Variante>();
  for (const variante of variantes) {
    if (!variante.activa) continue;
    const codigoExportado = codigoProductoParaConteo(variante);
    mapa.set(codigoExportado, variante);
    mapa.set(variante.id, variante);
    const codigoBarras = variante.codigoBarras?.trim();
    if (codigoBarras) mapa.set(codigoBarras, variante);
  }
  return mapa;
}

function resolverColumnas(filaEncabezado: Record<string, unknown>): Record<
  keyof typeof COLUMNAS_PLANTILLA_CONTEO_FISICO,
  string
> | null {
  const clavesPorNormalizado = new Map<string, string>();
  for (const clave of Object.keys(filaEncabezado)) {
    clavesPorNormalizado.set(normalizarEncabezado(clave), clave);
  }

  const resuelto = {} as Record<keyof typeof COLUMNAS_PLANTILLA_CONTEO_FISICO, string>;
  for (const clave of Object.keys(ENCABEZADOS_NORMALIZADOS) as Array<
    keyof typeof COLUMNAS_PLANTILLA_CONTEO_FISICO
  >) {
    const columna = clavesPorNormalizado.get(ENCABEZADOS_NORMALIZADOS[clave]);
    if (!columna) return null;
    resuelto[clave] = columna;
  }
  return resuelto;
}

export async function parsearArchivoConteoFisico(
  archivo: File,
  variantesActivas: readonly Variante[],
  productoPorId: (id: string) => Producto | undefined,
  cantidadActual: (varianteId: string) => number,
): Promise<ResultadoParseoPlantillaConteo> {
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array' });
  const nombreHoja = libro.SheetNames[0];
  if (!nombreHoja) {
    return {
      cambios: [],
      filasIgnoradasVacias: 0,
      filasSinCambio: 0,
      errores: ['El archivo no contiene hojas de cálculo.'],
      advertencias: [],
    };
  }

  const hoja = libro.Sheets[nombreHoja];
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '' });
  if (filas.length === 0) {
    return {
      cambios: [],
      filasIgnoradasVacias: 0,
      filasSinCambio: 0,
      errores: ['La planilla está vacía.'],
      advertencias: [],
    };
  }

  const columnas = resolverColumnas(filas[0]);
  if (!columnas) {
    return {
      cambios: [],
      filasIgnoradasVacias: 0,
      filasSinCambio: 0,
      errores: [
        'Encabezados inválidos. Usá la plantilla con: Código de producto, Nombre de producto, Cantidad actual y Stock físico.',
      ],
      advertencias: [],
    };
  }

  const indiceCodigos = armarIndiceCodigoVariante(variantesActivas);
  const cambios: CambioConteoPrevisto[] = [];
  const errores: string[] = [];
  const advertencias: string[] = [];
  let filasIgnoradasVacias = 0;
  let filasSinCambio = 0;
  const codigosUsados = new Set<string>();

  filas.forEach((fila, indice) => {
    const numeroFila = indice + 2;
    const codigo = valorCeldaTexto(fila[columnas.codigoProducto]);
    const stockFisico = parsearStockFisico(fila[columnas.stockFisico]);

    if (!codigo && stockFisico === null) {
      filasIgnoradasVacias += 1;
      return;
    }

    if (!codigo) {
      errores.push(`Fila ${numeroFila}: falta el código de producto.`);
      return;
    }

    if (stockFisico === null) {
      filasIgnoradasVacias += 1;
      return;
    }

    if (stockFisico < 0) {
      errores.push(`Fila ${numeroFila}: el stock físico debe ser mayor o igual a 0.`);
      return;
    }

    const variante = indiceCodigos.get(codigo);
    if (!variante) {
      errores.push(`Fila ${numeroFila}: código «${codigo}» no corresponde a ningún artículo activo.`);
      return;
    }

    if (codigosUsados.has(codigo)) {
      advertencias.push(`Fila ${numeroFila}: el código «${codigo}» está repetido; se usará el último valor.`);
    }
    codigosUsados.add(codigo);

    const producto = productoPorId(variante.productoId);
    if (!producto) {
      errores.push(`Fila ${numeroFila}: no se encontró el producto del código «${codigo}».`);
      return;
    }

    const cantidadAnterior = cantidadActual(variante.id);
    if (cantidadAnterior === stockFisico) {
      filasSinCambio += 1;
      return;
    }

    const existente = cambios.findIndex((c) => c.varianteId === variante.id);
    const cambio: CambioConteoPrevisto = {
      varianteId: variante.id,
      codigoProducto: codigoProductoParaConteo(variante),
      nombreProducto: armarNombreLineaComercial(producto, variante),
      cantidadAnterior,
      cantidadNueva: stockFisico,
      delta: stockFisico - cantidadAnterior,
    };

    if (existente >= 0) {
      cambios[existente] = cambio;
    } else {
      cambios.push(cambio);
    }
  });

  cambios.sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto, 'es', { sensitivity: 'base' }));

  return {
    cambios,
    filasIgnoradasVacias,
    filasSinCambio,
    errores,
    advertencias,
  };
}

export function armarFilasPlantillaConteoFisico(
  filas: FilaPlantillaConteoFisico[],
): Record<(typeof COLUMNAS_PLANTILLA_CONTEO_FISICO)[keyof typeof COLUMNAS_PLANTILLA_CONTEO_FISICO], string | number>[] {
  return filas.map(({ variante, producto, cantidadActual }) => ({
    [COLUMNAS_PLANTILLA_CONTEO_FISICO.codigoProducto]: codigoProductoParaConteo(variante),
    [COLUMNAS_PLANTILLA_CONTEO_FISICO.nombreProducto]: armarNombreLineaComercial(producto, variante),
    [COLUMNAS_PLANTILLA_CONTEO_FISICO.cantidadActual]: cantidadActual,
    [COLUMNAS_PLANTILLA_CONTEO_FISICO.stockFisico]: '',
  }));
}

function nombreArchivoConteoFisico(fecha = new Date()): string {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `conteo-fisico-${yyyy}-${mm}-${dd}.xlsx`;
}

export function descargarPlantillaConteoFisico(filas: FilaPlantillaConteoFisico[]): void {
  if (filas.length === 0) {
    throw new Error('No hay artículos activos para generar la plantilla.');
  }

  const datos = armarFilasPlantillaConteoFisico(filas);
  const hoja = XLSX.utils.json_to_sheet(datos, {
    header: [
      COLUMNAS_PLANTILLA_CONTEO_FISICO.codigoProducto,
      COLUMNAS_PLANTILLA_CONTEO_FISICO.nombreProducto,
      COLUMNAS_PLANTILLA_CONTEO_FISICO.cantidadActual,
      COLUMNAS_PLANTILLA_CONTEO_FISICO.stockFisico,
    ],
  });

  hoja['!cols'] = [{ wch: 18 }, { wch: 42 }, { wch: 16 }, { wch: 14 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Conteo físico');
  XLSX.writeFile(libro, nombreArchivoConteoFisico());
}
