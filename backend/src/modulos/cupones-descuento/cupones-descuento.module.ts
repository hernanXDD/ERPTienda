import { Module } from '@nestjs/common';
import { CuponesDescuentoController } from './cupones-descuento.controller';
import { CuponesDescuentoService } from './cupones-descuento.service';

@Module({
  controllers: [CuponesDescuentoController],
  providers: [CuponesDescuentoService],
  exports: [CuponesDescuentoService],
})
export class CuponesDescuentoModule {}
