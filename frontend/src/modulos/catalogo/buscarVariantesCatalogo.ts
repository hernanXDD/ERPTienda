import type { Producto, Variante } from '../../tipos/catalogo';

export interface FilaVarianteCatalogo {
  variante: Variante;
  producto: Producto;
  nombreLinea: string;
  nombreCategoria: string;
}

export function textoCoincideBusquedaVariante(fila: FilaVarianteCatalogo, texto: string): boolean {
  const q = texto.trim().toLowerCase();
  if (!q) return false;
  const trozos = [
    fila.producto.nombre,
    fila.producto.marca,
    fila.producto.descripcion,
    fila.variante.talle,
    fila.variante.color,
    fila.variante.codigoBarras,
    fila.nombreCategoria,
    fila.nombreLinea,
  ].map((x) => x.toLowerCase());
  return trozos.some((t) => t.includes(q));
}

export function buscarVariantesCatalogo(
  filas: readonly FilaVarianteCatalogo[],
  texto: string,
  limite = 12,
): FilaVarianteCatalogo[] {
  const q = texto.trim();
  if (q.length < 2) return [];
  return [...filas]
    .filter((f) => textoCoincideBusquedaVariante(f, q))
    .sort((a, b) => a.nombreLinea.localeCompare(b.nombreLinea, 'es', { sensitivity: 'base' }))
    .slice(0, limite);
}
