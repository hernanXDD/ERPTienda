import type { Categoria, Producto, Variante } from '../tipos/catalogo';

export const ID_CATEGORIA_REMERA = 'c0000001-0000-4000-8000-000000000001';
export const ID_CATEGORIA_PANTALON = 'c0000001-0000-4000-8000-000000000002';
export const ID_CATEGORIA_BUZO = 'c0000001-0000-4000-8000-000000000003';
export const ID_CATEGORIA_CALZADO = 'c0000001-0000-4000-8000-000000000004';

export const ID_PRODUCTO_REMERA = 'p0000001-0000-4000-8000-000000000001';
export const ID_PRODUCTO_PANTALON = 'p0000001-0000-4000-8000-000000000002';
export const ID_PRODUCTO_BUZO = 'p0000001-0000-4000-8000-000000000003';

export const ID_VARIANTE_REMERA_S_NEGRO = 'v0000001-0000-4000-8000-000000000001';
export const ID_VARIANTE_REMERA_M_NEGRO = 'v0000001-0000-4000-8000-000000000002';
export const ID_VARIANTE_REMERA_L_NEGRO = 'v0000001-0000-4000-8000-000000000003';
export const ID_VARIANTE_REMERA_M_ROJO = 'v0000001-0000-4000-8000-000000000004';
export const ID_VARIANTE_PANTALON_40_AZUL = 'v0000001-0000-4000-8000-000000000005';
export const ID_VARIANTE_PANTALON_42_AZUL = 'v0000001-0000-4000-8000-000000000006';
export const ID_VARIANTE_BUZO_M_GRIS = 'v0000001-0000-4000-8000-000000000007';

export interface SemillaCatalogo {
  categorias: Categoria[];
  productos: Producto[];
  variantes: Variante[];
}

export function crearSemillaCatalogo(): SemillaCatalogo {
  return {
    categorias: [
      { id: ID_CATEGORIA_REMERA, nombre: 'Remera', descripcion: 'Prenda superior' },
      { id: ID_CATEGORIA_PANTALON, nombre: 'Pantalón', descripcion: 'Prenda inferior' },
      { id: ID_CATEGORIA_BUZO, nombre: 'Buzo', descripcion: 'Abrigo liviano' },
      { id: ID_CATEGORIA_CALZADO, nombre: 'Calzado', descripcion: 'Calzado y zapatillas' },
    ],
    productos: [
      {
        id: ID_PRODUCTO_REMERA,
        nombre: 'Remera modal básica',
        marca: 'Línea tienda',
        descripcion: 'Algodón modal, corte regular',
        categoriaId: ID_CATEGORIA_REMERA,
        precioVenta: 15900,
      },
      {
        id: ID_PRODUCTO_PANTALON,
        nombre: 'Pantalón mom fit',
        marca: 'Línea tienda',
        descripcion: 'Denim elastizado',
        categoriaId: ID_CATEGORIA_PANTALON,
        precioVenta: 28900,
      },
      {
        id: ID_PRODUCTO_BUZO,
        nombre: 'Buzo frisa liso',
        marca: 'Línea tienda',
        descripcion: 'Frisa peinada, cuello redondo',
        categoriaId: ID_CATEGORIA_BUZO,
        precioVenta: 24900,
      },
    ],
    variantes: [
      {
        id: ID_VARIANTE_REMERA_S_NEGRO,
        productoId: ID_PRODUCTO_REMERA,
        talle: 'S',
        color: 'Negro',
        codigoBarras: '7791234567891',
        activa: true,
      },
      {
        id: ID_VARIANTE_REMERA_M_NEGRO,
        productoId: ID_PRODUCTO_REMERA,
        talle: 'M',
        color: 'Negro',
        codigoBarras: '7791234567892',
        activa: true,
      },
      {
        id: ID_VARIANTE_REMERA_L_NEGRO,
        productoId: ID_PRODUCTO_REMERA,
        talle: 'L',
        color: 'Negro',
        codigoBarras: '7791234567893',
        activa: true,
      },
      {
        id: ID_VARIANTE_REMERA_M_ROJO,
        productoId: ID_PRODUCTO_REMERA,
        talle: 'M',
        color: 'Rojo',
        codigoBarras: '7791234567894',
        activa: true,
      },
      {
        id: ID_VARIANTE_PANTALON_40_AZUL,
        productoId: ID_PRODUCTO_PANTALON,
        talle: '40',
        color: 'Azul',
        codigoBarras: '7799876543211',
        activa: true,
      },
      {
        id: ID_VARIANTE_PANTALON_42_AZUL,
        productoId: ID_PRODUCTO_PANTALON,
        talle: '42',
        color: 'Azul',
        codigoBarras: '7799876543212',
        activa: true,
      },
      {
        id: ID_VARIANTE_BUZO_M_GRIS,
        productoId: ID_PRODUCTO_BUZO,
        talle: 'M',
        color: 'Gris',
        codigoBarras: '7795555555555',
        activa: true,
      },
    ],
  };
}
