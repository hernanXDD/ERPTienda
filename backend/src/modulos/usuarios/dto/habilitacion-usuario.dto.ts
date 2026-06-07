import { IsBoolean } from 'class-validator';

export class HabilitacionUsuarioDto {
  @IsBoolean()
  habilitado!: boolean;
}
