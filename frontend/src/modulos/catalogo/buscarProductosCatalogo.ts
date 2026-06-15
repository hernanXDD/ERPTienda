import type { Producto, Variante } from '../../tipos/catalogo';
import { etiquetaTalle } from './catalogoPresentacion';
import type { FilaVarianteCatalogo } from './buscarVariantesCatalogo';

export interface FilaProductoCatalogo {
  producto: Producto;
  nombreCategoria: string;
  variantes: Variante[];
}

function ordenarVariantesPorTalle(variantes: Variante[]): Variante[] {
  return [...variantes].sort((a, b) =>
    etiquetaTalle(a.talle).localeCompare(etiquetaTalle(b.talle), 'es', { sensitivity: 'base' }),
  );
}

export function armarFilasProductoCatalogo(
  filasVariante: readonly FilaVarianteCatalogo[],
): FilaProductoCatalogo[] {
  const porProducto = new Map<string, FilaProductoCatalogo>();

  for (const fila of filasVariante) {
    const existente = porProducto.get(fila.producto.id);
    if (existente) {
      existente.variantes.push(fila.variante);
      continue;
    }
    porProducto.set(fila.producto.id, {
      producto: fila.producto,
      nombreCategoria: fila.nombreCategoria,
      variantes: [fila.variante],
    });
  }

  return [...porProducto.values()].map((fila) => ({
    ...fila,
    variantes: ordenarVariantesPorTalle(fila.variantes),
  }));
}

export function textoCoincideBusquedaProducto(fila: FilaProductoCatalogo, texto: string): boolean {
  const q = texto.trim().toLowerCase();
  if (!q) return false;
  const trozos = [
    fila.producto.nombre,
    fila.producto.marca,
    fila.producto.descripcion,
    fila.nombreCategoria,
    ...fila.variantes.flatMap((v) => [v.talle, v.codigoBarras]),
  ].map((x) => (x ?? '').toLowerCase());
  return trozos.some((t) => t.includes(q));
}

export function buscarProductosCatalogo(
  filas: readonly FilaProductoCatalogo[],
  texto: string,
  limite = 8,
): FilaProductoCatalogo[] {
  const q = texto.trim();
  if (q.length < 2) return [];
  return [...filas]
    .filter((f) => textoCoincideBusquedaProducto(f, q))
    .sort((a, b) =>
      a.producto.nombre.localeCompare(b.producto.nombre, 'es', { sensitivity: 'base' }),
    )
    .slice(0, limite);
}

export function etiquetaCantidadTalles(cantidad: number): string {
  if (cantidad === 1) return '1 talle';
  return `${cantidad} talles`;
}
