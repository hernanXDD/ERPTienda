import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AnularCuponDescuentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
