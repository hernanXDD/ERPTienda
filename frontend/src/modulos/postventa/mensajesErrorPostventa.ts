import { mensajeErrorHttp } from '../../servicios/apiUtil';

export type TipoErrorCuponEscaneo =
  | 'vencido'
  | 'usado'
  | 'anulado'
  | 'otro_cliente'
  | 'no_encontrado'
  | 'vacio'
  | 'generico';

export interface ErrorCuponEscaneo {
  tipo: TipoErrorCuponEscaneo;
  mensaje: string;
}

export const ADVERTENCIA_CUPON_TRAS_DEVOLUCION =
  'La devolución quedó registrada, pero no se pudo emitir el cupón. Creá uno manualmente desde Ventas → Cupones.';

export const ADVERTENCIA_VENTA_CAMBIO_TRAS_DEVOLUCION =
  'La devolución quedó registrada, pero no se pudo registrar la venta del cambio. Registrala manualmente desde el centro de ventas.';

const PATRONES_CUPON: Array<{ patron: RegExp; tipo: TipoErrorCuponEscaneo; mensaje: string }> = [
  {
    patron: /vencid|venció/i,
    tipo: 'vencido',
    mensaje: 'Este cupón venció y ya no puede utilizarse en caja.',
  },
  {
    patron: /utilizad|ya fue usad/i,
    tipo: 'usado',
    mensaje: 'Este cupón ya se usó en otra venta y no puede aplicarse de nuevo.',
  },
  {
    patron: /anulad/i,
    tipo: 'anulado',
    mensaje: 'Este cupón fue anulado y no puede utilizarse.',
  },
  {
    patron: /otro cliente|pertenece a otro/i,
    tipo: 'otro_cliente',
    mensaje: 'Este cupón está asignado a otro cliente. Verificá el cliente del ticket.',
  },
  {
    patron: /no encontr|no hay ningún cupón/i,
    tipo: 'no_encontrado',
    mensaje: 'No encontramos un cupón con ese código. Revisá el escaneo e intentá de nuevo.',
  },
  {
    patron: /ya existe un cupón|vinculado a esa devolución/i,
    tipo: 'generico',
    mensaje: 'Esa devolución ya tiene un cupón emitido.',
  },
  {
    patron: /superar el total devuelt/i,
    tipo: 'generico',
    mensaje: 'El monto del cupón no puede ser mayor al total devuelto.',
  },
];

const PATRONES_DEVOLUCION: Array<{ patron: RegExp; mensaje: string }> = [
  {
    patron: /superó el plazo|ya no admite devoluciones/i,
    mensaje: 'Esta venta ya no admite devoluciones porque superó el plazo configurado.',
  },
  {
    patron: /cantidad inválida|disponible \d+/i,
    mensaje: 'La cantidad a devolver supera lo que queda disponible en la venta. Revisá las prendas seleccionadas.',
  },
  {
    patron: /no pertenece a la venta|no corresponde a la venta/i,
    mensaje: 'Una de las prendas seleccionadas no corresponde a esta venta.',
  },
  {
    patron: /al menos una línea|cantidad mayor a cero/i,
    mensaje: 'Seleccioná al menos una prenda con cantidad mayor a cero.',
  },
  {
    patron: /venta no encontrada/i,
    mensaje: 'No encontramos la venta seleccionada. Actualizá el listado e intentá de nuevo.',
  },
];

function mensajeDesdePatrones(texto: string, patrones: Array<{ patron: RegExp; mensaje: string }>): string | null {
  for (const { patron, mensaje } of patrones) {
    if (patron.test(texto)) return mensaje;
  }
  return null;
}

/** Mensaje claro para operaciones con cupones (listado, alta, anulación, vista). */
export function mensajeErrorCupon(error: unknown, contexto: 'cargar' | 'crear' | 'anular' | 'codigo' | 'vista'): string {
  const fallbacks: Record<typeof contexto, string> = {
    cargar: 'No se pudieron cargar los cupones. Verificá tu conexión e intentá de nuevo.',
    crear: 'No se pudo crear el cupón. Revisá los datos e intentá de nuevo.',
    anular: 'No se pudo anular el cupón. Intentá de nuevo en unos segundos.',
    codigo: 'No se pudo obtener el código del cupón para imprimir o descargar.',
    vista: 'No se pudo generar la vista del cupón. Intentá de nuevo.',
  };

  const crudo = mensajeErrorHttp(error, fallbacks[contexto]);
  return mensajeDesdePatrones(crudo, PATRONES_CUPON) ?? crudo;
}

/** Mensaje claro para registrar o listar devoluciones. */
export function mensajeErrorDevolucion(error: unknown, contexto: 'cargar' | 'registrar'): string {
  const fallbacks = {
    cargar: 'No se pudo cargar el historial de devoluciones. Intentá actualizar la página.',
    registrar: 'No se pudo completar la devolución. Revisá las cantidades e intentá de nuevo.',
  };

  const crudo = mensajeErrorHttp(error, fallbacks[contexto]);
  return mensajeDesdePatrones(crudo, PATRONES_DEVOLUCION) ?? crudo;
}

/** Clasifica errores al escanear o validar un cupón en caja. */
export function clasificarErrorCuponEscaneo(error: unknown, fallback: string): ErrorCuponEscaneo {
  const crudo = mensajeErrorHttp(error, fallback);

  for (const regla of PATRONES_CUPON) {
    if (regla.patron.test(crudo)) {
      return { tipo: regla.tipo, mensaje: regla.mensaje };
    }
  }

  if (!crudo.trim()) {
    return { tipo: 'vacio', mensaje: 'Ingresá o escaneá el código del cupón.' };
  }

  return {
    tipo: 'generico',
    mensaje: crudo.length > 160 ? 'No se pudo aplicar el cupón. Revisá el código e intentá de nuevo.' : crudo,
  };
}
