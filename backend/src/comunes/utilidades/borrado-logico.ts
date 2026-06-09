/** Filtro Prisma para excluir registros marcados como borrados. */
export const filtroNoBorrado = { borrado: false } as const;

/** Datos para marcar un registro como borrado lógicamente (sin DELETE físico). */
export function datosMarcarBorrado(): { borrado: true; fechaEliminacion: Date } {
  return { borrado: true, fechaEliminacion: new Date() };
}
