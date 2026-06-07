export function normalizarNombreUsuario(texto: string): string {
  return texto.normalize('NFKC').trim().toLowerCase();
}
