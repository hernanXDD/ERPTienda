<script setup lang="ts">
import { computed, ref } from 'vue';
import type { IdCondicionCompra, LineaCompraRegistro } from '../../tipos/compraRegistrada';
import { mensajeErrorHttp } from '../../servicios/apiUtil';
import { useCuentaCorrienteProveedorStore } from '../../stores/cuentaCorrienteProveedor';
import { useProveedoresStore } from '../../stores/proveedores';
import { useRegistroComprasStore } from '../../stores/registroCompras';
import { useStockStore } from '../../stores/stock';

const emit = defineEmits<{
  cerrar: [];
}>();

const proveedoresStore = useProveedoresStore();
const cuentaCorrienteProveedorStore = useCuentaCorrienteProveedorStore();
const registroStore = useRegistroComprasStore();
const stockStore = useStockStore();

const proveedoresSeleccionables = computed(() =>
  [...proveedoresStore.proveedores].filter((p) => p.habilitado).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es'),
  ),
);

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

interface LineaEditable {
  nombre: string;
  cantidadTexto: string;
  costoUnitarioTexto: string;
}

const proveedorSeleccionadoId = ref('');
const condicionCompra = ref<IdCondicionCompra>('CONTADO');
const observaciones = ref('');
const lineasEditable = ref<LineaEditable[]>([
  { nombre: '', cantidadTexto: '1', costoUnitarioTexto: '0' },
]);

const mensajeError = ref('');

function agregarLinea() {
  lineasEditable.value = [
    ...lineasEditable.value,
    { nombre: '', cantidadTexto: '1', costoUnitarioTexto: '0' },
  ];
}

function quitarLinea(indice: number) {
  if (lineasEditable.value.length <= 1) return;
  lineasEditable.value = lineasEditable.value.filter((_, i) => i !== indice);
}

const totalCalculado = computed(() => {
  let suma = 0;
  for (const ln of lineasEditable.value) {
    const cantidad = Number.parseInt(ln.cantidadTexto, 10);
    const costo = Number.parseFloat(ln.costoUnitarioTexto.replace(',', '.'));
    if (
      ln.nombre.trim() &&
      Number.isFinite(cantidad) &&
      cantidad >= 1 &&
      Number.isFinite(costo) &&
      costo >= 0
    ) {
      suma += cantidad * Math.round(costo);
    }
  }
  return suma;
});

const proveedorSeleccionado = computed(() =>
  proveedorSeleccionadoId.value
    ? proveedoresStore.proveedorPorId(proveedorSeleccionadoId.value) ?? null
    : null,
);

const puedeCuentaProveedor = computed(
  () =>
    Boolean(
      proveedorSeleccionado.value?.habilitado &&
        proveedorSeleccionado.value.comprasCreditoHabilitadas,
    ),
);

const creditoDisponibleProveedor = computed(() => {
  const p = proveedorSeleccionado.value;
  if (!p) return 0;
  const saldo = cuentaCorrienteProveedorStore.saldoProveedorCacheado(p.id);
  return p.limiteCreditoCompras - saldo;
});

const excedeCreditoCuentaProveedor = computed(() => {
  if (condicionCompra.value !== 'CUENTA_PROVEEDOR') return false;
  const p = proveedorSeleccionado.value;
  if (!p || p.limiteCreditoCompras <= 0) return false;
  return totalCalculado.value > creditoDisponibleProveedor.value + 0.001;
});

function construirLineasValidadas(): LineaCompraRegistro[] | null {
  const resultado: LineaCompraRegistro[] = [];
  for (const ln of lineasEditable.value) {
    const nombreTrim = ln.nombre.trim();
    if (!nombreTrim) continue;

    const cantidad = Number.parseInt(ln.cantidadTexto, 10);
    if (!Number.isFinite(cantidad) || cantidad < 1) {
      return null;
    }
    const costoBruto = Number.parseFloat(ln.costoUnitarioTexto.replace(',', '.'));
    if (!Number.isFinite(costoBruto) || costoBruto < 0) {
      return null;
    }
    const costoUnitario = Math.round(costoBruto);
    const subtotal = cantidad * costoUnitario;
    resultado.push({
      varianteId: null,
      nombre: nombreTrim,
      cantidad,
      costoUnitario,
      subtotal,
    });
  }
  if (resultado.length === 0) return null;
  return resultado;
}

