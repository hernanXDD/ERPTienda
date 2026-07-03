import * as XLSX from 'xlsx';
import { armarNombreLineaComercial } from '../catalogo/catalogoPresentacion';
import {
  esCodigoBarrasEan13Valido,
  generarCodigoBarrasNuevoVariante,
} from '../catalogo/codigoBarras';
import type { Categoria, Producto, Variante } from '../../tipos/catalogo';
import { claveUnicaVariante } from '../catalogo/catalogoPresentacion';

export const COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL = {
  nombre: 'Nombre',
  marca: 'Marca',
  categoria: 'Categoría',
  precioVenta: 'Precio de venta',
  descripcion: 'Descripción',
  talle: 'Talle',
  codigoBarras: 'Código de barras',
  stock: 'Stock',
} as const;

const ENCABEZADOS_HOJA_DATOS = [
  COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.nombre,
  COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.marca,
  COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.categoria,
  COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.precioVenta,
  COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.descripcion,
  COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.talle,
  COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.codigoBarras,
  COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.stock,
] as const;

const FILAS_EJEMPLO: Record<(typeof ENCABEZADOS_HOJA_DATOS)[number], string | number>[] = [
  {
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.nombre]: 'Remera básica',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.marca]: 'Marca ejemplo',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.categoria]: 'Remeras',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.precioVenta]: 15000,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.descripcion]: 'Algodón peinado',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.talle]: 'M',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.codigoBarras]: '',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.stock]: 5,
  },
  {
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.nombre]: 'Remera básica',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.marca]: 'Marca ejemplo',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.categoria]: 'Remeras',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.precioVenta]: 15000,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.descripcion]: 'Algodón peinado',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.talle]: 'L',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.codigoBarras]: '',
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.stock]: 3,
  },
];

export interface LineaCargaStockInicialApi {
  productoId?: string;
  nombre: string;
  marca: string;
  categoriaId: string;
  precioVenta: number;
  descripcion?: string;
  talle: string;
  codigoBarras?: string;
  stock: number;
}

export interface LineaCargaStockInicialPrevista extends LineaCargaStockInicialApi {
  nombreCategoria: string;
  nombreVariante: string;
}

export interface LineaActualizacionStockPrevista {
  varianteId: string;
  codigoBarras: string;
  nombreVariante: string;
  stockAnterior: number;
  stockNuevo: number;
}

export interface FilaCatalogoStockCeroExport {
  producto: Producto;
  variante: Variante;
  nombreCategoria: string;
  stock: number;
}

export interface ResultadoParseoCargaStockInicial {
  lineas: LineaCargaStockInicialPrevista[];
  actualizacionesStock: LineaActualizacionStockPrevista[];
  filasIgnoradasVacias: number;
  filasSinCambio: number;
  errores: string[];
  advertencias: string[];
}

function normalizarEncabezado(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

const ENCABEZADOS_NORMALIZADOS: Record<keyof typeof COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL, string> =
  {
    nombre: normalizarEncabezado(COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.nombre),
    marca: normalizarEncabezado(COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.marca),
    categoria: normalizarEncabezado(COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.categoria),
    precioVenta: normalizarEncabezado(COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.precioVenta),
    descripcion: normalizarEncabezado(COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.descripcion),
    talle: normalizarEncabezado(COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.talle),
    codigoBarras: normalizarEncabezado(COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.codigoBarras),
    stock: normalizarEncabezado(COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.stock),
  };

function valorCeldaTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

function parsearNumeroEntero(valor: unknown): number | null {
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

function parsearPrecio(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor) || valor < 0) return null;
    return Math.round(valor * 100) / 100;
  }
  const texto = String(valor).trim().replace(/\./g, '').replace(',', '.');
  if (!texto) return null;
  const numero = Number(texto);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return Math.round(numero * 100) / 100;
}

function resolverColumnas(filaEncabezado: Record<string, unknown>): Record<
  keyof typeof COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL,
  string
> | null {
  const clavesPorNormalizado = new Map<string, string>();
  for (const clave of Object.keys(filaEncabezado)) {
    clavesPorNormalizado.set(normalizarEncabezado(clave), clave);
  }

  const resuelto = {} as Record<keyof typeof COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL, string>;
  for (const clave of Object.keys(ENCABEZADOS_NORMALIZADOS) as Array<
    keyof typeof COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL
  >) {
    const columna = clavesPorNormalizado.get(ENCABEZADOS_NORMALIZADOS[clave]);
    if (!columna) return null;
    resuelto[clave] = columna;
  }
  return resuelto;
}

