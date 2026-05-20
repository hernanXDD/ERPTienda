/**
 * Datos iniciales alineados con el frontend (semillaUsuariosGestion).
 * Ejecutar tras la primera migración: npm run prisma:semilla
 */
import { PrismaClient, RolUsuario } from '@prisma/client';
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

const usuariosSemilla: UsuarioSemilla[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Administrador',
    apellido: '',
    nombreUsuario: 'admin',
    contrasenaPlano: 'Ophhre43u',
    rol: RolUsuario.ADMIN,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Roberto',
    apellido: 'Gestión Local',
    nombreUsuario: 'dueño',
    contrasenaPlano: 'dueño',
    rol: RolUsuario.DUENO,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
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
    const permisosJson = permisosPorDefectoSegunRol(datos.rol);

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

  await sembrarUsuarios();
  await sembrarCatalogoYStock(prisma);
  await sembrarClientes(prisma);
  await sembrarProveedores(prisma);

  // eslint-disable-next-line no-console
  console.log(
    'Semilla aplicada: usuarios, catálogo, stock, clientes y proveedores de demostración.',
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
