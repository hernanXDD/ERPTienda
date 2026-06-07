export function normalizarDocumento(texto: string): string {
  return texto.normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}
