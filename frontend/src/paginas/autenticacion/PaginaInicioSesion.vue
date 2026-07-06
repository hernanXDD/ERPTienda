<script setup lang="ts">
import { AxiosError } from 'axios';
import {
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Package,
  ShoppingCart,
  Shield,
  User,
  Users,
  Wallet,
} from 'lucide-vue-next';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VARIABLES_TEMA_LOGIN } from '../../modulos/tema/variablesTemaLogin';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useSesionStore } from '../../stores/sesion';

const router = useRouter();
const route = useRoute();
const sesion = useSesionStore();

const nombreUsuario = ref('');
const contrasena = ref('');
const cargando = ref(false);
const mensajeError = ref('');
const mostrarContrasena = ref(false);

const estiloPaginaLogin = VARIABLES_TEMA_LOGIN;

const caracteristicas = [
  { icono: ShoppingCart, texto: 'Ventas, facturación y cuentas corrientes' },
  { icono: Package, texto: 'Stock, compras y catálogo de productos' },
  { icono: Users, texto: 'Clientes, proveedores y usuarios con permisos' },
  { icono: BarChart3, texto: 'Reportes y paneles para decisiones rápidas' },
  { icono: Wallet, texto: 'Caja, movimientos y control del negocio' },
  { icono: Shield, texto: 'Acceso seguro por roles y auditoría' },
] as const;

function extraerMensajeError(error: unknown): string {
  if (error instanceof AxiosError && !error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'La conexión tardó demasiado. Verificá la señal e intentá de nuevo.';
    }
    return 'No se pudo conectar con el servidor. Si usás datos móviles, probá también con Wi‑Fi o verificá la URL de la app.';
  }
  return mensajeErrorHttp(error, 'No se pudo iniciar sesión. Intente nuevamente.');
}

function alternarVisibilidadContrasena(): void {
  mostrarContrasena.value = !mostrarContrasena.value;
}

async function enviar() {
  mensajeError.value = '';
  cargando.value = true;
  try {
    await sesion.iniciarSesion({
      nombreUsuario: nombreUsuario.value.trim(),
      contrasena: contrasena.value,
    });
    const candidato =
      typeof route.query.siguiente === 'string' && route.query.siguiente.startsWith('/')
        ? route.query.siguiente
        : '/inicio';
    const destino =
      candidato.startsWith('/') && !candidato.startsWith('//') ? candidato : '/inicio';
    await router.replace(destino);
  } catch (error) {
    mensajeError.value = extraerMensajeError(error);
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <div class="pagina" :style="estiloPaginaLogin">
    <section class="presentacion" aria-labelledby="titulo-marca">
      <div class="presentacion-contenido">
        <p class="marca-etiqueta">Sistema de gestión</p>
        <h1 id="titulo-marca" class="marca-titulo">ERP Tienda</h1>
        <p class="marca-descripcion">
          Plataforma integral para administrar ventas, inventario, compras y finanzas de tu
          comercio desde un solo lugar, con datos en tiempo real y control por usuario.
        </p>

        <ul class="lista-caracteristicas">
          <li v-for="item in caracteristicas" :key="item.texto" class="item-caracteristica">
            <component :is="item.icono" class="icono-caracteristica" aria-hidden="true" />
            <span>{{ item.texto }}</span>
          </li>
        </ul>

        <p class="presentacion-pie">
          Diseñado para equipos que necesitan velocidad en el mostrador y orden en la gestión.
        </p>
      </div>
    </section>

    <section class="acceso" aria-labelledby="titulo-login">
      <main class="panel-login">
        <header class="cabecera-login">
          <h2 id="titulo-login" class="titulo-login">Iniciar sesión</h2>
          <p class="subtitulo-login">Ingresá con tu usuario asignado por el administrador.</p>
        </header>

        <form class="formulario" @submit.prevent="enviar">
          <div class="campo">
            <label for="campo-usuario" class="etiqueta">Usuario</label>
            <div class="entrada-envoltorio">
              <User class="entrada-icono" aria-hidden="true" />
              <input
                id="campo-usuario"
                v-model="nombreUsuario"
                type="text"
                name="usuario"
                class="entrada"
                autocomplete="username"
                placeholder="Ingresá tu usuario"
                required
                :disabled="cargando"
              />
            </div>
          </div>

          <div class="campo">
            <label for="campo-contrasena" class="etiqueta">Contraseña</label>
            <div class="entrada-envoltorio">
              <Lock class="entrada-icono" aria-hidden="true" />
              <input
                id="campo-contrasena"
                v-model="contrasena"
                :type="mostrarContrasena ? 'text' : 'password'"
                name="contrasena"
                class="entrada entrada-con-accion"
                autocomplete="current-password"
                placeholder="Ingresá tu contraseña"
                required
                :disabled="cargando"
              />
              <button
                type="button"
                class="boton-visibilidad"
                :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                :disabled="cargando"
                @click="alternarVisibilidadContrasena"
              >
                <EyeOff v-if="mostrarContrasena" class="icono-visibilidad" aria-hidden="true" />
                <Eye v-else class="icono-visibilidad" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p v-if="mensajeError" class="error" role="alert">{{ mensajeError }}</p>

          <button type="submit" class="boton-principal" :disabled="cargando">
            {{ cargando ? 'Ingresando…' : 'Ingresar al sistema' }}
          </button>
        </form>
      </main>
    </section>
  </div>
</template>

<style scoped>
.pagina {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--login-color-fondo);
  color: var(--login-color-texto);
  color-scheme: dark;
}

.presentacion {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(2rem, 5vw, 4rem);
  background:
    radial-gradient(90% 70% at 10% 20%, rgba(124, 140, 240, 0.22), transparent 55%),
    radial-gradient(60% 50% at 80% 90%, rgba(91, 110, 230, 0.12), transparent 50%),
    linear-gradient(145deg, #0a0f1c 0%, #111a2e 45%, #0c1222 100%);
  border-right: 1px solid var(--login-color-borde);
}

.presentacion-contenido {
  width: 100%;
  max-width: 32rem;
}

.marca-etiqueta {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--login-color-acento-hover);
}

.marca-titulo {
  margin: 0 0 1rem;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.marca-descripcion {
  margin: 0 0 2rem;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--login-color-texto-suave);
}

.lista-caracteristicas {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.item-caracteristica {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--login-color-texto-suave);
}

.icono-caracteristica {
  flex-shrink: 0;
  width: 1.15rem;
  height: 1.15rem;
  margin-top: 0.15rem;
  color: var(--login-color-acento);
}

.presentacion-pie {
  margin: 2rem 0 0;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(42, 58, 84, 0.7);
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--login-color-texto-apagado);
}

