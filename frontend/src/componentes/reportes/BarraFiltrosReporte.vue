<script setup lang="ts">
import { CalendarRange } from 'lucide-vue-next';
import { computed } from 'vue';
import type { FiltrosReporteVista, OpcionEntidadReporte } from '../../modulos/reportes/filtroEntidadReporte';

const filtro = defineModel<FiltrosReporteVista>({ required: true });

const props = withDefaults(
  defineProps<{
    errorMensaje?: string;
    mostrarFiltroCliente?: boolean;
    mostrarFiltroProveedor?: boolean;
    mostrarFiltroEstadoFacturacion?: boolean;
    opcionesCliente?: OpcionEntidadReporte[];
    opcionesProveedor?: OpcionEntidadReporte[];
    opcionesEstadoFacturacion?: OpcionEntidadReporte[];
  }>(),
  {
    mostrarFiltroCliente: false,
    mostrarFiltroProveedor: false,
    mostrarFiltroEstadoFacturacion: false,
    opcionesCliente: () => [],
    opcionesProveedor: () => [],
    opcionesEstadoFacturacion: () => [],
  }
);

const emit = defineEmits<{
  actualizar: [];
}>();

const opcionesClienteResueltas = computed(() => props.opcionesCliente ?? []);
const opcionesProveedorResueltas = computed(() => props.opcionesProveedor ?? []);
const opcionesEstadoFacturacionResueltas = computed(() => props.opcionesEstadoFacturacion ?? []);
</script>

<template>
  <div class="rep-filtro" role="search" aria-label="Filtros del reporte">
    <div class="rep-filtro-ico" aria-hidden="true">
      <CalendarRange :size="18" stroke-width="1.85" />
    </div>
    <div class="rep-filtro-campos">
      <label class="rep-filtro-etiq">
        <span>Desde</span>
        <input v-model="filtro.fechaDesde" type="date" class="rep-filtro-inp" />
      </label>
      <label class="rep-filtro-etiq">
        <span>Hasta</span>
        <input v-model="filtro.fechaHasta" type="date" class="rep-filtro-inp" />
      </label>
      <label v-if="mostrarFiltroCliente" class="rep-filtro-etiq rep-filtro-etiq--entidad">
        <span>Cliente</span>
        <select v-model="filtro.idCliente" class="rep-filtro-inp rep-filtro-sel">
          <option
            v-for="op in opcionesClienteResueltas"
            :key="op.id || 'todos-clientes'"
            :value="op.id"
          >
            {{ op.etiqueta }}
          </option>
        </select>
      </label>
      <label v-if="mostrarFiltroProveedor" class="rep-filtro-etiq rep-filtro-etiq--entidad">
        <span>Proveedor</span>
        <select v-model="filtro.idProveedor" class="rep-filtro-inp rep-filtro-sel">
          <option
            v-for="op in opcionesProveedorResueltas"
            :key="op.id || 'todos-proveedores'"
            :value="op.id"
          >
            {{ op.etiqueta }}
          </option>
        </select>
      </label>
      <label v-if="mostrarFiltroEstadoFacturacion" class="rep-filtro-etiq rep-filtro-etiq--entidad">
        <span>Estado fact.</span>
        <select v-model="filtro.idEstadoFacturacion" class="rep-filtro-inp rep-filtro-sel">
          <option
            v-for="op in opcionesEstadoFacturacionResueltas"
            :key="op.id || 'todos-estados-facturacion'"
            :value="op.id"
          >
            {{ op.etiqueta }}
          </option>
        </select>
      </label>
    </div>
    <button type="button" class="pg-btn pg-btn--ghost rep-filtro-actualizar" @click="emit('actualizar')">
      Actualizar
    </button>
    <p v-if="errorMensaje" class="rep-filtro-error" role="alert">{{ errorMensaje }}</p>
  </div>
</template>

<style scoped>
.rep-filtro {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.65rem 1rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-borde);
  background: rgba(15, 23, 42, 0.35);
}

.rep-filtro-ico {
  color: var(--color-acento);
  padding-bottom: 0.35rem;
}

.rep-filtro-campos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
  flex: 1;
  min-width: min(100%, 20rem);
}

.rep-filtro-etiq {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-texto-apagado);
}

.rep-filtro-etiq--entidad {
  min-width: 14rem;
}

.rep-filtro-inp {
  font: inherit;
  font-size: 0.9rem;
  padding: 0.4rem 0.55rem;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto);
  min-width: 10.5rem;
}

.rep-filtro-sel {
  min-width: 14rem;
  max-width: 22rem;
  cursor: pointer;
}

.rep-filtro-actualizar {
  margin-left: auto;
}

.rep-filtro-error {
  flex: 1 1 100%;
  margin: 0;
  font-size: 0.82rem;
  color: #f87171;
}
</style>
