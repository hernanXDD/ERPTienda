/** Máximo de dígitos que interpretamos como CUIT/CUIL nacional. */
const TOPE_DIGITOS_CUIT = 11;

/**
 * Indica si aplica máscara DNI/CUIT (solo dígitos y separadores usados habitualmente).
 * Documentos extranjeros con letras quedan tal cual los escribe la persona.
 */
export function entradaDocumentoEsSoloNumericaArgentina(valor: string): boolean {
  const texto = valor.normalize('NFKC');
  return /^[\d\s.\-]*$/.test(texto);
}

/** Extrae dígitos y limita para no exceder un CUIT. */
export function extraerDigitosDocumentoArgentina(valor: string): string {
  return valor.normalize('NFKC').replace(/\D/g, '').slice(0, TOPE_DIGITOS_CUIT);
}

/** Miles desde la derecha (ej. 37436702 → 37.436.702). */
export function formatoMilesArgentinos(digitos: string): string {
  if (!digitos) return '';
  let resto = digitos;
  const trozos: string[] = [];
  while (resto.length > 3) {
    trozos.unshift(resto.slice(-3));
    resto = resto.slice(0, -3);
  }
  if (resto.length > 0) trozos.unshift(resto);
  return trozos.join('.');
}

/**
 * Visual para DNI o CUIT mientras cargan dígitos.
 * - Menos de 10 dígitos: todo como DNI con puntos de miles.
 * - 10 u 11 dígitos: XX- medio con miles - [dígito verificador si hay 11].
 */
export function formatearDocumentoClienteArgentinaDesdeDigitos(digitos: string): string {
  const solo = digitos.slice(0, TOPE_DIGITOS_CUIT);
  if (!solo) return '';

  if (solo.length >= 10) {
    const tipo = solo.slice(0, 2);
    const cuerpo = solo.slice(2, 10);
    const medioConPuntos = formatoMilesArgentinos(cuerpo);
    if (solo.length >= 11) {
      const verificador = solo.slice(10, 11);
      return `${tipo}-${medioConPuntos}-${verificador}`;
    }
    return `${tipo}-${medioConPuntos}`;
  }

  return formatoMilesArgentinos(solo);
}

/** Aplica mascarilla solo si la entrada sigue siendo exclusivamente números/máscara local. */
export function formatearDocumentoClienteAlEscribir(valorEnPantalla: string): string {
  const normalizado = valorEnPantalla.normalize('NFKC');
  if (!entradaDocumentoEsSoloNumericaArgentina(normalizado)) {
    return normalizado.replace(/^\s+|\s+$/g, '');
  }
  const digitos = extraerDigitosDocumentoArgentina(normalizado);
  return formatearDocumentoClienteArgentinaDesdeDigitos(digitos);
}