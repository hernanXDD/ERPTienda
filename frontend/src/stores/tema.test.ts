import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { permisosPorDefectoSegunRol } from '../modulos/usuarios/permisosUsuario';
import { NOMBRE_RUTA_LOGIN } from '../modulos/tema/variablesTemaLogin';
import type { UsuarioSesion } from '../tipos/sesion';
import { useSesionStore } from './sesion';
import { normalizarTemaClaroNegocio, useTemaStore } from './tema';

const usuarioModoClaro: UsuarioSesion = {
  id: '000001',
  nombreUsuario: 'admin',
  rol: 'ADMIN',
  permisos: permisosPorDefectoSegunRol('ADMIN'),
  debeCambiarContrasena: false,
  modoOscuroHabilitado: false,
};

describe('normalizarTemaClaroNegocio', () => {
  it('normaliza colores válidos del negocio', () => {
    const tema = normalizarTemaClaroNegocio({
      temaClaroColorAcento: '#AABBCC',
      temaClaroColorFondo: '#112233',
      temaClaroColorSuperficie: '#445566',
      temaClaroColorCabecera: '#778899',
    });

    expect(tema).toEqual({
      colorAcento: '#aabbcc',
      colorFondo: '#112233',
      colorSuperficie: '#445566',
      colorCabecera: '#778899',
      colorTexto: '#0f172a',
      colorBorde: '#cbd5e1',
    });
  });

  it('aplica valores por defecto cuando faltan o son inválidos', () => {
    const tema = normalizarTemaClaroNegocio({
      temaClaroColorAcento: 'invalido',
    });

    expect(tema.colorAcento).toBe('#4a5fd7');
    expect(tema.colorFondo).toBe('#f2f5fa');
    expect(tema.colorSuperficie).toBe('#ffffff');
    expect(tema.colorCabecera).toBe('#e4eaf4');
    expect(tema.colorTexto).toBe('#0f172a');
    expect(tema.colorBorde).toBe('#cbd5e1');
  });
});

describe('useTemaStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.documentElement.removeAttribute('data-tema');
    document.documentElement.style.cssText = '';
  });

  it('aplica modo claro cuando el usuario lo tiene deshabilitado', () => {
    const sesion = useSesionStore();
    sesion.$patch({ usuario: usuarioModoClaro, inicializado: true });

    const tema = useTemaStore();
    tema.iniciarObservadorTema();
    tema.sincronizarTema('inicio');

    expect(document.documentElement.dataset.tema).toBe('claro');
  });

  it('mantiene modo oscuro en la pantalla de login aunque el usuario prefiera claro', () => {
    const sesion = useSesionStore();
    sesion.$patch({ usuario: usuarioModoClaro, inicializado: true });

    const tema = useTemaStore();
    tema.iniciarObservadorTema();
    tema.sincronizarTema(NOMBRE_RUTA_LOGIN);

    expect(document.documentElement.dataset.tema).toBe('oscuro');
  });

  it('aplica modo oscuro sin sesión activa', () => {
    const sesion = useSesionStore();
    sesion.$patch({ inicializado: true });

    const tema = useTemaStore();
    tema.iniciarObservadorTema();

    expect(document.documentElement.dataset.tema).toBe('oscuro');
  });

  it('sincroniza a modo claro tras restaurar sesión con preferencia clara', () => {
    const sesion = useSesionStore();
    sesion.$patch({ usuario: usuarioModoClaro, inicializado: true });

    const tema = useTemaStore();
    tema.iniciarObservadorTema();
    tema.sincronizarTema('inicio');

    expect(document.documentElement.dataset.tema).toBe('claro');
  });
});
