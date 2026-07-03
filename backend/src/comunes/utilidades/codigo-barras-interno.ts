/** Prefijo GS1 para códigos internos de tienda (rango 200–299). */
export const PREFIJO_EAN13_INTERNO = '299';

const PATRON_EAN13 = /^\d{13}$/;

export function calcularDigitoControlEan13(base12: string): string {
  if (!/^\d{12}$/.test(base12)) {
    throw new Error('La base EAN-13 debe tener exactamente 12 dígitos.');
  }
  let suma = 0;
  for (let i = 0; i < 12; i += 1) {
    const digito = Number(base12[i]);
    suma += i % 2 === 0 ? digito : digito * 3;
  }
  return String((10 - (suma % 10)) % 10);
}

export function armarCodigoEan13(base12: string): string {
  return `${base12}${calcularDigitoControlEan13(base12)}`;
}

export function esCodigoBarrasEan13Valido(codigo: string): boolean {
  const norm = codigo.trim();
  if (!PATRON_EAN13.test(norm)) return false;
  return norm[12] === calcularDigitoControlEan13(norm.slice(0, 12));
}

export function codigoBarrasDesdeIdVariante(idVariante: string): string {
  const soloDigitos = idVariante.replace(/\D/g, '');
  const cuerpo9 = soloDigitos.padStart(9, '0').slice(-9);
  return armarCodigoEan13(`${PREFIJO_EAN13_INTERNO}${cuerpo9}`);
}
