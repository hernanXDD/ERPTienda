import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { RolUsuarioApi } from '../../../comunes/tipos/rol-usuario-api';

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

  @IsOptional()
  @IsString()
  contrasenaPlano?: string | null;

  @IsIn(['ADMIN', 'DUEÑO', 'EMPLEADO'])
  rol!: RolUsuarioApi;

  @IsBoolean()
  habilitado!: boolean;
}
