export interface OpcionesFormatoMoneda {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  /** Texto cuando el valor no es finito. Por defecto «—». */
  valorInvalido?: string;
}

const formatoMonedaPantalla = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const formatoMonedaFacturacion = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoNumeroPantalla = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

const formatoDecimalPantalla = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function crearFormatoMoneda(opciones: OpcionesFormatoMoneda): Intl.NumberFormat {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: opciones.maximumFractionDigits ?? 0,
    minimumFractionDigits: opciones.minimumFractionDigits,
  });
}

/** Moneda ARS para pantallas (sin decimales por defecto). */
export function formatearMoneda(valor: number, opciones?: OpcionesFormatoMoneda): string {
  if (!Number.isFinite(valor)) {
    return opciones?.valorInvalido ?? '—';
  }
  if (opciones) {
    return crearFormatoMoneda(opciones).format(valor);
  }
  return formatoMonedaPantalla.format(valor);
}

/** Moneda con 2 decimales (facturación / reportes AFIP). */
export function formatearMonedaFacturacion(valor: number): string {
  if (!Number.isFinite(valor)) return '—';
  return formatoMonedaFacturacion.format(valor);
}

/** Número entero con separador de miles (sin símbolo $). */
export function formatearNumero(valor: number, maximumFractionDigits = 0): string {
  if (!Number.isFinite(valor)) return '—';
  if (maximumFractionDigits === 0) {
    return formatoNumeroPantalla.format(valor);
  }
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits }).format(valor);
}

/** Número con decimales fijos (sin símbolo $). */
export function formatearNumeroConDecimales(valor: number, decimales = 2): string {
  if (!Number.isFinite(valor)) return '—';
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

/** Decimal con hasta 1 fracción (ej. porcentaje de ganancia: «25,5»). */
export function formatearDecimal(valor: number, maximumFractionDigits = 1): string {
  if (!Number.isFinite(valor)) return '—';
  if (maximumFractionDigits === 1) {
    return formatoDecimalPantalla.format(valor);
  }
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(valor);
}
