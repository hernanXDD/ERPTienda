export function siguienteNumeroComprobante(prefijo: 'V' | 'C', ultimoNumero: string | null): string {
  let maximo = 0;
  if (ultimoNumero) {
    const coincidencia = new RegExp(`^${prefijo}-(\\d+)$`).exec(ultimoNumero);
    if (coincidencia) maximo = parseInt(coincidencia[1], 10);
  }
  return `${prefijo}-${String(maximo + 1).padStart(5, '0')}`;
}
