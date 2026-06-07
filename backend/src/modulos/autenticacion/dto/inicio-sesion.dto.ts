import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InicioSesionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  nombreUsuario!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  contrasena!: string;
}
