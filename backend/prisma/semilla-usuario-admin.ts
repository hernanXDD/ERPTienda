import { Prisma, PrismaClient, RolUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RONDAS_BCRYPT } from '../src/comunes/seguridad/bcrypt.config';
import { datosMarcarBorrado, filtroNoBorrado } from '../src/comunes/utilidades/borrado-logico';
import { permisosPorDefectoSegunRol } from '../src/comunes/tipos/permisos-usuario';
import {
  ID_USUARIO_ADMIN,
  ID_USUARIO_DUENO,
  ID_USUARIO_EMPLEADO,
} from './datos/ids-semilla';

const ADMIN_SEMILLA = {
  id: ID_USUARIO_ADMIN,
  nombre: 'Administrador',
  apellido: '',
  nombreUsuario: 'admin',
  contrasenaPlano: '12345678',
  rol: RolUsuario.ADMIN,
} as const;

export async function sembrarUsuarioAdministrador(prisma: PrismaClient): Promise<void> {
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
      debeCambiarContrasena: true,
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
      debeCambiarContrasena: true,
      rol: ADMIN_SEMILLA.rol,
      habilitado: true,
      permisosJson,
      borrado: false,
      fechaEliminacion: null,
    },
  });
}

export async function retirarUsuariosDemoAnteriores(prisma: PrismaClient): Promise<void> {
  await prisma.usuario.updateMany({
    where: {
      id: { in: [ID_USUARIO_DUENO, ID_USUARIO_EMPLEADO] },
      ...filtroNoBorrado,
    },
    data: datosMarcarBorrado(),
  });
}
