/**
 * Datos iniciales alineados con el frontend (semillaUsuariosGestion).
 * Ejecutar tras la primera migración: npm run prisma:semilla
 */
import { Prisma, PrismaClient, RolUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { permisosPorDefectoSegunRol } from '../src/comunes/tipos/permisos-usuario';

const prisma = new PrismaClient();
const RONDAS_BCRYPT = 10;

interface UsuarioSemilla {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  contrasenaPlano: string;
  rol: RolUsuario;
}

import {
  ID_USUARIO_ADMIN,
  ID_USUARIO_DUENO,
  ID_USUARIO_EMPLEADO,
} from './datos/ids-semilla';

const usuariosSemilla: UsuarioSemilla[] = [
  {
    id: ID_USUARIO_ADMIN,
    nombre: 'Administrador',
    apellido: '',
    nombreUsuario: 'admin',
    contrasenaPlano: 'Ophhre43u',
    rol: RolUsuario.ADMIN,
  },
  {
    id: ID_USUARIO_DUENO,
    nombre: 'Roberto',
    apellido: 'Gestión Local',
    nombreUsuario: 'dueño',
    contrasenaPlano: 'dueño',
    rol: RolUsuario.DUENO,
  },
  {
    id: ID_USUARIO_EMPLEADO,
    nombre: 'Laura',
    apellido: 'Mostrador',
    nombreUsuario: 'empleado',
    contrasenaPlano: 'empleado',
    rol: RolUsuario.EMPLEADO,
  },
];

async function sembrarUsuarios(): Promise<void> {
  for (const datos of usuariosSemilla) {
    const contrasenaHash = await bcrypt.hash(datos.contrasenaPlano, RONDAS_BCRYPT);
    const permisosJson = permisosPorDefectoSegunRol(datos.rol) as unknown as Prisma.InputJsonValue;

    await prisma.usuario.upsert({
      where: { id: datos.id },
      create: {
        id: datos.id,
        nombre: datos.nombre,
        apellido: datos.apellido,
        nombreUsuario: datos.nombreUsuario,
        contrasenaHash,
        contrasenaEstaBlanqueada: false,
        rol: datos.rol,
        habilitado: true,
        permisosJson,
      },
      update: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        nombreUsuario: datos.nombreUsuario,
        contrasenaHash,
        contrasenaEstaBlanqueada: false,
        rol: datos.rol,
        habilitado: true,
        permisosJson,
        fechaEliminacion: null,
      },
    });
  }
}

async function main(): Promise<void> {
  const { sembrarCatalogoYStock, sembrarClientes, sembrarProveedores } = await import(
    './semilla-dominio'
  );
  const { sembrarVentasYComprasDemo } = await import('./semilla-transacciones');
  const { sembrarDatosFacturacion } = await import('./semilla-facturacion');
  const { sembrarEstadosFacturacion } = await import('./semilla-estados-facturacion');
  const { sembrarMotivosStock } = await import('./semilla-motivos-stock');

  await sembrarMotivosStock(prisma);
  await sembrarEstadosFacturacion(prisma);
  await sembrarUsuarios();
  await sembrarCatalogoYStock(prisma);
  await sembrarClientes(prisma);
  await sembrarProveedores(prisma);
  await sembrarVentasYComprasDemo(prisma);
  await sembrarDatosFacturacion(prisma);

  // eslint-disable-next-line no-console
  console.log(
    'Semilla aplicada: motivos, usuarios, catálogo ampliado, stock, clientes, proveedores, 10 compras, 10 ventas demo y datos de facturación.',
  );
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Error en semilla:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
