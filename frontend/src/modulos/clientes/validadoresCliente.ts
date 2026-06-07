/**
 * Validaciones de formato para datos de cliente (frontend).
 * CUIT: se controla longitud y caracteres; el dígito verificador definitivo debe validarse en backend/AFIP.
 */

export function soloDigitosEnTexto(texto: string): string {
  return texto.replace(/\D/g, '');
}

/**
 * Vacío → válido (unicidad y obligatoriedad en otra capa).
 * Solo dígitos (+ espacios/.-): DNI 7–9 o CUIT/CUIL 11.
 * Caso contrario: documento alfanumérico 6–24 (extranjero / otro).
 */
export function documentoClienteFormatoValido(
  valorSinRecortar: string
): { valido: boolean; mensaje?: string } {
  const valor = valorSinRecortar.normalize('NFKC').trim();
  if (!valor) return { valido: true };

  const digitos = soloDigitosEnTexto(valor);
  const formatoSoloNumerosYMascaras = /^[\d\s.-]+$/.test(valor);

  if (formatoSoloNumerosYMascaras && digitos.length > 0) {
    if (digitos.length >= 7 && digitos.length <= 9) {
      return { valido: true };
    }
    if (digitos.length === 11) {
      return { valido: true };
    }
    if (digitos.length < 7) {
      return {
        valido: false,
        mensaje:
          'Documento numérico demasiado corto. Usá DNI (7–9 dígitos) o CUIT/CUIL (11).',
      };
    }
    return {
      valido: false,
      mensaje: 'Cantidad de dígitos no válida para DNI (7–9) ni CUIT/CUIL (11).',
    };
  }

  const documentoExtranjeroValido = /^[\s\p{L}\p{N}.\-/]+$/u.test(valor);
  const nucleo = valor.replace(/\s+/g, ' ').trim();
  if (
    documentoExtranjeroValido &&
    nucleo.length >= 6 &&
    nucleo.length <= 24
  ) {
    return { valido: true };
  }

  return {
    valido: false,
    mensaje:
      'Si no es DNI/CUIT numérico, usá un documento alfanumérico de entre 6 y 24 caracteres (. - / opcionales).',
  };
}

const PATRON_CORREO_RELAXADO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailClienteFormatoValido(valorSinRecortar: string): {
  valido: boolean;
  mensaje?: string;
} {
  const valor = valorSinRecortar.normalize('NFKC').trim().toLowerCase();
  if (!valor) return { valido: true };
  if (valor.length > 254) {
    return { valido: false, mensaje: 'El correo es demasiado largo.' };
  }
  if (!PATRON_CORREO_RELAXADO.test(valor)) {
    return {
      valido: false,
      mensaje: 'Formato de correo inválido. Ej.: cliente@ejemplo.ar',
    };
  }
  return { valido: true };
}

export function telefonoClienteFormatoValido(valorSinRecortar: string): {
  valido: boolean;
  mensaje?: string;
} {
  const valor = valorSinRecortar.normalize('NFKC').trim();
  if (!valor) return { valido: true };
  if (!/^[\d+()\s.\-]+$/.test(valor)) {
    return {
      valido: false,
      mensaje: 'El teléfono solo puede tener números, espacio, + y ( ). -.',
    };
  }
  if (valor.length < 8) {
    return { valido: false, mensaje: 'El teléfono es demasiado corto.' };
  }
  const cantidadDigitos = soloDigitosEnTexto(valor).length;
  if (cantidadDigitos < 8) {
    return {
      valido: false,
      mensaje: 'Debés cargar al menos 8 dígitos (ej. código de área + número).',
    };
  }
  if (cantidadDigitos > 15) {
    return {
      valido: false,
      mensaje: 'Hay demasiados dígitos; revisá el número.',
    };
  }
  return { valido: true };
}

export type CampoValidacionFormatoCliente =
  | 'documento'
  | 'correoElectronico'
  | 'telefonoPrincipal'
  | 'telefonoAlternativo';

export type ErroresFormatoCliente = Partial<
  Record<CampoValidacionFormatoCliente, string>
>;

export function errorFormatoCampoCliente(
  campo: CampoValidacionFormatoCliente,
  valor: string,
): string | undefined {
  const campos = {
    documento: '',
    correoElectronico: '',
    telefonoPrincipal: '',
    telefonoAlternativo: '',
  };
  campos[campo] = valor;
  return recolectarErroresFormatoCliente(campos)[campo];
}

export function recolectarErroresFormatoCliente(campos: {
  documento: string;
  correoElectronico: string;
  telefonoPrincipal: string;
  telefonoAlternativo: string;
}): ErroresFormatoCliente {
  const salida: ErroresFormatoCliente = {};

  const doc = documentoClienteFormatoValido(campos.documento);
  if (!doc.valido && doc.mensaje) salida.documento = doc.mensaje;

  const mail = emailClienteFormatoValido(campos.correoElectronico);
  if (!mail.valido && mail.mensaje) salida.correoElectronico = mail.mensaje;

  const telP = telefonoClienteFormatoValido(campos.telefonoPrincipal);
  if (!telP.valido && telP.mensaje) salida.telefonoPrincipal = telP.mensaje;

  const telA = telefonoClienteFormatoValido(campos.telefonoAlternativo);
  if (!telA.valido && telA.mensaje) salida.telefonoAlternativo = telA.mensaje;

  return salida;
}
