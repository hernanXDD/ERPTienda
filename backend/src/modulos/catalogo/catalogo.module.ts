import { Module } from '@nestjs/common';
import { ConfiguracionSistemaModule } from '../configuracion-sistema/configuracion-sistema.module';
import { CatalogoController } from './catalogo.controller';
import { CatalogoService } from './catalogo.service';

@Module({
  imports: [ConfiguracionSistemaModule],
  controllers: [CatalogoController],
  providers: [CatalogoService],
  exports: [CatalogoService],
})
export class CatalogoModule {}
