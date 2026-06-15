/** Talles en letras (indumentaria). */
export const TALLES_LETRA = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

/** Talles numéricos (pantalones, calzado, etc.). */
export const TALLES_NUMERO = ['36', '38', '40', '42', '44', '46', '48'] as const;

/** Talles estándar para habilitar al crear o editar un producto. */
export const TALLES_PREDEFINIDOS = [...TALLES_LETRA, ...TALLES_NUMERO] as const;

/** Color vacío: el detalle de color va en el nombre del producto (ej. «remera negra»). */
export const COLOR_VARIANTE_VACIO = '';

export function normalizarTalle(talle: string): string {
  return talle.trim();
}

export function tallesIguales(a: string, b: string): boolean {
  return normalizarTalle(a).toLowerCase() === normalizarTalle(b).toLowerCase();
}

export interface BorradorTalle {
  talle: string;
  habilitado: boolean;
  id?: string;
  codigoBarras: string;
  esPersonalizado: boolean;
}

export function crearTallesBorradorVacios(): BorradorTalle[] {
  return TALLES_PREDEFINIDOS.map((talle) => ({
    talle,
    habilitado: false,
    codigoBarras: '',
    esPersonalizado: false,
  }));
}

export function tallesBorradorDesdeVariantes(existentes: readonly { id: string; talle: string; color: string; codigoBarras: string; activa: boolean }[]): BorradorTalle[] {
  const borrador = crearTallesBorradorVacios();
  const indicePredefinido = new Map(
    borrador.map((fila, indice) => [fila.talle.toLowerCase(), indice]),
  );
  const personalizados: BorradorTalle[] = [];

  for (const variante of existentes) {
    const talle = normalizarTalle(variante.talle);
    if (!talle) continue;

    const idxPredef = indicePredefinido.get(talle.toLowerCase());
    if (idxPredef !== undefined) {
      const fila = borrador[idxPredef]!;
      if (!fila.id || variante.activa) {
        fila.habilitado = variante.activa;
        fila.id = variante.id;
        fila.codigoBarras = variante.codigoBarras;
      }
      continue;
    }

    const existentePersonalizado = personalizados.find((f) => tallesIguales(f.talle, talle));
    if (existentePersonalizado) {
      if (variante.activa && !existentePersonalizado.habilitado) {
        existentePersonalizado.habilitado = true;
        existentePersonalizado.id = variante.id;
        existentePersonalizado.codigoBarras = variante.codigoBarras;
      }
      continue;
    }

    personalizados.push({
      talle,
      habilitado: variante.activa,
      id: variante.id,
      codigoBarras: variante.codigoBarras,
      esPersonalizado: true,
    });
  }

  return [...borrador, ...personalizados];
}
