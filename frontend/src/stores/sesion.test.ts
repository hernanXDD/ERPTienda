import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLAVE_TOKEN_ACCESO } from '../servicios/http';
import { permisosPorDefectoSegunRol } from '../modulos/usuarios/permisosUsuario';
import type { UsuarioSesion } from '../tipos/sesion';

const { reiniciarVentasMock, reiniciarDatosMock } = vi.hoisted(() => ({
  reiniciarVentasMock: vi.fn(),
  reiniciarDatosMock: vi.fn(),
}));

vi.mock('./ventas', () => ({
  useVentasStore: () => ({ reiniciar: reiniciarVentasMock }),
}));

vi.mock('./inicializacionDatos', () => ({
  reiniciarEstadoCargaDatos: reiniciarDatosMock,
}));

vi.mock('../servicios/autenticacion.servicio', () => ({
  iniciarSesion: vi.fn(),
  obtenerSesionActual: vi.fn(),
  establecerContrasenaInicial: vi.fn(),
  cerrarSesionEnServidor: vi.fn(),
}));

import {
  cerrarSesionEnServidor,
  iniciarSesion,
  obtenerSesionActual,
} from '../servicios/autenticacion.servicio';
import { useSesionStore } from './sesion';

const usuarioDemo: UsuarioSesion = {
  id: '000001',
  nombreUsuario: 'admin',
  rol: 'ADMIN',
  permisos: permisosPorDefectoSegunRol('ADMIN'),
  debeCambiarContrasena: false,
  modoOscuroHabilitado: false,
};

describe('useSesionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('restaura sesión cuando hay token válido', async () => {
    sessionStorage.setItem(CLAVE_TOKEN_ACCESO, 'token-demo');
    vi.mocked(obtenerSesionActual).mockResolvedValue({ usuario: usuarioDemo });

    const store = useSesionStore();
    await store.restaurarSesion();

    expect(store.usuario?.nombreUsuario).toBe('admin');
    expect(store.inicializado).toBe(true);
    expect(store.estaAutenticado).toBe(true);
  });

  it('limpia token inválido al restaurar sesión', async () => {
    sessionStorage.setItem(CLAVE_TOKEN_ACCESO, 'token-vencido');
    vi.mocked(obtenerSesionActual).mockRejectedValue(new Error('401'));

    const store = useSesionStore();
    await store.restaurarSesion();

    expect(sessionStorage.getItem(CLAVE_TOKEN_ACCESO)).toBeNull();
    expect(store.usuario).toBeNull();
    expect(store.inicializado).toBe(true);
  });

  it('guarda token y usuario al iniciar sesión', async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({
      accessToken: 'nuevo-token',
      usuario: usuarioDemo,
    });

    const store = useSesionStore();
    await store.iniciarSesion({ nombreUsuario: 'admin', contrasena: 'Admin123' });

    expect(sessionStorage.getItem(CLAVE_TOKEN_ACCESO)).toBe('nuevo-token');
    expect(store.usuario?.id).toBe('000001');
  });

  it('cierra sesión localmente aunque falle el servidor', async () => {
    vi.mocked(cerrarSesionEnServidor).mockRejectedValue(new Error('offline'));
    sessionStorage.setItem(CLAVE_TOKEN_ACCESO, 'token-demo');

    const store = useSesionStore();
    store.usuario = usuarioDemo;
    await store.cerrarSesion();

    expect(sessionStorage.getItem(CLAVE_TOKEN_ACCESO)).toBeNull();
    expect(store.usuario).toBeNull();
    expect(reiniciarVentasMock).toHaveBeenCalled();
    expect(reiniciarDatosMock).toHaveBeenCalled();
  });
});
