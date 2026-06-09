<script setup lang="ts">
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  TrendingUp,
} from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { menusVisiblesResueltos } from '../../modulos/usuarios/permisosUsuario';
import { etiquetaRolUsuario } from '../../datos/etiquetasRolUsuario';
import { etiquetaMotivoMovimientoStock } from '../../modulos/inventario/etiquetasMovimientoStock';
import {
  calcularAlertasStock,
  calcularKpisVentasDia,
  filtrarVentasDelDia,
  formatearFechaTituloInicio,
} from '../../modulos/inicio/calcularResumenInicio';
import { contarClientesEnDeudaPorPlazo } from '../../modulos/configuracion/deudaCuentaCorriente';
import { useCatalogoStore } from '../../stores/catalogo';
import { useClientesStore } from '../../stores/clientes';
import { useConfiguracionSistemaStore } from '../../stores/configuracionSistema';
import { useCuentaCorrienteStore } from '../../stores/cuentaCorriente';
import { useGestionUsuariosStore } from '../../stores/gestionUsuarios';
import { useSesionStore } from '../../stores/sesion';
import { useStockStore } from '../../stores/stock';
import { useVentasStore } from '../../stores/ventas';
import { useNegocioStore } from '../../stores/negocio';
import {
  mensajeNegocioIncompleto,
  negocioRequiereConfiguracion,
} from '../../modulos/negocio/evaluarConfiguracionNegocio';
import {
  formatearFechaDiaMesAnio,
  formatearHoraAmPm,
  obtenerDiaComparableDesdeValor,
} from '../../utilidades/formatoFechaHora';
import { obtenerDescripcionPagina } from '../../modulos/nucleo/descripcionesPaginas';

const descripcionPagina = obtenerDescripcionPagina('inicio');

const formatoPeso = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const CANTIDAD_ACTIVIDAD_RECIENTE = 5;

const sesionStore = useSesionStore();
const ventasStore = useVentasStore();
const negocioStore = useNegocioStore();
const stockStore = useStockStore();
const catalogoStore = useCatalogoStore();
const clientesStore = useClientesStore();
const cuentaCorrienteStore = useCuentaCorrienteStore();
const configuracionSistemaStore = useConfiguracionSistemaStore();
const gestionUsuariosStore = useGestionUsuariosStore();

const { ventas } = storeToRefs(ventasStore);
const { movimientos } = storeToRefs(stockStore);
const { variantes } = storeToRefs(catalogoStore);
const { clientes } = storeToRefs(clientesStore);
const { parametros: parametrosSistema } = storeToRefs(configuracionSistemaStore);
const { movimientos: movimientosCuentaCorriente } = storeToRefs(cuentaCorrienteStore);
const { negocio } = storeToRefs(negocioStore);

const puedeVerConfiguracion = computed(() => menusVisibles.value.configuracion);

const avisoNegocioIncompleto = computed(
  () => puedeVerConfiguracion.value && negocioRequiereConfiguracion(negocio.value),
);

const textoAvisoNegocio = computed(() => mensajeNegocioIncompleto(negocio.value));

const diaHoyComparable = computed(() => obtenerDiaComparableDesdeValor(new Date()));
const fechaTitulo = computed(() => formatearFechaTituloInicio(new Date()));

const menusVisibles = computed(() => {
  const idSesion = sesionStore.usuario?.id;
  const parcial = idSesion
    ? gestionUsuariosStore.obtenerPorId(idSesion)?.permisos.menusVisibles
    : undefined;
  return menusVisiblesResueltos(parcial);
});

const puedeVerVentas = computed(() => menusVisibles.value.ventas);
const puedeVerStock = computed(() => menusVisibles.value.stock);
const puedeVerClientes = computed(() => menusVisibles.value.clientes);

const ventasDelDia = computed(() =>
  filtrarVentasDelDia(ventas.value, diaHoyComparable.value)
);

