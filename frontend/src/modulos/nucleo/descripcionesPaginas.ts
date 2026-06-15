/** Textos de cabecera (pg-sub) por nombre de ruta del menú principal. */
export const DESCRIPCIONES_PAGINA: Record<string, string> = {
  inicio:
    'Panel de control con indicadores del día, alertas operativas y actividad reciente de ventas e inventario.',
  'ventas-centro':
    'Registro de operaciones en mostrador: productos, cliente, formas de pago y confirmación de la venta.',
  'ventas-historial':
    'Consultá ventas registradas, filtrá por cliente o rango de fechas y revisá el detalle de cada operación.',
  'clientes-alta':
    'Fichas de clientes, contacto y condiciones comerciales. Buscá por nombre, documento o correo y gestioná la cuenta corriente.',
  'clientes-cuentas-corrientes':
    'Límites y saldos según movimientos registrados. Abrí el detalle por cliente para filtrar períodos y registrar pagos.',
  'compras-proveedores':
    'Directorio de proveedores con datos de contacto, condiciones de compra y condiciones de pago.',
  'compras-registro':
    'Compras registradas contra proveedores con impacto automático en stock e inventario.',
  'compras-cuentas-corrientes-proveedor':
    'Saldos y movimientos con proveedores. Abrí el detalle para filtrar períodos y registrar pagos.',
  'productos-catalogo':
    'Artículos del negocio con variantes por talle. El color o modelo va en el nombre del producto; el stock y las ventas operan sobre cada talle.',
  'productos-categorias':
    'Clasificación de productos por rubro. Cada artículo del catálogo debe tener una categoría asignada. No se puede eliminar una categoría con productos asociados.',
  'stock-actual':
    'Existencias disponibles para la venta. Las ventas del centro de ventas descuentan stock al confirmar. El conteo físico permite actualizar existencias masivamente.',
  'stock-auditorias':
    'Historial de movimientos agrupados por auditoría: ventas, compras y conteos físicos. Para el saldo vigente consultá Stock actual.',
  'reportes-panel':
    'Elegí un reporte, aplicá filtros y exportá en PDF o Excel según corresponda.',
  'usuarios-alta':
    'Alta y mantenimiento de cuentas del personal. Las acciones sensibles dependen de los permisos asignados a cada operador.',
  'usuarios-permisos':
    'Módulos visibles en el menú y permisos operativos de la tienda. Editá y confirmá con «Guardar cambios». Inicio queda siempre habilitado.',
  'configuracion-negocio':
    'Datos fiscales, domicilio y redes de la tienda. Se utilizan en reportes, comprobantes e identidad del negocio.',
  'configuracion-sistema':
    'Límites de cuenta corriente, alertas de stock, porcentaje de ganancia sugerido y plazos de deuda.',
  'configuracion-app':
    'Opciones avanzadas de administración reservadas al administrador principal del sistema.',
};

export function obtenerDescripcionPagina(nombreRuta: string): string {
  return DESCRIPCIONES_PAGINA[nombreRuta] ?? '';
}
