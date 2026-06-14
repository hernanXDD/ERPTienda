/**
 * Semilla mínima para una instalación nueva.
 * Ejecutar tras la primera migración: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import { ID_USUARIO_ADMIN } from './datos/ids-semilla';
import { sembrarEstadosFacturacion } from './semilla-estados-facturacion';
import { sembrarMotivosStock } from './semilla-motivos-stock';
import {
  retirarUsuariosDemoAnteriores,
  sembrarUsuarioAdministrador,
} from './semilla-usuario-admin';
import { filtroNoBorrado } from '../src/comunes/utilidades/borrado-logico';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await sembrarMotivosStock(prisma);
  await sembrarEstadosFacturacion(prisma);
  await sembrarUsuarioAdministrador(prisma);
  await retirarUsuariosDemoAnteriores(prisma);

  const cantidadUsuarios = await prisma.usuario.count({
    where: filtroNoBorrado,
  });

  // eslint-disable-next-line no-console
  console.log(
    `Semilla aplicada: motivos de stock, estados de facturación y usuario administrador (${ID_USUARIO_ADMIN} / admin). Total usuarios: ${cantidadUsuarios}.`,
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
