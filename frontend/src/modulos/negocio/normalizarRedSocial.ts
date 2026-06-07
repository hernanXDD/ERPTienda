export function normalizarRedSocialAlEscribir(texto: string): string {
  return texto.replace(/\s/g, '');
}

export function normalizarRedSocialAlPerderFoco(texto: string): string {
  return texto.trim().replace(/^@+/, '');
}