async function guardar() {
  mensajeError.value = '';
  if (!proveedorSeleccionadoId.value) {
    mensajeError.value = 'Elegí un proveedor.';
    return;
  }
  const proveedor = proveedoresStore.proveedorPorId(proveedorSeleccionadoId.value);
  if (!proveedor) {
    mensajeError.value = 'El proveedor ya no está disponible.';
    return;
  }

  const lineas = construirLineasValidadas();
  if (!lineas) {
    mensajeError.value =
      'Agregá al menos un ítem con nombre, cantidad entera mayor a cero y costo unitario válido.';
    return;
  }

  if (condicionCompra.value === 'CUENTA_PROVEEDOR') {
    if (!proveedor.comprasCreditoHabilitadas) {
      mensajeError.value = 'Este proveedor no tiene cuenta corriente habilitada.';
      return;
    }
    if (excedeCreditoCuentaProveedor.value) {
      mensajeError.value = `La compra supera el crédito disponible (${formatoPeso.format(Math.max(0, creditoDisponibleProveedor.value))}).`;
      return;
    }
  }

  const totalLineas = lineas.reduce((a, ln) => a + ln.subtotal, 0);
  try {
    await registroStore.registrarCompra({
      proveedorId: proveedor.id,
      nombreProveedorMostrar: proveedor.nombre,
      condicionCompra: condicionCompra.value,
      total: totalLineas,
      lineas,
      observaciones: observaciones.value,
    });
    await stockStore.cargar();
    emit('cerrar');
  } catch (error) {
    mensajeError.value = mensajeErrorHttp(error, 'No se pudo registrar la compra.');
  }
}

function cancelar() {
  emit('cerrar');
}
</script>

<template>
  <div class="fnc">
    <header class="fnc-cab">
      <h2 id="titulo-dlg-registrar-compra" class="fnc-tit">Registrar compra</h2>
      <button type="button" class="fnc-x" aria-label="Cerrar" @click="cancelar">×</button>
    </header>
    <p class="fnc-intro">
      Cargá el proveedor, la condición y los ítems recibidos. El número de compra se asignará al guardar.
    </p>

    <div class="fnc-campo">
      <label class="fnc-etq" for="fnc-prov">Proveedor</label>
      <select id="fnc-prov" v-model="proveedorSeleccionadoId" class="fnc-select">
        <option value="" disabled>Elegí un proveedor habilitado…</option>
        <option v-for="p in proveedoresSeleccionables" :key="p.id" :value="p.id">
          {{ p.nombre }}
        </option>
      </select>
      <p v-if="proveedoresSeleccionables.length === 0" class="fnc-aviso">
        No hay proveedores habilitados. Alta o habilitá uno en <strong>Compras → Proveedores</strong>.
      </p>
    </div>

    <fieldset class="fnc-fs">
      <legend class="fnc-etq">Condición de compra</legend>
      <div class="fnc-radio-fila">
        <label class="fnc-radio">
          <input v-model="condicionCompra" type="radio" value="CONTADO" />
          Contado
        </label>
        <label class="fnc-radio" :class="{ 'fnc-radio--deshabilitado': !puedeCuentaProveedor }">
          <input
            v-model="condicionCompra"
            type="radio"
            value="CUENTA_PROVEEDOR"
            :disabled="!puedeCuentaProveedor"
          />
          Cuenta proveedor
        </label>
      </div>
      <p v-if="condicionCompra === 'CUENTA_PROVEEDOR' && proveedorSeleccionado" class="fnc-aviso">
        Crédito disponible:
        <strong>{{ formatoPeso.format(Math.max(0, creditoDisponibleProveedor)) }}</strong>
        <span v-if="proveedorSeleccionado.limiteCreditoCompras <= 0"> (sin límite configurado)</span>
      </p>
      <p v-else-if="!puedeCuentaProveedor && proveedorSeleccionadoId" class="fnc-aviso">
        El proveedor elegido no tiene cuenta corriente habilitada.
      </p>
    </fieldset>

    <div class="fnc-lineas">
      <div class="fnc-lineas-cab">
        <span class="fnc-etq">Ítems</span>
        <button type="button" class="fnc-mini" @click="agregarLinea">Agregar fila</button>
      </div>
      <div class="fnc-scroll">
        <table class="fnc-tab" aria-label="Líneas de la compra">
          <thead>
            <tr>
              <th scope="col">Descripción</th>
              <th scope="col" class="fnc-num">Cant.</th>
              <th scope="col" class="fnc-num">C. unit. (ARS)</th>
              <th scope="col" class="fnc-acc" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ln, i) in lineasEditable" :key="i">
              <td>
                <input v-model="ln.nombre" type="text" class="fnc-inp" maxlength="140" placeholder="Ej. Camperas invierno XL" />
              </td>
              <td class="fnc-num">
                <input v-model="ln.cantidadTexto" type="text" inputmode="numeric" class="fnc-inp fnc-inp-num" autocomplete="off" />
              </td>
              <td class="fnc-num">
                <input
                  v-model="ln.costoUnitarioTexto"
                  type="text"
                  inputmode="decimal"
                  class="fnc-inp fnc-inp-num"
                  autocomplete="off"
                />
              </td>
              <td class="fnc-acc">
                <button
                  type="button"
                  class="fnc-quitar"
                  :disabled="lineasEditable.length <= 1"
                  title="Quitar fila"
                  @click="quitarLinea(i)"
                >
                  Quitar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <label class="fnc-etq" for="fnc-obs">Observaciones</label>
    <textarea id="fnc-obs" v-model="observaciones" class="fnc-area" rows="2" maxlength="500" />

    <p class="fnc-total-prev">
      <span>Total estimado</span>
      <strong>{{ formatoPeso.format(totalCalculado) }}</strong>
    </p>

    <p v-if="mensajeError" class="fnc-error" role="alert">{{ mensajeError }}</p>

    <footer class="fnc-pie">
      <button type="button" class="fnc-btn-sec" @click="cancelar">Cancelar</button>
      <button type="button" class="fnc-btn-pri" @click="guardar">Guardar compra</button>
    </footer>
  </div>
