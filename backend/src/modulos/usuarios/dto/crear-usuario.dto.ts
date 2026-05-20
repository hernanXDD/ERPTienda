import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { RolUsuarioApi } from '../../../comunes/tipos/rol-usuario-api';

export class CrearUsuarioDto {
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

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  contrasenaPlano!: string;

  @IsIn(['ADMIN', 'DUEÑO', 'EMPLEADO'])
  rol!: RolUsuarioApi;

  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}
