import { Module } from '@nestjs/common';
import { TallesCatalogoController } from './talles-catalogo.controller';
import { TallesCatalogoService } from './talles-catalogo.service';

@Module({
  controllers: [TallesCatalogoController],
  providers: [TallesCatalogoService],
  exports: [TallesCatalogoService],
})
export class TallesCatalogoModule {}
