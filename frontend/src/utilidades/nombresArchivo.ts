/** Nombre seguro para archivos descargados (PDF, imágenes, etc.). */
export function sanitizarNombreArchivo(nombre: string, fallback = 'archivo'): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || fallback
  );
}
