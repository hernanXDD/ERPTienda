<script setup lang="ts">
import { useSesionStore } from '../../stores/sesion';

const sesion = useSesionStore();
</script>

<template>
  <section class="envoltorio" aria-labelledby="titulo-inicio">
    <header class="cabecera">
      <h1 id="titulo-inicio" class="titulo">Inicio</h1>
      <p class="subtitulo">
        Hola, <span class="nombre">{{ sesion.usuario?.nombreUsuario }}</span>.
      </p>
    </header>

    <div class="tarjetas" role="region" aria-label="Resumen del día">
      <article class="tarjeta">
        <h2 class="tarjeta-titulo">Resumen del día</h2>
        <p class="tarjeta-texto">
          Aquí irán gráficos y métricas de uso cotidiano (ventas, stock, etc.) cuando
          avancemos el módulo de reportes.
        </p>
      </article>
      <article class="tarjeta tarjeta-silenciosa" aria-hidden="true">
        <p class="tarjeta-texto apagado">
          Espacio reservado para próximas tarjetas y gráficos interactivos.
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.envoltorio {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cabecera {
  margin: 0;
}

.titulo {
  margin: 0 0 0.35rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.subtitulo {
  margin: 0;
  color: var(--color-texto-suave);
  font-size: 0.95rem;
}

.nombre {
  color: var(--color-texto);
  font-weight: 600;
}

.tarjetas {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
}

.tarjeta {
  background: var(--color-fondo-elevado);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  padding: 1.1rem 1.25rem;
  box-shadow: var(--sombra-suave);
}

.tarjeta-silenciosa {
  opacity: 0.75;
}

.tarjeta-titulo {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.tarjeta-texto {
  margin: 0;
  line-height: 1.5;
  color: var(--color-texto-suave);
  font-size: 0.925rem;
}

.apagado {
  color: var(--color-texto-apagado);
  font-style: italic;
}
</style>
