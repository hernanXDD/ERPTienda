export function sanitizarNombreArchivoCupon(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || 'cupon'
  );
}

export function nombreBaseArchivoCupon(numeroCupon: string): string {
  return `Cupon_${numeroCupon.replace(/\s+/g, '_')}`;
}
