import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import { RequierePermiso } from '../../comunes/decoradores/requiere-permiso.decorator';
import { respuestaOk } from '../../comunes/dto/respuesta-api';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { PermisosGuard } from '../../comunes/guards/permisos.guard';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { AjusteConteoDto } from './dto/ajuste-conteo.dto';
import { EntradaManualDto } from './dto/entrada-manual.dto';
import { ImportarConteoDto } from './dto/importar-conteo.dto';
import { ListarAuditoriasDto } from './dto/listar-auditorias.dto';
import { StockService } from './stock.service';
import { MotivosStockService } from './motivos-stock.service';

@Controller('stock')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly motivosStockService: MotivosStockService,
  ) {}

  @Get('motivos')
  async listarMotivos() {
    const datos = await this.motivosStockService.listarActivos();
    return respuestaOk(datos, 'Motivos de stock obtenidos correctamente.');
  }

  @Get('movimientos')
  async listarMovimientos(
    @Query('varianteId') varianteId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    const datos = await this.stockService.listarMovimientos({
      varianteId,
      fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
      fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
    });
    return respuestaOk(datos, 'Movimientos de stock obtenidos correctamente.');
  }

  @Get('cantidad/:varianteId')
  async obtenerCantidad(@Param('varianteId') varianteId: string) {
    const cantidad = await this.stockService.obtenerCantidad(varianteId);
    return respuestaOk({ varianteId, cantidad }, 'Cantidad obtenida correctamente.');
  }

  @Get('resumen')
  async obtenerResumen() {
    const datos = await this.stockService.obtenerResumen();
    return respuestaOk(datos, 'Resumen de stock obtenido correctamente.');
  }

  @Get('auditorias')
  async listarAuditorias(@Query() filtros: ListarAuditoriasDto) {
    const datos = await this.stockService.listarAuditorias(filtros);
    return respuestaOk(datos, 'Auditorías de stock obtenidas correctamente.');
  }

  @Get('auditorias/:id')
  async obtenerAuditoria(@Param('id') id: string) {
    const datos = await this.stockService.obtenerAuditoriaPorId(id);
    return respuestaOk(datos, 'Detalle de auditoría obtenido correctamente.');
  }

  @Post('ajuste-conteo')
  @RequierePermiso('puedeAjustarStock')
  async ajusteConteo(
    @Body() datos: AjusteConteoDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const resultado = await this.stockService.aplicarAjustePorConteo(datos, operador.id);
    return respuestaOk(resultado, 'Ajuste por conteo registrado correctamente.');
  }

  @Post('importar-conteo')
  @RequierePermiso('puedeAjustarStock')
  async importarConteo(
    @Body() datos: ImportarConteoDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const resultado = await this.stockService.importarConteoMasivo(datos, operador.id);
    return respuestaOk(resultado, 'Importación de conteo registrada correctamente.');
  }

  @Post('entrada-manual')
  @RequierePermiso('puedeAjustarStock')
  async entradaManual(
    @Body() datos: EntradaManualDto,
    @UsuarioSesionActual() operador: UsuarioSesion,
  ) {
    const resultado = await this.stockService.aplicarEntradaManual(datos, operador.id);
    return respuestaOk(resultado, 'Entrada manual registrada correctamente.');
  }
}
