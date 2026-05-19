import type { Categoria, Producto } from '../tipos/catalogo';

export const ID_CATEGORIA_REMERAS = 'c0000001-0000-4000-8000-000000000001';
export const ID_CATEGORIA_PANTALONES = 'c0000001-0000-4000-8000-000000000002';

export function crearSemillaCatalogo(): { categorias: Categoria[]; productos: Producto[] } {
  return {
    categorias: [
      { id: ID_CATEGORIA_REMERAS, nombre: 'Remeras', descripcion: 'Parte superior' },
      {
        id: ID_CATEGORIA_PANTALONES,
        nombre: 'Pantalones',
        descripcion: 'Prendas inferiores',
      },
    ],
    productos: [
      {
        id: 'p0000001-0000-4000-8000-000000000001',
        nombre: 'Remera modal básica',
        tipoPrenda: 'Remera',
        marca: 'Línea tienda',
        descripcion: 'Varios talles',
        categoriaId: ID_CATEGORIA_REMERAS,
        codigoBarras: '7791234567890',
        precioVenta: 15900,
      },
      {
        id: 'p0000001-0000-4000-8000-000000000002',
        nombre: 'Pantalón mom fit',
        tipoPrenda: 'Pantalón',
        marca: 'Línea tienda',
        descripcion: 'Denim',
        categoriaId: ID_CATEGORIA_PANTALONES,
        codigoBarras: '7799876543210',
        precioVenta: 28900,
      },
    ],
  };
}
