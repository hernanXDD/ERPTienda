/** Mínimo 8 caracteres, al menos una mayúscula y un número. */
export const PATRON_POLITICA_CONTRASENA = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const MENSAJE_POLITICA_CONTRASENA =
  'La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número.';

export function cumplePoliticaContrasena(texto: string): boolean {
  return PATRON_POLITICA_CONTRASENA.test(texto);
}
