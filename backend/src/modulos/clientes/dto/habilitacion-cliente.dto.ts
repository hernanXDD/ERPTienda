import { IsBoolean } from 'class-validator';

export class HabilitacionClienteDto {
  @IsBoolean()
  habilitado!: boolean;
}
