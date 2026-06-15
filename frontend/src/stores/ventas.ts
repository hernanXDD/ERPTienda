import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  cargarFacturacionesApi,
  listarVentasApi,
  registrarVentaApi,
  type VentaRegistradaApi,
} from '../servicios/ventas.servicio';
import { mensajeErrorHttp } from '../servicios/apiUtil';
import type {
  IdFormaPago,
  ItemCargarFacturacion,
  LineaVentaRegistro,
  VentaRegistrada,
} from '../tipos/venta';
import type { IdCondicionIva } from '../tipos/condicionIva';
import { CONDICION_IVA_POR_DEFECTO } from '../tipos/condicionIva';
import { ESTADO_FACTURACION_PENDIENTE } from '../tipos/venta';
import type { RegistroOperador } from '../tipos/registroOperador';
import { crearRegistroOperadorDesdeSesion } from '../utilidades/registroOperadorSesion';
import {
  crearSincronizadorListaRemota,
  type OpcionesCargaLista,
} from '../utilidades/sincronizacionListaRemota';

export interface DatosRegistrarVenta {
  clienteId: string | null;
  nombreClienteMostrar: string;
  documentoClienteMostrar?: string;
  formaPago: IdFormaPago;
  total: number;
  ajusteMonto?: number;
  ajustePorcentaje?: number | null;
  lineas: LineaVentaRegistro[];
  observaciones: string;
}

function subtotalDesdeLineas(lineas: LineaVentaRegistro[]): number {
  return lineas.reduce((acc, ln) => acc + ln.subtotal, 0);
}

function mapearVentaApi(
  venta: VentaRegistradaApi,
  registradoPor?: RegistroOperador,
): VentaRegistrada {
  const subtotalLineas = subtotalDesdeLineas(venta.lineas);
  const subtotal = venta.subtotal ?? subtotalLineas;
  const ajusteMonto = venta.ajusteMonto ?? venta.total - subtotal;
  const ajustePorcentaje = venta.ajustePorcentaje ?? null;
  return {
    id: venta.id,
    numero: venta.numero,
    fecha: venta.fecha,
    clienteId: venta.clienteId,
    nombreClienteMostrar: venta.nombreClienteMostrar,
    documentoClienteMostrar: venta.documentoClienteMostrar ?? '',
    condicionIvaCliente: (venta.condicionIvaCliente as IdCondicionIva) ?? CONDICION_IVA_POR_DEFECTO,
    formaPago: venta.formaPago as IdFormaPago,
    subtotal,
    ajusteMonto,
    ajustePorcentaje,
    total: venta.total,
    facturacion: venta.facturacion ?? '',
    estadoFacturacion: venta.estadoFacturacion ?? ESTADO_FACTURACION_PENDIENTE,
    lineas: venta.lineas,
    observaciones: venta.observaciones,
    registradoPor: registradoPor ?? {
      idUsuario: null,
      etiquetaUsuario: '—',
    },
  };
}

const sincronizador = crearSincronizadorListaRemota();

export const useVentasStore = defineStore('ventas', () => {
  const ventas = ref<VentaRegistrada[]>([]);
  const cargandoVentas = ref(false);
  const errorVentas = ref<string | null>(null);
  let ventasSincronizadas = false;

  async function cargarVentas(opciones?: OpcionesCargaLista): Promise<void> {
    if (ventasSincronizadas && !opciones?.forzar) return;

    await sincronizador.serializarCarga(async () => {
      if (ventasSincronizadas && !opciones?.forzar) return;

      const generacion = sincronizador.generacionAlIniciarCarga();
      cargandoVentas.value = true;
      errorVentas.value = null;
      try {
        const lista = await listarVentasApi();
        if (sincronizador.esRespuestaObsoleta(generacion)) return;
        ventas.value = lista.map((v) => mapearVentaApi(v));
        ventasSincronizadas = true;
      } catch (error: unknown) {
        if (!sincronizador.esRespuestaObsoleta(generacion)) {
          errorVentas.value = mensajeErrorHttp(error, 'No se pudieron cargar las ventas desde el servidor.');
        }
        throw error;
      } finally {
        if (!sincronizador.esRespuestaObsoleta(generacion)) {
          cargandoVentas.value = false;
        }
      }
    });
  }

  async function asegurarVentasCargadas(): Promise<void> {
    if (!ventasSincronizadas) await cargarVentas();
  }

  async function registrarVenta(datos: DatosRegistrarVenta): Promise<VentaRegistrada> {
    sincronizador.marcarMutacionLocal();
    const registradaApi = await registrarVentaApi(datos);
    const registrada = mapearVentaApi(registradaApi, crearRegistroOperadorDesdeSesion());
    ventas.value = [registrada, ...ventas.value.filter((v) => v.id !== registrada.id)];
    ventasSincronizadas = true;
    errorVentas.value = null;
    return registrada;
  }

  async function cargarFacturaciones(items: ItemCargarFacturacion[]): Promise<void> {
    sincronizador.marcarMutacionLocal();
    const actualizadasApi = await cargarFacturacionesApi(items);
    const actualizadas = actualizadasApi.map((venta) => mapearVentaApi(venta));
    const porId = new Map(actualizadas.map((venta) => [venta.id, venta]));
    ventas.value = ventas.value.map((venta) => porId.get(venta.id) ?? venta);
    ventasSincronizadas = true;
  }

  function reiniciar(): void {
    ventas.value = [];
    cargandoVentas.value = false;
    errorVentas.value = null;
    ventasSincronizadas = false;
    sincronizador.marcarMutacionLocal();
  }

  return {
    ventas,
    cargandoVentas,
    errorVentas,
    cargarVentas,
    asegurarVentasCargadas,
    registrarVenta,
    cargarFacturaciones,
    reiniciar,
  };
});
