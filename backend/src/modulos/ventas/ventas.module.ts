import { Module } from '@nestjs/common';
import { CuponesDescuentoModule } from '../cupones-descuento/cupones-descuento.module';
import { CuentaCorrienteModule } from '../cuenta-corriente/cuenta-corriente.module';
import { StockModule } from '../stock/stock.module';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [StockModule, CuentaCorrienteModule, CuponesDescuentoModule],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