function claveGrupoProducto(nombre: string, marca: string, categoriaId: string): string {
  return `${nombre.trim().toLowerCase()}|${marca.trim().toLowerCase()}|${categoriaId}`;
}

function claveTalleNormalizado(talle: string): string {
  return talle.trim().toLowerCase();
}

function productoCoincideConFila(
  producto: { nombre: string; marca: string; categoriaId: string },
  nombre: string,
  marca: string,
  categoriaId: string,
): boolean {
  return (
    producto.categoriaId === categoriaId &&
    producto.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
    producto.marca.trim().toLowerCase() === marca.trim().toLowerCase()
  );
}

function armarIndiceCategorias(categorias: readonly Categoria[]): Map<string, Categoria> {
  const mapa = new Map<string, Categoria>();
  for (const categoria of categorias) {
    mapa.set(normalizarEncabezado(categoria.nombre), categoria);
  }
  return mapa;
}

function armarFilaExcelDesdeCatalogo(
  fila: FilaCatalogoStockCeroExport,
): Record<(typeof ENCABEZADOS_HOJA_DATOS)[number], string | number> {
  return {
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.nombre]: fila.producto.nombre,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.marca]: fila.producto.marca,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.categoria]: fila.nombreCategoria,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.precioVenta]: fila.producto.precioVenta,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.descripcion]: fila.producto.descripcion,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.talle]: fila.variante.talle,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.codigoBarras]: fila.variante.codigoBarras,
    [COLUMNAS_PLANTILLA_CARGA_STOCK_INICIAL.stock]: fila.stock,
  };
}

function nombreArchivoPlantilla(fecha = new Date()): string {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `carga-stock-inicial-${yyyy}-${mm}-${dd}.xlsx`;
}

export function descargarPlantillaCargaStockInicial(
  categorias: readonly Categoria[],
  filasStockCero: readonly FilaCatalogoStockCeroExport[] = [],
): void {
  if (categorias.length === 0) {
    throw new Error('No hay categorías cargadas. Creá al menos una categoría antes de descargar la plantilla.');
  }

  const filasCatalogo = filasStockCero.map(armarFilaExcelDesdeCatalogo);
  const filasHoja = [...FILAS_EJEMPLO, ...filasCatalogo];

  const hojaDatos = XLSX.utils.json_to_sheet(filasHoja, { header: [...ENCABEZADOS_HOJA_DATOS] });
  hojaDatos['!cols'] = [
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 24 },
    { wch: 10 },
    { wch: 18 },
    { wch: 10 },
  ];

  const instrucciones = [
    ['Carga inicial de catálogo y stock'],
    [''],
    ['1. Completá una fila por cada talle de cada producto.'],
    ['2. Repetí nombre, marca, categoría, precio y descripción para agrupar talles del mismo producto.'],
    ['3. La categoría debe coincidir exactamente con una de la hoja «Categorías».'],
    ['4. El código de barras es opcional en productos nuevos; si lo dejás vacío, el sistema lo genera al importar.'],
    ['5. El stock es la cantidad inicial de cada artículo.'],
    ['6. La plantilla incluye artículos existentes con stock 0 (también si están inactivos). Podés actualizar su stock y agregar productos nuevos en las mismas filas.'],
    ['7. No modifiques los nombres de las columnas de la hoja «Productos».'],
  ];

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
  hojaInstrucciones['!cols'] = [{ wch: 78 }];

  const filasCategorias = categorias
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    .map((categoria) => ({ Categoría: categoria.nombre }));

  const hojaCategorias = XLSX.utils.json_to_sheet(filasCategorias);
  hojaCategorias['!cols'] = [{ wch: 28 }];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hojaInstrucciones, 'Instrucciones');
  XLSX.utils.book_append_sheet(libro, hojaCategorias, 'Categorías');
  XLSX.utils.book_append_sheet(libro, hojaDatos, 'Productos');
  XLSX.writeFile(libro, nombreArchivoPlantilla());
}

