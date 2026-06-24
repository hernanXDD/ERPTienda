<script setup lang="ts">
import { ScanBarcode, ShoppingCart, UserRound, X } from 'lucide-vue-next';
import { usarCentroVentasContexto } from './centroVentasContexto';

const { mostrarOnboarding, cerrarOnboarding } = usarCentroVentasContexto();
</script>

<template>
  <aside
    v-if="mostrarOnboarding"
    class="cv-onboarding"
    aria-labelledby="cv-onboarding-titulo"
  >
    <header class="cv-onboarding-cab">
      <div>
        <p class="cv-onboarding-eyebrow">Guía rápida</p>
        <h2 id="cv-onboarding-titulo" class="cv-onboarding-tit">Primera venta en el mostrador</h2>
      </div>
      <button type="button" class="cv-onboarding-cerrar" aria-label="Cerrar guía" @click="cerrarOnboarding()">
        <X :size="18" aria-hidden="true" />
      </button>
    </header>

    <ol class="cv-onboarding-pasos">
      <li>
        <ScanBarcode :size="18" aria-hidden="true" />
        <div>
          <strong>Agregá productos</strong>
          <span>Escaneá con lector o buscá por nombre. En celular usá la búsqueda.</span>
        </div>
      </li>
      <li>
        <UserRound :size="18" aria-hidden="true" />
        <div>
          <strong>Cliente y cobro</strong>
          <span>Elegí consumidor final, un cliente registrado y la forma de pago.</span>
        </div>
      </li>
      <li>
        <ShoppingCart :size="18" aria-hidden="true" />
        <div>
          <strong>Revisá el ticket</strong>
          <span>Verificá cantidades, cupones o descuentos antes de confirmar.</span>
        </div>
      </li>
    </ol>

    <footer class="cv-onboarding-pie">
      <button type="button" class="cv-onboarding-btn" @click="cerrarOnboarding(true)">
        Entendido, no volver a mostrar
      </button>
    </footer>
  </aside>
</template>

<style scoped>
.cv-onboarding {
  margin: 0 clamp(1rem, 3vw, 1.65rem) 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-acento-borde);
  background: var(--color-acento-suave);
}

.cv-onboarding-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}

.cv-onboarding-eyebrow {
  margin: 0 0 0.2rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-acento-hover);
}

.cv-onboarding-tit {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.cv-onboarding-cerrar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo-elevado);
  color: var(--color-texto-apagado);
  cursor: pointer;
}

.cv-onboarding-pasos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.cv-onboarding-pasos li {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}

.cv-onboarding-pasos li svg {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: var(--color-acento-hover);
}

.cv-onboarding-pasos strong {
  display: block;
  color: var(--color-texto);
  font-weight: 650;
}

.cv-onboarding-pie {
  margin-top: 0.75rem;
  display: flex;
  justify-content: flex-end;
}

.cv-onboarding-btn {
  border: 1px solid var(--color-acento-borde);
  border-radius: var(--radio-control);
  padding: 0.45rem 0.85rem;
  background: var(--color-fondo-elevado);
  color: var(--color-acento-hover);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.cv-onboarding-btn:hover {
  background: var(--color-fondo-elevado);
}
</style>
