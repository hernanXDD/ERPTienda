import { Module } from '@nestjs/common';
import { ConfiguracionSistemaController } from './configuracion-sistema.controller';
import { ConfiguracionSistemaService } from './configuracion-sistema.service';

@Module({
  controllers: [ConfiguracionSistemaController],
  providers: [ConfiguracionSistemaService],
  exports: [ConfiguracionSistemaService],
})
export class ConfiguracionSistemaModule {}
