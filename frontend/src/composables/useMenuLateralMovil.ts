import { ref } from 'vue';

const menuLateralMovilAbierto = ref(false);

export function useMenuLateralMovil() {
  function abrirMenuLateralMovil(): void {
    menuLateralMovilAbierto.value = true;
  }

  function cerrarMenuLateralMovil(): void {
    menuLateralMovilAbierto.value = false;
  }

  function alternarMenuLateralMovil(): void {
    menuLateralMovilAbierto.value = !menuLateralMovilAbierto.value;
  }

  return {
    menuLateralMovilAbierto,
    abrirMenuLateralMovil,
    cerrarMenuLateralMovil,
    alternarMenuLateralMovil,
  };
}
