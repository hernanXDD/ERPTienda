import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { RolUsuarioApi } from '../../../comunes/tipos/rol-usuario-api';
import { EsContrasenaSegura } from '../../../comunes/validadores/es-contrasena-segura.decorator';

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
  @EsContrasenaSegura()
  contrasenaPlano!: string;

  @IsIn(['ADMIN', 'DUEÑO', 'EMPLEADO'])
  rol!: RolUsuarioApi;

  @IsOptional()
  @IsBoolean()
  habilitado?: boolean;
}
