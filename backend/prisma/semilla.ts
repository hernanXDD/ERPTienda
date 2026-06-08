/**
 * Semilla mínima para una instalación nueva.
 * Ejecutar tras la primera migración: npm run db:seed
 */
import { Prisma, PrismaClient, RolUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { permisosPorDefectoSegunRol } from '../src/comunes/tipos/permisos-usuario';
import { ID_USUARIO_ADMIN, ID_USUARIO_DUENO, ID_USUARIO_EMPLEADO } from './datos/ids-semilla';
import { sembrarEstadosFacturacion } from './semilla-estados-facturacion';
import { sembrarMotivosStock } from './semilla-motivos-stock';

const prisma = new PrismaClient();
const RONDAS_BCRYPT = 10;

const ADMIN_SEMILLA = {
  id: ID_USUARIO_ADMIN,
  nombre: 'Administrador',
  apellido: '',
  nombreUsuario: 'admin',
  contrasenaPlano: 'Ophhre43u',
  rol: RolUsuario.ADMIN,
} as const;

async function sembrarUsuarioAdministrador(): Promise<void> {
  const contrasenaHash = await bcrypt.hash(ADMIN_SEMILLA.contrasenaPlano, RONDAS_BCRYPT);
  const permisosJson = permisosPorDefectoSegunRol(ADMIN_SEMILLA.rol) as unknown as Prisma.InputJsonValue;

  await prisma.usuario.upsert({
    where: { id: ADMIN_SEMILLA.id },
    create: {
      id: ADMIN_SEMILLA.id,
      nombre: ADMIN_SEMILLA.nombre,
      apellido: ADMIN_SEMILLA.apellido,
      nombreUsuario: ADMIN_SEMILLA.nombreUsuario,
      contrasenaHash,
      contrasenaEstaBlanqueada: false,
      rol: ADMIN_SEMILLA.rol,
      habilitado: true,
      permisosJson,
    },
    update: {
      nombre: ADMIN_SEMILLA.nombre,
      apellido: ADMIN_SEMILLA.apellido,
      nombreUsuario: ADMIN_SEMILLA.nombreUsuario,
      contrasenaHash,
      contrasenaEstaBlanqueada: false,
      rol: ADMIN_SEMILLA.rol,
      habilitado: true,
      permisosJson,
      fechaEliminacion: null,
    },
  });
}

async function retirarUsuariosDemoAnteriores(): Promise<void> {
  await prisma.usuario.updateMany({
    where: {
      id: { in: [ID_USUARIO_DUENO, ID_USUARIO_EMPLEADO] },
      fechaEliminacion: null,
    },
    data: { fechaEliminacion: new Date() },
  });
}

async function main(): Promise<void> {
  await sembrarMotivosStock(prisma);
  await sembrarEstadosFacturacion(prisma);
  await sembrarUsuarioAdministrador();
  await retirarUsuariosDemoAnteriores();

  const cantidadUsuarios = await prisma.usuario.count({
    where: { fechaEliminacion: null },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Semilla aplicada: motivos de stock, estados de facturación y usuario administrador (${ADMIN_SEMILLA.nombreUsuario}). Total usuarios: ${cantidadUsuarios}.`,
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
