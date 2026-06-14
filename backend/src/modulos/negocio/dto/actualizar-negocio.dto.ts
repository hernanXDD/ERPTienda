import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class ActualizarNegocioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuit?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  correoElectronico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  provincia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  codigoPostal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  instagram?: string;

  @IsOptional()
  @IsBoolean()
  mostrarInstagram?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  twitter?: string;

  @IsOptional()
  @IsBoolean()
  mostrarTwitter?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tiktok?: string;

  @IsOptional()
  @IsBoolean()
  mostrarTiktok?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  temaClaroColorAcento?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  temaClaroColorFondo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  temaClaroColorSuperficie?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  temaClaroColorCabecera?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  temaClaroColorTexto?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  temaClaroColorBorde?: string;
}
