import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoAuditoriaStock } from '@prisma/client';

const TIPOS_AUDITORIA: TipoAuditoriaStock[] = ['venta', 'compra', 'conteo'];

export class ListarAuditoriasDto {
  @IsOptional()
  @IsIn(TIPOS_AUDITORIA)
  tipo?: TipoAuditoriaStock;

  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  busqueda?: string;
}