export async function parsearArchivoCargaStockInicial(
  archivo: File,
  categorias: readonly Categoria[],
  codigosBarrasEnUso: ReadonlySet<string>,
  productosExistentes: ReadonlyArray<{
    id: string;
    nombre: string;
    marca: string;
    categoriaId: string;
  }>,
  variantesExistentes: ReadonlyArray<{
    id: string;
    productoId: string;
    talle: string;
    color: string;
    codigoBarras: string;
  }>,
  stockActual: (varianteId: string) => number,
): Promise<ResultadoParseoCargaStockInicial> {
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array' });
  const nombreHoja =
    libro.SheetNames.find((nombre) => normalizarEncabezado(nombre) === 'productos') ??
    libro.SheetNames[0];

  if (!nombreHoja) {
    return {
      lineas: [],
      actualizacionesStock: [],
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
      lineas: [],
      actualizacionesStock: [],
      filasIgnoradasVacias: 0,
      filasSinCambio: 0,
      errores: ['La planilla está vacía.'],
      advertencias: [],
    };
  }

  const columnas = resolverColumnas(filas[0]);
  if (!columnas) {
    return {
      lineas: [],
      actualizacionesStock: [],
      filasIgnoradasVacias: 0,
      filasSinCambio: 0,
      errores: [
        'Encabezados inválidos. Usá la plantilla del sistema con las columnas: Nombre, Marca, Categoría, Precio de venta, Descripción, Talle, Código de barras y Stock.',
      ],
      advertencias: [],
    };
  }

  const indiceCategorias = armarIndiceCategorias(categorias);
  const lineas: LineaCargaStockInicialPrevista[] = [];
  const actualizacionesStock: LineaActualizacionStockPrevista[] = [];
  const errores: string[] = [];
  const advertencias: string[] = [];
  let filasIgnoradasVacias = 0;
  let filasSinCambio = 0;

  const tallesPorGrupo = new Map<string, Set<string>>();
  const preciosPorGrupo = new Map<string, number>();
  const descripcionesPorGrupo = new Map<string, string>();
  const codigosUsadosArchivo = new Set<string>();
  const codigosGenerados = new Set(codigosBarrasEnUso);
  const variantesUsadasArchivo = new Set<string>();

  function buscarVarianteExistente(
    nombreProducto: string,
    marcaProducto: string,
    categoriaId: string,
    talleVariante: string,
    codigoBarrasVariante: string,
    numeroFila: number,
  ): (typeof variantesExistentes)[number] | 'error' | undefined {
    const codigo = codigoBarrasVariante.trim();
    if (codigo) {
      const porCodigo = variantesExistentes.find((variante) => variante.codigoBarras.trim() === codigo);
      if (porCodigo) {
        const producto = productosExistentes.find((item) => item.id === porCodigo.productoId);
        if (producto && productoCoincideConFila(producto, nombreProducto, marcaProducto, categoriaId)) {
          return porCodigo;
        }
        if (producto) {
          errores.push(
            `Fila ${numeroFila}: el código de barras pertenece a «${producto.nombre}»; dejalo vacío para crear un producto nuevo.`,
          );
          return 'error';
        }
      }
    }

    const producto = productosExistentes.find(
      (item) =>
        item.categoriaId === categoriaId &&
        item.nombre.trim().toLowerCase() === nombreProducto.trim().toLowerCase() &&
        item.marca.trim().toLowerCase() === marcaProducto.trim().toLowerCase(),
    );
    if (!producto) return undefined;

    return variantesExistentes.find(
      (variante) =>
        variante.productoId === producto.id &&
        claveUnicaVariante(variante.talle, variante.color) ===
          claveUnicaVariante(talleVariante, ''),
    );
  }

  filas.forEach((fila, indice) => {
    const numeroFila = indice + 2;
    const nombre = valorCeldaTexto(fila[columnas.nombre]);
    const marca = valorCeldaTexto(fila[columnas.marca]);
    const categoriaTexto = valorCeldaTexto(fila[columnas.categoria]);
    const talle = valorCeldaTexto(fila[columnas.talle]);
    const stock = parsearNumeroEntero(fila[columnas.stock]);
    const precioVenta = parsearPrecio(fila[columnas.precioVenta]);
    const descripcion = valorCeldaTexto(fila[columnas.descripcion]);
    const codigoBarras = valorCeldaTexto(fila[columnas.codigoBarras]);

    if (!nombre && !marca && !categoriaTexto && !talle && stock === null) {
      filasIgnoradasVacias += 1;
      return;
    }

    if (
      nombre.toLowerCase() === 'remera básica' &&
      marca.toLowerCase() === 'marca ejemplo'
    ) {
      filasIgnoradasVacias += 1;
      return;
    }

    if (!nombre) {
      errores.push(`Fila ${numeroFila}: falta el nombre del producto.`);
      return;
    }
    if (!marca) {
      errores.push(`Fila ${numeroFila}: falta la marca.`);
      return;
    }
    if (!categoriaTexto) {
      errores.push(`Fila ${numeroFila}: falta la categoría.`);
      return;
    }
    if (!talle) {
      errores.push(`Fila ${numeroFila}: falta el talle.`);
      return;
    }
    if (precioVenta === null) {
      errores.push(`Fila ${numeroFila}: el precio de venta es inválido.`);
      return;
    }
    if (stock === null) {
      errores.push(`Fila ${numeroFila}: el stock es inválido.`);
      return;
    }
    if (stock < 0) {
      errores.push(`Fila ${numeroFila}: el stock debe ser mayor o igual a 0.`);
      return;
    }

    const categoria = indiceCategorias.get(normalizarEncabezado(categoriaTexto));
    if (!categoria) {
      errores.push(`Fila ${numeroFila}: la categoría «${categoriaTexto}» no existe.`);
      return;
    }

    const claveGrupo = claveGrupoProducto(nombre, marca, categoria.id);
    const precioPrevio = preciosPorGrupo.get(claveGrupo);
    if (precioPrevio !== undefined && precioPrevio !== precioVenta) {
      errores.push(`Fila ${numeroFila}: el producto «${nombre}» tiene precios distintos en el archivo.`);
      return;
    }
    preciosPorGrupo.set(claveGrupo, precioVenta);

    const descripcionPrevio = descripcionesPorGrupo.get(claveGrupo);
    if (descripcionPrevio !== undefined && descripcionPrevio !== descripcion) {
      errores.push(
        `Fila ${numeroFila}: el producto «${nombre}» tiene descripciones distintas en el archivo.`,
      );
      return;
    }
    descripcionesPorGrupo.set(claveGrupo, descripcion);

    const claveTalle = claveTalleNormalizado(talle);
    const tallesGrupo = tallesPorGrupo.get(claveGrupo) ?? new Set<string>();
    if (tallesGrupo.has(claveTalle)) {
      errores.push(`Fila ${numeroFila}: el talle «${talle}» está repetido para «${nombre}».`);
      return;
    }
    tallesGrupo.add(claveTalle);
    tallesPorGrupo.set(claveGrupo, tallesGrupo);

    const varianteExistente = buscarVarianteExistente(
      nombre,
      marca,
      categoria.id,
      talle,
      codigoBarras,
      numeroFila,
    );

    if (varianteExistente === 'error') {
      return;
    }

    if (varianteExistente) {
      const stockAnterior = stockActual(varianteExistente.id);
      if (variantesUsadasArchivo.has(varianteExistente.id)) {
        advertencias.push(
          `Fila ${numeroFila}: el artículo «${nombre}» (${talle}) está repetido; se usará el último valor.`,
        );
      }
      variantesUsadasArchivo.add(varianteExistente.id);

      if (stockAnterior === stock) {
        filasSinCambio += 1;
        return;
      }

      const productoExistente = productosExistentes.find((item) => item.id === varianteExistente.productoId);
      const nombreVariante = armarNombreLineaComercial(
        {
          id: productoExistente?.id ?? '',
          nombre,
          marca,
          descripcion,
          categoriaId: categoria.id,
          precioVenta,
        },
        {
          id: varianteExistente.id,
          productoId: varianteExistente.productoId,
          talle,
          color: varianteExistente.color,
          codigoBarras: varianteExistente.codigoBarras,
          activa: true,
        },
      );

      const existenteIdx = actualizacionesStock.findIndex(
        (item) => item.varianteId === varianteExistente.id,
      );
      const actualizacion: LineaActualizacionStockPrevista = {
        varianteId: varianteExistente.id,
        codigoBarras: varianteExistente.codigoBarras || codigoBarras,
        nombreVariante,
        stockAnterior,
        stockNuevo: stock,
      };
      if (existenteIdx >= 0) {
        actualizacionesStock[existenteIdx] = actualizacion;
      } else {
        actualizacionesStock.push(actualizacion);
      }
      return;
    }

    const productoExistente = productosExistentes.find(
      (producto) =>
        producto.categoriaId === categoria.id &&
        producto.nombre.trim().toLowerCase() === nombre.toLowerCase() &&
        producto.marca.trim().toLowerCase() === marca.toLowerCase(),
    );
    if (productoExistente) {
      let codigoFinal = codigoBarras;
      if (codigoFinal) {
        if (!esCodigoBarrasEan13Valido(codigoFinal)) {
          errores.push(`Fila ${numeroFila}: el código de barras «${codigoFinal}» no es un EAN-13 válido.`);
          return;
        }
        if (codigosBarrasEnUso.has(codigoFinal)) {
          errores.push(`Fila ${numeroFila}: el código de barras «${codigoFinal}» ya está en uso.`);
          return;
        }
        if (codigosUsadosArchivo.has(codigoFinal)) {
          advertencias.push(`Fila ${numeroFila}: el código «${codigoFinal}» está repetido; se usará el último valor.`);
        }
        codigosUsadosArchivo.add(codigoFinal);
      } else {
        codigoFinal = generarCodigoBarrasNuevoVariante(codigosGenerados);
        codigosGenerados.add(codigoFinal);
      }

      lineas.push({
        productoId: productoExistente.id,
        nombre,
        marca,
        categoriaId: categoria.id,
        precioVenta,
        descripcion: descripcion || undefined,
        talle,
        codigoBarras: codigoFinal,
        stock,
        nombreCategoria: categoria.nombre,
        nombreVariante: armarNombreLineaComercial(
          { nombre, marca, descripcion, categoriaId: categoria.id, precioVenta, id: productoExistente.id },
          { id: '', productoId: productoExistente.id, talle, color: '', codigoBarras: codigoFinal, activa: true },
        ),
      });
      return;
    }

    let codigoFinal = codigoBarras;
    if (codigoFinal) {
      if (!esCodigoBarrasEan13Valido(codigoFinal)) {
        errores.push(`Fila ${numeroFila}: el código de barras «${codigoFinal}» no es un EAN-13 válido.`);
        return;
      }
      if (codigosBarrasEnUso.has(codigoFinal)) {
        errores.push(`Fila ${numeroFila}: el código de barras «${codigoFinal}» ya está en uso.`);
        return;
      }
      if (codigosUsadosArchivo.has(codigoFinal)) {
        advertencias.push(`Fila ${numeroFila}: el código «${codigoFinal}» está repetido; se usará el último valor.`);
      }
      codigosUsadosArchivo.add(codigoFinal);
    } else {
      codigoFinal = generarCodigoBarrasNuevoVariante(codigosGenerados);
      codigosGenerados.add(codigoFinal);
    }

    lineas.push({
      nombre,
      marca,
      categoriaId: categoria.id,
      precioVenta,
      descripcion: descripcion || undefined,
      talle,
      codigoBarras: codigoFinal,
      stock,
      nombreCategoria: categoria.nombre,
      nombreVariante: armarNombreLineaComercial(
        { nombre, marca, descripcion, categoriaId: categoria.id, precioVenta, id: '' },
        { id: '', productoId: '', talle, color: '', codigoBarras: codigoFinal, activa: true },
      ),
    });
  });

  lineas.sort((a, b) => a.nombreVariante.localeCompare(b.nombreVariante, 'es', { sensitivity: 'base' }));
  actualizacionesStock.sort((a, b) =>
    a.nombreVariante.localeCompare(b.nombreVariante, 'es', { sensitivity: 'base' }),
  );

  return {
    lineas,
    actualizacionesStock,
    filasIgnoradasVacias,
    filasSinCambio,
    errores,
    advertencias,
  };
}

export function contarProductosUnicosCargaStock(lineas: readonly LineaCargaStockInicialPrevista[]): number {
  const claves = new Set(
    lineas
      .filter((linea) => !linea.productoId)
      .map((linea) => claveGrupoProducto(linea.nombre, linea.marca, linea.categoriaId)),
  );
  return claves.size;
}

export function contarVariantesNuevasProductoExistente(
  lineas: readonly LineaCargaStockInicialPrevista[],
): number {
  return lineas.filter((linea) => linea.productoId).length;
}
