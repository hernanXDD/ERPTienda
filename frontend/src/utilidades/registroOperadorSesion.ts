import type { RegistroOperador } from '../tipos/registroOperador';
import { useSesionStore } from '../stores/sesion';

export function crearRegistroOperadorDesdeSesion(): RegistroOperador {
  const usuario = useSesionStore().usuario;
  return {
    idUsuario: usuario?.id ?? null,
    etiquetaUsuario: usuario?.nombreUsuario?.trim() || 'Operador sin sesión identificada',
  };
}