const kpisVentas = computed(() => calcularKpisVentasDia(ventasDelDia.value));

const alertasStock = computed(() =>
  calcularAlertasStock(
    variantes.value.filter((v) => v.activa),
    (id) => stockStore.cantidadActual(id),
    parametrosSistema.value.stockMinimoAlerta
  )
);

const clientesConDeuda = computed(() =>
  contarClientesEnDeudaPorPlazo(
    clientes.value,
    parametrosSistema.value.diasDeudaCuentaCorriente,
    (id) => cuentaCorrienteStore.saldoActualCliente(id),
    (id) => movimientosCuentaCorriente.value.filter((m) => m.clienteId === id)
  )
);

const hayAlertasOperativas = computed(() => {
  const alertaStock =
    puedeVerStock.value &&
    (alertasStock.value.variantesAgotadas > 0 || alertasStock.value.variantesStockBajo > 0);
  const alertaCc = puedeVerClientes.value && clientesConDeuda.value > 0;
  return alertaStock || alertaCc;
});

const ultimasVentas = computed(() => ventas.value.slice(0, CANTIDAD_ACTIVIDAD_RECIENTE));

const ultimosMovimientos = computed(() =>
  movimientos.value.slice(0, CANTIDAD_ACTIVIDAD_RECIENTE)
);

const etiquetaRolSesion = computed(() => {
  const rol = sesionStore.usuario?.rol;
  return rol ? etiquetaRolUsuario(rol) : '';
});
</script>