.acceso {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.5rem, 4vw, 3rem);
  background: var(--login-color-fondo);
}

.panel-login {
  width: 100%;
  max-width: 26rem;
  padding: 2rem 2rem 2.25rem;
  background: var(--login-color-fondo-elevado);
  border: 1px solid var(--login-color-borde);
  border-radius: 16px;
  box-shadow: var(--login-color-sombra-suave);
}

.cabecera-login {
  margin-bottom: 1.75rem;
}

.titulo-login {
  margin: 0 0 0.4rem;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.subtitulo-login {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--login-color-texto-apagado);
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.etiqueta {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--login-color-texto-suave);
}

.entrada-envoltorio {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3rem;
  padding: 0 0.85rem;
  border: 1px solid var(--login-color-borde);
  border-radius: 12px;
  background: var(--login-color-fondo-cabecera);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.entrada-envoltorio:focus-within {
  border-color: var(--login-color-acento-borde);
  box-shadow: 0 0 0 3px var(--login-color-acento-suave);
  background: var(--login-color-fondo-elevado);
}

.entrada-icono {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--login-color-texto-apagado);
  transition: color 0.15s ease;
}

.entrada-envoltorio:focus-within .entrada-icono {
  color: var(--login-color-acento);
}

.entrada {
  flex: 1;
  min-width: 0;
  border: none;
  padding: 0.65rem 0;
  background: transparent;
  color: var(--login-color-texto);
  font-size: 0.95rem;
  line-height: 1.4;
}

.entrada::placeholder {
  color: var(--login-color-texto-apagado);
}

.entrada:focus {
  outline: none;
}

.entrada:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.entrada-con-accion {
  padding-right: 0.25rem;
}

.boton-visibilidad {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--login-color-texto-apagado);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.boton-visibilidad:hover:not(:disabled) {
  color: var(--login-color-texto-suave);
  background: rgba(124, 140, 240, 0.08);
}

.boton-visibilidad:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icono-visibilidad {
  width: 1.05rem;
  height: 1.05rem;
}

.error {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.35);
  color: var(--login-color-peligro);
  font-size: 0.875rem;
  line-height: 1.4;
}

.boton-principal {
  margin-top: 0.35rem;
  min-height: 3rem;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, var(--login-color-acento) 0%, var(--login-color-acento-intenso) 100%);
  color: var(--login-color-texto-sobre-acento);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
}

.boton-principal:hover:not(:disabled) {
  background: linear-gradient(180deg, var(--login-color-acento-hover) 0%, var(--login-color-acento) 100%);
  box-shadow: 0 4px 20px rgba(124, 140, 240, 0.25);
}

.boton-principal:active:not(:disabled) {
  transform: translateY(1px);
}

.boton-principal:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .pagina {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .presentacion {
    border-right: none;
    border-bottom: 1px solid var(--login-color-borde);
    padding: 2rem 1.5rem;
  }

  .marca-descripcion {
    margin-bottom: 1.25rem;
  }

  .lista-caracteristicas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem 1rem;
  }

  .presentacion-pie {
    display: none;
  }

  .acceso {
    padding: 2rem 1.25rem 2.5rem;
  }

  .panel-login {
    padding: 1.75rem 1.5rem 2rem;
  }
}

@media (max-width: 520px) {
  .lista-caracteristicas {
    grid-template-columns: 1fr;
  }
}
</style>
