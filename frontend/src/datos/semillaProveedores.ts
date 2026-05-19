import type { Proveedor } from '../tipos/proveedor';

export function crearSemillaProveedores(): Proveedor[] {
  return [
    {
      id: 'prv-sem-000001',
      nombre: 'Textiles del Sur SA',
      documento: '30-71655448-9',
      correoElectronico: 'comercial@textilesdelsur.demostracion.ar',
      telefonoPrincipal: '+54 11 4788-1100',
      telefonoAlternativo: '+54 9 11 6200-4400',
      direccion: 'Av. Warnes 970, Buenos Aires · depósito 2',
      limiteCreditoCompras: 3_200_000,
      comprasCreditoHabilitadas: true,
      habilitado: true,
    },
    {
      id: 'prv-sem-000002',
      nombre: 'Importadora Rivera',
      documento: '30-65987104-8',
      correoElectronico: 'facturacion@importadorarivera.demostracion.ar',
      telefonoPrincipal: '+54 341 422-8899',
      telefonoAlternativo: '',
      direccion: 'Ruta A008 km 295, zona industrial Rosario',
      limiteCreditoCompras: 0,
      comprasCreditoHabilitadas: false,
      habilitado: true,
    },
    {
      id: 'prv-sem-000003',
      nombre: 'Calzados Patagonia',
      documento: '27-38902111-9',
      correoElectronico: '',
      telefonoPrincipal: '+54 2944 62-7711',
      telefonoAlternativo: '',
      direccion: 'Sarmiento 450, Neuquén capital',
      limiteCreditoCompras: 650_000,
      comprasCreditoHabilitadas: true,
      habilitado: true,
    },
    {
      id: 'prv-sem-000004',
      nombre: 'Mercería Centro (suspendido)',
      documento: '20-44998800-8',
      correoElectronico: 'admin@merceriacentro.demostracion.ar',
      telefonoPrincipal: '+54 381 577-0900',
      telefonoAlternativo: '',
      direccion: 'Mitre 980, San Miguel de Tucumán',
      limiteCreditoCompras: 0,
      comprasCreditoHabilitadas: false,
      habilitado: false,
    },
  ];
}
