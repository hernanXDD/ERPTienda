import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RolUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RONDAS_BCRYPT } from '../../comunes/seguridad/bcrypt.config';
import {
  menusVisiblesResueltos,
  permisosPorDefectoSegunRol,
  type PermisosOperativosUsuario,
} from '../../comunes/tipos/permisos-usuario';
import {
  rolDesdeBaseDeDatos,
  rolHaciaBaseDeDatos,
  type RolUsuarioApi,
} from '../../comunes/tipos/rol-usuario-api';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { datosMarcarBorrado, filtroNoBorrado } from '../../comunes/utilidades/borrado-logico';
import { normalizarNombreUsuario } from '../../comunes/utilidades/normalizar-nombre-usuario';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarPermisosUsuarioDto } from './dto/actualizar-permisos-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

export interface UsuarioApi {
  id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  contrasenaPlano: string;
  contrasenaEstaBlanqueada: boolean;
  rol: RolUsuarioApi;
  habilitado: boolean;
  permisos: PermisosOperativosUsuario;
}

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSecuencia: IdSecuenciaService,
  ) {}

  private mapearUsuario(usuario: {
    id: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    contrasenaEstaBlanqueada: boolean;
    rol: RolUsuario;
    habilitado: boolean;
    permisosJson: unknown;
  }): UsuarioApi {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      nombreUsuario: usuario.nombreUsuario,
      contrasenaPlano: '',
      contrasenaEstaBlanqueada: usuario.contrasenaEstaBlanqueada,
      rol: rolDesdeBaseDeDatos(usuario.rol),
      habilitado: usuario.habilitado,
      permisos: usuario.permisosJson as PermisosOperativosUsuario,
    };
  }

  private operadorEsDueño(operador: UsuarioSesion): boolean {
    return operador.rol === 'DUEÑO';
  }

  private rolEsAdministrador(rol: RolUsuarioApi | RolUsuario): boolean {
    const rolApi =
      typeof rol === 'string' && (rol === 'ADMIN' || rol === 'DUEÑO' || rol === 'EMPLEADO')
        ? rol
        : rolDesdeBaseDeDatos(rol);
    return rolApi === 'ADMIN';
  }

  private dueñoIntentaGestionarAdministrador(
    operador: UsuarioSesion,
    rolObjetivo: RolUsuarioApi | RolUsuario,
  ): boolean {
    return this.operadorEsDueño(operador) && this.rolEsAdministrador(rolObjetivo);
  }

  /** El rol Administrador solo existe en la cuenta principal de semilla; no se asigna vía API. */
  private intentaAsignarRolAdministrador(
    rolAnterior: RolUsuario | null,
    rolNuevo: RolUsuarioApi | RolUsuario,
  ): boolean {
    if (!this.rolEsAdministrador(rolNuevo)) return false;
    if (rolAnterior == null) return true;
    return !this.rolEsAdministrador(rolAnterior);
  }

  private intentaQuitarRolAdministrador(
    rolAnterior: RolUsuario,
    rolNuevo: RolUsuarioApi | RolUsuario,
  ): boolean {
    return this.rolEsAdministrador(rolAnterior) && !this.rolEsAdministrador(rolNuevo);
  }

  private esRolElevado(rol: RolUsuarioApi): boolean {
    return rol === 'ADMIN' || rol === 'DUEÑO';
  }

  private async contarElevadosHabilitados(exceptoId?: string): Promise<number> {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        ...filtroNoBorrado,
        habilitado: true,
        rol: { in: [RolUsuario.ADMIN, RolUsuario.DUENO] },
      },
    });
    return usuarios.filter((u) => u.id !== exceptoId).length;
  }

  private async validarElevadosHabilitados(exceptoId?: string): Promise<void> {
    const cantidad = await this.contarElevadosHabilitados(exceptoId);
    if (cantidad < 1) {
      throw new ConflictException(
        'Debe quedar al menos un usuario Administrador o Dueño habilitado.',
      );
    }
  }

  private async nombreUsuarioOcupado(nombreUsuario: string, exceptoId?: string): Promise<boolean> {
    const clave = normalizarNombreUsuario(nombreUsuario);
    const usuarios = await this.prisma.usuario.findMany({
      where: filtroNoBorrado,
      select: { id: true, nombreUsuario: true },
    });
    return usuarios.some(
      (u) => u.id !== exceptoId && normalizarNombreUsuario(u.nombreUsuario) === clave,
    );
  }

  async listar(): Promise<UsuarioApi[]> {
    const filas = await this.prisma.usuario.findMany({
      where: filtroNoBorrado,
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
    return filas.map((u) => this.mapearUsuario(u));
  }

  async obtenerPorId(id: string): Promise<UsuarioApi> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    return this.mapearUsuario(usuario);
  }

  async crear(datos: CrearUsuarioDto, operador: UsuarioSesion): Promise<UsuarioApi> {
    if (this.intentaAsignarRolAdministrador(null, datos.rol)) {
      throw new ForbiddenException(
        'El rol Administrador no puede asignarse desde la aplicación. Es exclusivo de la cuenta principal del sistema.',
      );
    }

    if (this.dueñoIntentaGestionarAdministrador(operador, datos.rol)) {
      throw new ForbiddenException('Un usuario Dueño no puede crear cuentas con rol Administrador.');
    }

    const nombre = datos.nombre.trim();
    const apellido = datos.apellido.trim();
    if (!nombre) throw new BadRequestException('El nombre es obligatorio.');
    if (!apellido) throw new BadRequestException('El apellido es obligatorio.');
    if (!datos.nombreUsuario.trim()) {
      throw new BadRequestException('El nombre de usuario es obligatorio.');
    }
    if (!datos.contrasenaPlano) {
      throw new BadRequestException('La contraseña es obligatoria para el alta.');
    }
    if (await this.nombreUsuarioOcupado(datos.nombreUsuario)) {
      throw new ConflictException('Ese nombre de usuario ya existe.');
    }

    const rolDb = rolHaciaBaseDeDatos(datos.rol);
    const hash = await bcrypt.hash(datos.contrasenaPlano, RONDAS_BCRYPT);

    const id = await this.idSecuencia.siguienteUsuario();
    const creado = await this.prisma.usuario.create({
      data: {
        id,
        nombre,
        apellido,
        nombreUsuario: datos.nombreUsuario.trim(),
        contrasenaHash: hash,
        contrasenaEstaBlanqueada: false,
        debeCambiarContrasena: true,
        rol: rolDb,
        habilitado: datos.habilitado ?? true,
        permisosJson: permisosPorDefectoSegunRol(rolDb) as unknown as Prisma.InputJsonValue,
      },
    });

    await this.validarElevadosHabilitados();

    return this.mapearUsuario(creado);
  }

  async actualizar(
    id: string,
    datos: ActualizarUsuarioDto,
    operador: UsuarioSesion,
  ): Promise<UsuarioApi> {
    const anterior = await this.prisma.usuario.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!anterior) throw new NotFoundException('Usuario no encontrado.');

    if (this.dueñoIntentaGestionarAdministrador(operador, anterior.rol)) {
      throw new ForbiddenException('No tenés permiso para modificar cuentas administradoras.');
    }

    const nombre = datos.nombre.trim();
    const apellido = datos.apellido.trim();
    if (!nombre) throw new BadRequestException('El nombre es obligatorio.');
    if (!apellido) throw new BadRequestException('El apellido es obligatorio.');
    if (!datos.nombreUsuario.trim()) {
      throw new BadRequestException('El nombre de usuario es obligatorio.');
    }
    if (await this.nombreUsuarioOcupado(datos.nombreUsuario, id)) {
      throw new ConflictException('Ese nombre de usuario ya está en uso.');
    }
    if (this.intentaAsignarRolAdministrador(anterior.rol, datos.rol)) {
      throw new ForbiddenException(
        'El rol Administrador no puede asignarse desde la aplicación. Es exclusivo de la cuenta principal del sistema.',
      );
    }

    if (this.intentaQuitarRolAdministrador(anterior.rol, datos.rol)) {
      throw new ForbiddenException(
        'No se puede cambiar el rol de una cuenta Administrador desde la aplicación.',
      );
    }

    if (this.dueñoIntentaGestionarAdministrador(operador, datos.rol)) {
      throw new ForbiddenException('Un usuario Dueño no puede asignar el rol Administrador.');
    }

    const rolDb = rolHaciaBaseDeDatos(datos.rol);
    let contrasenaHash = anterior.contrasenaHash;
    let contrasenaEstaBlanqueada = anterior.contrasenaEstaBlanqueada;
    let debeCambiarContrasena = anterior.debeCambiarContrasena;

    if (datos.contrasenaPlano != null && datos.contrasenaPlano.length > 0) {
      contrasenaHash = await bcrypt.hash(datos.contrasenaPlano, RONDAS_BCRYPT);
      contrasenaEstaBlanqueada = false;
      debeCambiarContrasena = true;
    } else if (anterior.contrasenaEstaBlanqueada) {
      contrasenaEstaBlanqueada = true;
    }

    let permisosJson: Prisma.InputJsonValue = anterior.permisosJson as Prisma.InputJsonValue;
    if (anterior.rol !== rolDb) {
      permisosJson = permisosPorDefectoSegunRol(rolDb) as unknown as Prisma.InputJsonValue;
    }

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        nombre,
        apellido,
        nombreUsuario: datos.nombreUsuario.trim(),
        contrasenaHash,
        contrasenaEstaBlanqueada,
        debeCambiarContrasena,
        rol: rolDb,
        habilitado: datos.habilitado,
        permisosJson,
      },
    });

    await this.validarElevadosHabilitados();

    return this.mapearUsuario(actualizado);
  }

  async actualizarPermisos(
    id: string,
    permisos: ActualizarPermisosUsuarioDto,
    operador: UsuarioSesion,
  ): Promise<UsuarioApi> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    if (this.dueñoIntentaGestionarAdministrador(operador, usuario.rol)) {
      throw new ForbiddenException('No tenés permiso para modificar permisos de cuentas administradoras.');
    }

    const permisosCompletos: PermisosOperativosUsuario = {
      ...permisos,
      menusVisibles: menusVisiblesResueltos(permisos.menusVisibles),
    };

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: { permisosJson: permisosCompletos as unknown as Prisma.InputJsonValue },
    });
    return this.mapearUsuario(actualizado);
  }

  async establecerHabilitacion(
    id: string,
    habilitado: boolean,
    operador: UsuarioSesion,
  ): Promise<UsuarioApi> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    if (this.dueñoIntentaGestionarAdministrador(operador, usuario.rol)) {
      throw new ForbiddenException('No tenés permiso para cambiar el estado de cuentas administradoras.');
    }

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: { habilitado },
    });

    if (!habilitado && (usuario.rol === RolUsuario.ADMIN || usuario.rol === RolUsuario.DUENO)) {
      await this.validarElevadosHabilitados(id);
    } else {
      await this.validarElevadosHabilitados();
    }

    return this.mapearUsuario(actualizado);
  }

  async blanquearContrasenia(id: string, operador: UsuarioSesion): Promise<UsuarioApi> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    if (this.dueñoIntentaGestionarAdministrador(operador, usuario.rol)) {
      throw new ForbiddenException('No tenés permiso para blanquear contraseñas de cuentas administradoras.');
    }

    const validacion = await this.validarOperadorPuedeBlanquear(operador, id);
    if (validacion !== true) {
      throw new ForbiddenException(validacion);
    }

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        contrasenaEstaBlanqueada: true,
        contrasenaHash: await bcrypt.hash('', RONDAS_BCRYPT),
      },
    });
    return this.mapearUsuario(actualizado);
  }

  async eliminar(id: string, operador: UsuarioSesion): Promise<void> {
    const total = await this.prisma.usuario.count({
      where: filtroNoBorrado,
    });
    if (total <= 1) {
      throw new ConflictException('No podés borrar el único usuario cargado.');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: { id, ...filtroNoBorrado },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado.');
    if (this.dueñoIntentaGestionarAdministrador(operador, usuario.rol)) {
      throw new ForbiddenException('No tenés permiso para eliminar cuentas administradoras.');
    }

    if (operador.id === id) {
      throw new ConflictException(
        'No podés eliminar tu propia cuenta mientras iniciaste sesión con ella.',
      );
    }

    if (
      usuario.habilitado &&
      (usuario.rol === RolUsuario.ADMIN || usuario.rol === RolUsuario.DUENO)
    ) {
      const restantes = await this.contarElevadosHabilitados(id);
      if (restantes === 0) {
        throw new ConflictException(
          'Eliminar este usuario dejaría al sistema sin cuenta Administradora o Dueña habilitada.',
        );
      }
    }

    await this.prisma.usuario.update({
      where: { id },
      data: datosMarcarBorrado(),
    });

    await this.validarElevadosHabilitados();
  }

  private async validarOperadorPuedeBlanquear(
    operador: UsuarioSesion,
    idUsuarioObjetivo: string,
  ): Promise<true | string> {
    const operadorDb = await this.prisma.usuario.findFirst({
      where: { id: operador.id, ...filtroNoBorrado },
    });
    if (!operadorDb) return 'Tu usuario no figura en el directorio de gestión.';

    const rolOperador = rolDesdeBaseDeDatos(operadorDb.rol);
    if (this.esRolElevado(rolOperador)) return true;

    const permisos = operadorDb.permisosJson as unknown as PermisosOperativosUsuario;
    if (!permisos.puedeBlanquearContrasenaUsuario) {
      return 'No tenés permiso para blanquear contraseñas.';
    }
    if (idUsuarioObjetivo !== operador.id) {
      return 'Con tu perfil solo podés blanquear la contraseña de tu propia cuenta.';
    }
    return true;
  }
}
