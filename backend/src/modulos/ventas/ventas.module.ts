import { Module } from '@nestjs/common';
import { CuentaCorrienteModule } from '../cuenta-corriente/cuenta-corriente.module';
import { StockModule } from '../stock/stock.module';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [StockModule, CuentaCorrienteModule],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