</template>

<style scoped>
.fnc {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem 1rem 1rem;
  max-height: min(90dvh, 40rem);
  min-height: 0;
}

.fnc-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
  flex-shrink: 0;
}

.fnc-tit {
  margin: 0;
  font-size: 1.06rem;
  font-weight: 700;
}

.fnc-x {
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  font-size: 1.45rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.2rem;
}

.fnc-x:hover {
  color: var(--color-texto);
}

.fnc-intro {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
  flex-shrink: 0;
}

.fnc-etq {
  font-size: 0.71rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-texto-apagado);
}

.fnc-select,
.fnc-inp,
.fnc-area {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
  font: inherit;
  font-size: 0.88rem;
}

.fnc-campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
}

.fnc-fs {
  margin: 0;
  padding: 0;
  border: none;
  flex-shrink: 0;
}

.fnc-fs legend {
  margin-bottom: 0.35rem;
}

.fnc-radio-fila {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.fnc-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  cursor: pointer;
}

.fnc-lineas {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 0;
}

.fnc-lineas-cab {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.fnc-mini {
  padding: 0.25rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-cabecera);
  color: var(--color-acento-hover);
  cursor: pointer;
}

.fnc-scroll {
  overflow: auto;
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  max-height: 12rem;
}

.fnc-tab {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.fnc-tab th,
.fnc-tab td {
  padding: 0.35rem 0.45rem;
  border-bottom: 1px solid var(--color-borde);
  vertical-align: middle;
}

.fnc-tab thead th {
  position: sticky;
  top: 0;
  background: var(--color-fondo-cabecera);
  font-weight: 600;
  color: var(--color-texto-suave);
}

.fnc-num {
  text-align: right;
  width: 5.8rem;
}

.fnc-acc {
  width: 4rem;
  text-align: right;
}

.fnc-inp-num {
  max-width: 6.8rem;
  margin-inline-start: auto;
  display: block;
}

.fnc-quitar {
  padding: 0.2rem 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--color-texto-apagado);
  cursor: pointer;
  text-decoration: underline;
}

.fnc-quitar:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: none;
}

.fnc-area {
  resize: vertical;
  min-height: 2.5rem;
}

.fnc-total-prev {
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.5rem 0.65rem;
  border-radius: var(--radio-control);
  background: var(--color-acento-suave);
  border: 1px solid var(--color-acento-borde);
  font-size: 0.86rem;
  flex-shrink: 0;
}

.fnc-total-prev strong {
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
}

.fnc-error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-peligro);
}

.fnc-aviso {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-texto-suave);
}

.fnc-pie {
  margin-top: auto;
  padding-top: 0.35rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-shrink: 0;
}

.fnc-btn-sec {
  padding: 0.5rem 0.85rem;
  border-radius: var(--radio-control);
  border: 1px solid var(--color-borde);
  background: transparent;
  color: var(--color-texto-suave);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}

.fnc-btn-pri {
  padding: 0.5rem 1rem;
  border-radius: var(--radio-control);
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-texto-sobre-acento);
  background: linear-gradient(180deg, var(--color-acento-hover), var(--color-acento));
  cursor: pointer;
  box-shadow: var(--color-sombra-elevada);
}

.fnc-btn-pri:hover {
  filter: brightness(1.05);
}
</style>