<template>
  <section class="pg-wrap" aria-labelledby="titulo-inicio">
    <div class="pg-marco">
      <header class="pg-cab">
        <div class="pg-cab-txt">
          <div class="pg-cab-izq">
            <LayoutDashboard
              :size="22"
              class="pg-cab-ico"
              aria-hidden="true"
              stroke-width="1.85"
            />
            <div>
              <h1 id="titulo-inicio" class="pg-titulo">Inicio</h1>
              <p class="pg-sub">{{ descripcionPagina }}</p>
              <p class="ini-saludo">
                Hola,
                <strong class="ini-nom">{{ sesionStore.usuario?.nombreUsuario }}</strong
                ><span v-if="etiquetaRolSesion" class="ini-rol"> · {{ etiquetaRolSesion }}</span>
              </p>
              <p class="ini-fecha">{{ fechaTitulo }}</p>
            </div>
          </div>
        </div>
      </header>

      <div v-if="avisoNegocioIncompleto" class="ini-aviso-config" role="status">
        <p class="ini-aviso-config-txt">{{ textoAvisoNegocio }}</p>
        <RouterLink :to="{ name: 'configuracion-negocio' }" class="ini-aviso-config-link">
          Completar datos del negocio
          <ArrowRight :size="16" aria-hidden="true" />
        </RouterLink>
      </div>

      <div class="pg-cuerpo ini-cuerpo">
        <section
          v-if="puedeVerVentas"
      class="ini-bloq"
      aria-labelledby="ini-tit-ventas-hoy"
    >
      <h2 id="ini-tit-ventas-hoy" class="ini-bloq-tit">
        <TrendingUp :size="18" stroke-width="2" class="ini-bloq-ico" aria-hidden="true" />
        Ventas de hoy
      </h2>
      <div class="pg-kpis pg-kpis--4" role="list">
        <article class="pg-kpi" role="listitem">
          <span class="pg-kpi-etiq">Operaciones</span>
          <span class="pg-kpi-valor ini-mono">{{ kpisVentas.cantidadVentas }}</span>
        </article>
        <article class="pg-kpi pg-kpi--acento" role="listitem">
          <span class="pg-kpi-etiq">Total facturado</span>
          <span class="pg-kpi-valor ini-mono">{{
            formatoPeso.format(kpisVentas.totalImporte)
          }}</span>
        </article>
        <article class="pg-kpi" role="listitem">
          <span class="pg-kpi-etiq">Ticket promedio</span>
          <span class="pg-kpi-valor ini-mono">{{
            kpisVentas.cantidadVentas
              ? formatoPeso.format(kpisVentas.ticketPromedio)
              : '—'
          }}</span>
        </article>
        <article class="pg-kpi" role="listitem">
          <span class="pg-kpi-etiq">Unidades vendidas</span>
          <span class="pg-kpi-valor ini-mono">{{ kpisVentas.unidadesVendidas }}</span>
        </article>
      </div>
      <p v-if="kpisVentas.cantidadVentas === 0" class="ini-kpi-vacio">
        Todavía no hay ventas registradas hoy. Las operaciones del centro de ventas aparecerán
        aquí en tiempo real.
      </p>
    </section>

    <section
      v-if="puedeVerStock || puedeVerClientes"
      class="ini-bloq"
      aria-labelledby="ini-tit-alertas"
    >
      <h2 id="ini-tit-alertas" class="ini-bloq-tit">
        <AlertTriangle :size="18" stroke-width="2" class="ini-bloq-ico" aria-hidden="true" />
        Requiere atención
      </h2>

      <div v-if="hayAlertasOperativas" class="ini-alertas">
        <div
          v-if="puedeVerStock && alertasStock.variantesAgotadas > 0"
          class="ini-alerta ini-alerta--crit"
        >
          <div class="ini-alerta-txt">
            <span class="ini-alerta-tit">Variantes agotadas</span>
            <span class="ini-alerta-det">
              {{ alertasStock.variantesAgotadas }}
              {{ alertasStock.variantesAgotadas === 1 ? 'sin unidades' : 'sin unidades' }}
              disponibles para venta.
            </span>
          </div>
          <RouterLink class="ini-alerta-link" :to="{ name: 'stock-actual' }">
            Ver stock
            <ArrowRight :size="15" stroke-width="2" aria-hidden="true" />
          </RouterLink>
        </div>

        <div
          v-if="puedeVerStock && alertasStock.variantesStockBajo > 0"
          class="ini-alerta ini-alerta--adv"
        >
          <div class="ini-alerta-txt">
            <span class="ini-alerta-tit">Stock bajo</span>
            <span class="ini-alerta-det">
              {{ alertasStock.variantesStockBajo }}
              {{
                alertasStock.variantesStockBajo === 1
                  ? 'variante con'
                  : 'variantes con'
              }}
              {{ parametrosSistema.stockMinimoAlerta }} unidades o menos.
            </span>
          </div>
          <RouterLink class="ini-alerta-link" :to="{ name: 'stock-actual' }">
            Ver stock
            <ArrowRight :size="15" stroke-width="2" aria-hidden="true" />
          </RouterLink>
        </div>

        <div v-if="puedeVerClientes && clientesConDeuda > 0" class="ini-alerta ini-alerta--cc">
          <div class="ini-alerta-txt">
            <span class="ini-alerta-tit">Deuda en cuenta corriente</span>
            <span class="ini-alerta-det">
              {{ clientesConDeuda }}
              {{
                clientesConDeuda === 1
                  ? 'cliente con deuda vencida'
                  : 'clientes con deuda vencida'
              }}
              (más de {{ parametrosSistema.diasDeudaCuentaCorriente }} días desde el último cargo).
            </span>
          </div>
          <RouterLink class="ini-alerta-link" :to="{ name: 'clientes-cuentas-corrientes' }">
            Ver cuentas
            <ArrowRight :size="15" stroke-width="2" aria-hidden="true" />
          </RouterLink>
        </div>
      </div>

      <p v-else class="ini-ok">
        <CheckCircle2 :size="18" stroke-width="2" class="ini-ok-ico" aria-hidden="true" />
        No hay alertas operativas pendientes según los datos actuales.
      </p>
    </section>

    <div
      v-if="puedeVerVentas || puedeVerStock"
      class="ini-actividad"
      :class="{ 'ini-actividad--una': !puedeVerVentas || !puedeVerStock }"
    >
      <section
        v-if="puedeVerVentas"
        class="ini-panel"
        aria-labelledby="ini-tit-ult-ventas"
      >
        <div class="ini-panel-cab">
          <h2 id="ini-tit-ult-ventas" class="ini-panel-tit">
            <Receipt :size="17" stroke-width="2" aria-hidden="true" />
            Últimas ventas
          </h2>
          <RouterLink class="ini-panel-link" :to="{ name: 'ventas-historial' }">
            Historial completo
            <ArrowRight :size="14" stroke-width="2" aria-hidden="true" />
          </RouterLink>
        </div>

        <ul v-if="ultimasVentas.length" class="ini-lista" role="list">
          <li v-for="v in ultimasVentas" :key="v.id" class="ini-item">
            <RouterLink class="ini-item-link" :to="{ name: 'ventas-historial' }">
              <span class="ini-item-izq">
                <span class="ini-item-num">{{ v.numero }}</span>
                <span class="ini-item-meta">
                  {{ formatearFechaDiaMesAnio(v.fecha) }}
                  <span class="ini-item-sep">·</span>
                  {{ formatearHoraAmPm(v.fecha) }}
                  <span class="ini-item-sep">·</span>
                  {{ v.nombreClienteMostrar }}
                </span>
              </span>
              <span class="ini-item-der ini-mono">{{ formatoPeso.format(v.total) }}</span>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="ini-panel-vacio">Todavía no hay ventas registradas.</p>
      </section>

      <section
        v-if="puedeVerStock"
        class="ini-panel"
        aria-labelledby="ini-tit-ult-mov"
      >
        <div class="ini-panel-cab">
          <h2 id="ini-tit-ult-mov" class="ini-panel-tit">
            <ScrollText :size="17" stroke-width="2" aria-hidden="true" />
            Movimientos de stock
          </h2>
          <RouterLink class="ini-panel-link" :to="{ name: 'stock-auditorias' }">
            Ver auditorías
            <ArrowRight :size="14" stroke-width="2" aria-hidden="true" />
          </RouterLink>
        </div>

        <ul v-if="ultimosMovimientos.length" class="ini-lista" role="list">
          <li v-for="m in ultimosMovimientos" :key="m.id" class="ini-item">
            <RouterLink class="ini-item-link" :to="{ name: 'stock-auditorias' }">
              <span class="ini-item-izq">
                <span class="ini-item-nom">{{ m.nombreVariante }}</span>
                <span class="ini-item-meta">
                  {{ etiquetaMotivoMovimientoStock(m) }}
                  <template v-if="m.numeroVenta">
                    <span class="ini-item-sep">·</span>
                    {{ m.numeroVenta }}
                  </template>
                </span>
              </span>
              <span
                class="ini-item-var ini-mono"
                :class="{
                  'ini-item-var--sube': m.cantidadVariacion > 0,
                  'ini-item-var--baja': m.cantidadVariacion < 0,
                }"
              >
                {{ m.cantidadVariacion >= 0 ? '+' : '' }}{{ m.cantidadVariacion }}
              </span>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="ini-panel-vacio">
          Sin movimientos recientes. Ventas, entradas y conteos aparecerán aquí.
        </p>
      </section>
        </div>

        <p class="ini-pie" role="note">
          <Package :size="14" stroke-width="2" class="ini-pie-ico" aria-hidden="true" />
          Los totales del día se calculan con la fecha local del equipo.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ini-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ini-aviso-config {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin: 0 clamp(1rem, 3vw, 1.65rem) 0.85rem;
  padding: 0.8rem 1rem;
  border-radius: var(--radio-control);
  border: 1px solid rgba(251, 191, 36, 0.38);
  background: rgba(251, 191, 36, 0.1);
}

