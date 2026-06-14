/**
 * IDs fijos para datos de prueba locales (bloque 200xxx).
 * No usar en producción: ejecutar solo con `npm run db:seed:demo`.
 */

export const ID_CATEGORIA_REMERA = '200001';
export const ID_CATEGORIA_PANTALON = '200002';

export const ID_PRODUCTO_REMERA = '200001';
export const ID_PRODUCTO_JEAN = '200002';

export const ID_VARIANTE_REMERA_M_NEGRO = '200001';
export const ID_VARIANTE_REMERA_L_AZUL = '200002';
export const ID_VARIANTE_JEAN_42_AZUL = '200003';
export const ID_VARIANTE_JEAN_44_NEGRO = '200004';

export const ID_CLIENTE_MARIA = '200001';
export const ID_CLIENTE_JUAN = '200002';
export const ID_CLIENTE_COMERCIO = '200003';

export const ID_PROVEEDOR_TEXTIL = '200001';
export const ID_PROVEEDOR_CONTADO = '200002';

export const ID_COMPRA_CONTADO = '200001';
export const ID_COMPRA_CUENTA = '200002';

export const ID_COMPRA_LINEA_1 = '200001';
export const ID_COMPRA_LINEA_2 = '200002';
export const ID_COMPRA_LINEA_3 = '200003';

export const ID_VENTA_EFECTIVO = '200001';
export const ID_VENTA_CUENTA = '200002';
export const ID_VENTA_TRANSFERENCIA = '200003';

export const ID_VENTA_LINEA_1 = '200001';
export const ID_VENTA_LINEA_2 = '200002';
export const ID_VENTA_LINEA_3 = '200003';

export const ID_AUDITORIA_COMPRA_1 = '200001';
export const ID_AUDITORIA_COMPRA_2 = '200002';
export const ID_AUDITORIA_VENTA_1 = '200003';
export const ID_AUDITORIA_VENTA_2 = '200004';
export const ID_AUDITORIA_VENTA_3 = '200005';

export const ID_MOV_STOCK_1 = '200001';
export const ID_MOV_STOCK_2 = '200002';
export const ID_MOV_STOCK_3 = '200003';
export const ID_MOV_STOCK_4 = '200004';
export const ID_MOV_STOCK_5 = '200005';
export const ID_MOV_STOCK_6 = '200006';

export const ID_MOV_CC_CLIENTE_CARGO = '200001';
export const ID_MOV_CC_CLIENTE_PAGO = '200002';

export const ID_MOV_CC_PROVEEDOR_CARGO = '200001';
export const ID_MOV_CC_PROVEEDOR_PAGO = '200002';

export const IDS_DEMO_CATEGORIAS = [ID_CATEGORIA_REMERA, ID_CATEGORIA_PANTALON] as const;
export const IDS_DEMO_PRODUCTOS = [ID_PRODUCTO_REMERA, ID_PRODUCTO_JEAN] as const;
export const IDS_DEMO_VARIANTES = [
  ID_VARIANTE_REMERA_M_NEGRO,
  ID_VARIANTE_REMERA_L_AZUL,
  ID_VARIANTE_JEAN_42_AZUL,
  ID_VARIANTE_JEAN_44_NEGRO,
] as const;
export const IDS_DEMO_CLIENTES = [ID_CLIENTE_MARIA, ID_CLIENTE_JUAN, ID_CLIENTE_COMERCIO] as const;
export const IDS_DEMO_PROVEEDORES = [ID_PROVEEDOR_TEXTIL, ID_PROVEEDOR_CONTADO] as const;
export const IDS_DEMO_COMPRAS = [ID_COMPRA_CONTADO, ID_COMPRA_CUENTA] as const;
export const IDS_DEMO_VENTAS = [ID_VENTA_EFECTIVO, ID_VENTA_CUENTA, ID_VENTA_TRANSFERENCIA] as const;
