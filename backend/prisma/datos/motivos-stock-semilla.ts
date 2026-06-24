import {
  ID_MOTIVO_AJUSTE_CONTEO,
  ID_MOTIVO_ENTRADA_COMPRA,
  ID_MOTIVO_ENTRADA_DEVOLUCION,
  ID_MOTIVO_SALIDA_VENTA,
} from '../../src/comunes/constantes/ids-motivo-stock';

export {
  ID_MOTIVO_AJUSTE_CONTEO,
  ID_MOTIVO_ENTRADA_COMPRA,
  ID_MOTIVO_ENTRADA_DEVOLUCION,
  ID_MOTIVO_SALIDA_VENTA,
};

export interface MotivoStockSemilla {
  id: string;
  nombre: string;
  descripcion: string;
}

export const MOTIVOS_STOCK_SEMILLA: MotivoStockSemilla[] = [
  {
    id: ID_MOTIVO_SALIDA_VENTA,
    nombre: 'Salida por venta',
    descripcion: 'Descuento de inventario al registrar una venta.',
  },
  {
    id: ID_MOTIVO_ENTRADA_COMPRA,
    nombre: 'Entrada por compra',
    descripcion: 'Ingreso de mercadería por compra a proveedor o entrada manual.',
  },
  {
    id: ID_MOTIVO_AJUSTE_CONTEO,
    nombre: 'Ajuste por conteo',
    descripcion: 'Corrección de stock tras conteo físico o importación masiva.',
  },
  {
    id: ID_MOTIVO_ENTRADA_DEVOLUCION,
    nombre: 'Entrada por devolución',
    descripcion: 'Reingreso de mercadería por devolución de una venta.',
  },
];