.ini-aviso-config-txt {
  margin: 0;
  flex: 1 1 14rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--color-texto);
}

.ini-aviso-config-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--color-acento-hover);
  text-decoration: none;
}

.ini-aviso-config-link:hover {
  text-decoration: underline;
}

.ini-nom {
  color: var(--color-texto);
  font-weight: 600;
}

.ini-rol {
  color: var(--color-texto-apagado);
  font-weight: 500;
}

.ini-fecha {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--color-texto-apagado);
  text-transform: capitalize;
}

.ini-saludo {
  margin: 0.35rem 0 0;
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-texto-suave);
}

.ini-cuerpo .pg-kpi-valor {
  font-size: clamp(1rem, 2.2vw, 1.2rem);
}

.ini-bloq {
  padding: 0.9rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  box-shadow: var(--sombra-suave);
}

.ini-bloq-tit {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.ini-bloq-ico {
  color: var(--color-acento);
}

.ini-kpi-vacio {
  margin: 0.65rem 0 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
}

.ini-alertas {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ini-alerta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem 1rem;
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  border: 1px solid var(--color-borde);
}

.ini-alerta--crit {
  border-color: rgba(251, 113, 133, 0.35);
  background: rgba(251, 113, 133, 0.08);
}

.ini-alerta--adv {
  border-color: rgba(251, 191, 36, 0.32);
  background: rgba(251, 191, 36, 0.07);
}

.ini-alerta--cc {
  border-color: rgba(124, 140, 240, 0.32);
  background: rgba(124, 140, 240, 0.07);
}

.ini-alerta-txt {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ini-alerta-tit {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-texto);
}

.ini-alerta-det {
  font-size: 0.8rem;
  color: var(--color-texto-suave);
  line-height: 1.4;
}

.ini-alerta-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-acento-hover);
  text-decoration: none;
  white-space: nowrap;
}

