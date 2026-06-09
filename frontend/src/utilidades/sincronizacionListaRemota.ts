/**
 * Coordina listados remotos para que una respuesta tardía de `cargar()` no pise
 * altas/ediciones locales más recientes (evita tener que recargar con F5).
 */
export function crearSincronizadorListaRemota() {
  let generacion = 0;
  let promesaEnCurso: Promise<void> | null = null;

  function marcarMutacionLocal(): void {
    generacion += 1;
  }

  function generacionAlIniciarCarga(): number {
    return generacion;
  }

  function esRespuestaObsoleta(generacionAlInicio: number): boolean {
    return generacionAlInicio !== generacion;
  }

  async function serializarCarga(ejecutar: () => Promise<void>): Promise<void> {
    if (promesaEnCurso) {
      await promesaEnCurso;
      return;
    }
    promesaEnCurso = ejecutar().finally(() => {
      promesaEnCurso = null;
    });
    await promesaEnCurso;
  }

  return {
    marcarMutacionLocal,
    generacionAlIniciarCarga,
    esRespuestaObsoleta,
    serializarCarga,
  };
}

export interface OpcionesCargaLista {
  /** Ignora el flag de sincronizado y vuelve a consultar la API. */
  forzar?: boolean;
}
