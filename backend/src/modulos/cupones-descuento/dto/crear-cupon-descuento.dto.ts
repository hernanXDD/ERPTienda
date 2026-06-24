import { TipoDescuentoCupon } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class CrearCuponDescuentoDto {
  @IsOptional()
  @IsEnum(TipoDescuentoCupon)
  tipoDescuento?: TipoDescuentoCupon;

  @ValidateIf(
    (datos: CrearCuponDescuentoDto) =>
      !datos.tipoDescuento || datos.tipoDescuento === TipoDescuentoCupon.porcentaje,
  )
  @IsNumber()
  @Min(0.01)
  @Max(100)
  @Type(() => Number)
  porcentajeDescuento?: number;

  @ValidateIf((datos: CrearCuponDescuentoDto) => datos.tipoDescuento === TipoDescuentoCupon.monto_fijo)
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  montoDescuento?: number;

  @IsDateString()
  fechaVencimiento!: string;

  @IsOptional()
  @EsIdEntidad()
  clienteId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombreClienteMostrar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentoClienteMostrar?: string;

  @IsOptional()
  @EsIdEntidad()
  devolucionId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