.ini-alerta-link:hover {
  filter: brightness(1.08);
}

.ini-ok {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.28);
  background: rgba(52, 211, 153, 0.08);
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--color-exito);
}

.ini-ok-ico {
  flex-shrink: 0;
}

.ini-actividad {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  align-items: stretch;
}

.ini-actividad--una {
  grid-template-columns: 1fr;
}

@media (max-width: 820px) {
  .ini-actividad {
    grid-template-columns: 1fr;
  }
}

.ini-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo-elevado);
  box-shadow: var(--sombra-suave);
}

.ini-panel-cab {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  margin-bottom: 0.55rem;
}

.ini-panel-tit {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-texto-apagado);
}

.ini-panel-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--color-acento-hover);
  text-decoration: none;
}

.ini-panel-link:hover {
  filter: brightness(1.08);
}

.ini-lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.ini-item {
  margin: 0;
}

.ini-item-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  border: 1px solid transparent;
  text-decoration: none;
  color: inherit;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.ini-item-link:hover {
  background: rgba(124, 140, 240, 0.07);
  border-color: rgba(124, 140, 240, 0.2);
}

.ini-item-izq {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.ini-item-num {
  font-size: 0.82rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-acento-hover);
}

.ini-item-nom {
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-texto);
}

.ini-item-meta {
  font-size: 0.74rem;
  color: var(--color-texto-apagado);
  line-height: 1.35;
}

.ini-item-sep {
  margin-inline: 0.12rem;
  opacity: 0.7;
}

.ini-item-der {
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-texto);
}

.ini-item-var {
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
}

.ini-item-var--sube {
  color: var(--color-exito);
}

.ini-item-var--baja {
  color: var(--color-peligro);
}

.ini-panel-vacio {
  margin: 0.25rem 0 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
}

.ini-mono {
  font-variant-numeric: tabular-nums;
}

.ini-pie {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0.25rem 0 0;
  padding-top: 0.35rem;
  border-top: 1px solid var(--color-borde);
  font-size: 0.72rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.ini-pie-ico {
  flex-shrink: 0;
  margin-top: 0.05rem;
  opacity: 0.75;
}
</style>
