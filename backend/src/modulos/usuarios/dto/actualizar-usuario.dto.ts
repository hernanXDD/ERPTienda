import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import type { RolUsuarioApi } from '../../../comunes/tipos/rol-usuario-api';
import { EsContrasenaSegura } from '../../../comunes/validadores/es-contrasena-segura.decorator';

export class ActualizarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  apellido!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  nombreUsuario!: string;

  @ValidateIf(
    (dto: ActualizarUsuarioDto) =>
      typeof dto.contrasenaPlano === 'string' && dto.contrasenaPlano.length > 0,
  )
  @IsString()
  @EsContrasenaSegura()
  contrasenaPlano?: string | null;

  @IsIn(['ADMIN', 'DUEÑO', 'EMPLEADO'])
  rol!: RolUsuarioApi;

  @IsBoolean()
  habilitado!: boolean;
}
